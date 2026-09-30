import assert from 'node:assert/strict';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import stylelint from 'stylelint';
import { plugins } from './index.ts';

const tokens = join(import.meta.dirname, '..', '..', 'fixtures', 'stylelint-tokens.css');

/** A miniature @avelune/ui whose entry points declare their layers: `button` (components), `list-page` (patterns). */
const library = join(import.meta.dirname, '..', '..', 'fixtures', 'library');

/** The rule names and words of every finding, in order; `file` lints the code as that file. */
async function lint(code: string, rules: Record<string, unknown>, file?: string): Promise<readonly string[]> {
  const { results } = await stylelint.lint({
    code,
    config: { plugins, rules },
    ...(file === undefined ? {} : { codeFilename: file }),
  });
  return (results[0]?.warnings ?? []).map((warning) => `${warning.rule}: ${warning.text}`);
}

describe('avelune/media-query-tokens', () => {
  const rules = { 'avelune/media-query-tokens': [true, { tokens }] };

  it('accepts breakpoint values in media queries and container values in container queries', async () => {
    const code = `
      @media (min-width: 600px) {}
      @media (width >= 840px) and (prefers-reduced-motion: reduce) {}
      @media (600px <= width < 1200px) {}
      @media (forced-colors: active) {}
      @container (min-width: 480px) {}
      @container sidebar (inline-size >= 320px) {}
    `;
    assert.deepEqual(await lint(code, rules), []);
  });

  it('rejects any other width', async () => {
    const found = await lint(
      `@media (min-width: 700px) {}
       @media (max-width: 599.98px) {}
       @media (min-width: 40rem) {}
       @container (min-width: 600px) {}
       @container (inline-size > 500px) {}`,
      rules,
    );
    assert.equal(found.length, 5);
    assert.match(found[0] ?? '', /700px is not a breakpoint token; use one of 600px, 840px, 1200px, 1600px/);
    assert.match(found[3] ?? '', /600px is not a container token; use one of 320px, 480px, 640px, 960px/);
  });
});

describe('avelune/component-layer', () => {
  const rules = { 'avelune/component-layer': 'components' };

  it('accepts rules inside @layer components and top-level comments', async () => {
    assert.deepEqual(await lint('/* Button. */\n@layer components { :host { display: inline-flex; } }', rules), []);
  });

  it('rejects rules outside it, and other layers', async () => {
    const found = await lint(':host { display: block; }\n@layer app { a {} }\n@layer components;', rules);
    assert.equal(found.length, 3);
  });

  it('accepts any of a list of layers, and names them all when it rejects', async () => {
    const list = { 'avelune/component-layer': [['reset', 'base', 'utilities']] };
    assert.deepEqual(await lint('@layer reset { * {} }\n@layer base { a {} }\n@layer utilities { .x {} }', list), []);
    assert.deepEqual(await lint('@layer components { a {} }', list), [
      'avelune/component-layer: Put this inside @layer reset | base | utilities { … }; kit styles are layered (ADR 0004, 0030, 0091). (avelune/component-layer)',
    ]);
  });

  it("takes the layer from the entry point's entry.json: patterns for a pattern, the default for the rest", async () => {
    const byEntry = { 'avelune/component-layer': ['components', { entryLayers: { patterns: 'patterns' } }] };
    const pattern = join(library, 'list-page', 'list-page.css');
    const component = join(library, 'button', 'button.css');
    assert.deepEqual(await lint('@layer patterns { :host { display: block; } }', byEntry, pattern), []);
    assert.deepEqual(await lint('@layer components { :host { display: block; } }', byEntry, pattern), [
      'avelune/component-layer: Put this inside @layer patterns { … }; kit styles are layered (ADR 0004, 0030, 0091). (avelune/component-layer)',
    ]);
    assert.deepEqual(await lint('@layer components { :host {} }', byEntry, component), []);
    assert.equal((await lint('@layer patterns { :host {} }', byEntry, component)).length, 1);
    // A stylesheet outside every entry point, and code without a file, take the default.
    assert.deepEqual(await lint('@layer components { a {} }', byEntry, join(library, 'styles.css')), []);
    assert.deepEqual(await lint('@layer components { a {} }', byEntry), []);
  });
});

describe('avelune/pattern-layout-only', () => {
  const rules = { 'avelune/pattern-layout-only': true };
  const pattern = join(library, 'list-page', 'list-page.css');

  it('lets a pattern place kit elements and style its own', async () => {
    const code = `
      .menu { color: red; }
      :host { display: block; container-type: inline-size; }
      .bar > button[aveIconButton].menu { display: none; margin-inline-start: auto; }
      ave-sidebar-nav { grid-column: 1 / -1; inline-size: 100%; }
      ave-card:not(.wide) { max-inline-size: 50%; }
      @container (inline-size >= 640px) { ave-card { grid-area: detail; } }
      .item[data-state='open'] { background-color: blue; }
    `;
    assert.deepEqual(await lint(code, rules, pattern), []);
  });

  it('rejects any other property on a kit element, also nested and inside a query', async () => {
    const code = `
      ave-card { border-radius: 0; }
      .bar button[aveIconButton] { color: red; }
      ave-tag { &:hover { background-color: blue; } }
      @container (inline-size >= 640px) { [aveCardTitle] { font-size: 2em; } }
      ave-badge { --ave-color-bg-accent: red; }
    `;
    const found = await lint(code, rules, pattern);
    assert.equal(found.length, 5, found.join('\n'));
    assert.match(found[0] ?? '', /border-radius on "ave-card" is not a layout property/);
  });

  it('leaves the stylesheets of every other entry point alone', async () => {
    const code = 'ave-card { border-radius: 0; }';
    assert.deepEqual(await lint(code, rules, join(library, 'button', 'button.css')), []);
    assert.deepEqual(await lint(code, rules), []);
  });
});

describe('avelune/layer-order', () => {
  const rules = { 'avelune/layer-order': [['reset', 'tokens', 'app']] };

  it('accepts the order as the first statement, after comments', async () => {
    assert.deepEqual(await lint("/* Entry. */\n@layer reset, tokens, app;\n@import url('a.css');", rules), []);
  });

  it('rejects a missing statement, another order, and a second statement', async () => {
    assert.deepEqual(await lint("@import url('a.css');", rules), [
      'avelune/layer-order: Start the stylesheet with @layer reset, tokens, app; (ADR 0030). (avelune/layer-order)',
    ]);
    assert.deepEqual(await lint('@layer tokens, reset, app;', rules), [
      'avelune/layer-order: The layer order is reset, tokens, app, not tokens, reset, app (ADR 0004, 0030). (avelune/layer-order)',
    ]);
    assert.deepEqual(await lint('@layer reset, tokens, app;\n@layer app;', rules), [
      'avelune/layer-order: Declare the layer order once, at the top of the stylesheet (ADR 0030). (avelune/layer-order)',
    ]);
    assert.deepEqual(await lint('', rules), [
      'avelune/layer-order: Start the stylesheet with @layer reset, tokens, app; (ADR 0030). (avelune/layer-order)',
    ]);
  });
});

describe('avelune/nesting-same-element', () => {
  const rules = { 'avelune/nesting-same-element': true };

  it('accepts nested rules that refine the parent element', async () => {
    const code = `.card {
      &:hover {}
      &::before {}
      &[aria-disabled='true'] {}
      &[data-size='sm']:focus-visible {}
      &:not([aria-disabled='true'], [data-state='open']):hover {}
      @media (forced-colors: active) { &:focus-visible {} }
    }`;
    assert.deepEqual(await lint(code, rules), []);
  });

  it('rejects refinements of :host, which the shim scopes to the content since Angular 22.2', async () => {
    const code = `:host { &:focus-visible {} }
    :host([data-size='sm']) { @media (forced-colors: active) { &:hover {} } }
    :host-context([data-theme='dark']) { &::before {} }`;
    const found = await lint(code, rules);
    assert.deepEqual(
      found.map((finding) => /Nested "(.+?)" refines :host/.exec(finding)?.[1]),
      ['&:focus-visible', '&:hover', '&::before'],
    );
  });

  it('rejects nested rules that reach another element, also through at-rules', async () => {
    const code = `.card {
      .title {}
      & .icon {}
      & > .body {}
      &:hover .icon {}
      :host & {}
      &.active {}
      @media (min-width: 600px) { .title {} }
    }
    :host { @container (min-width: 480px) { .icon {} } }`;
    const found = await lint(code, rules);
    assert.deepEqual(
      found.map((finding) => /Nested "(.+?)"/.exec(finding)?.[1]),
      ['.title', '& .icon', '& > .body', '&:hover .icon', ':host &', '&.active', '.title', '.icon'],
    );
  });
});
