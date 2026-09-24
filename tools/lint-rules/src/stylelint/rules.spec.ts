import assert from 'node:assert/strict';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import stylelint from 'stylelint';
import { plugins } from './index.ts';

const tokens = join(import.meta.dirname, '..', '..', 'fixtures', 'stylelint-tokens.css');

/** The rule names and words of every finding, in order. */
async function lint(code: string, rules: Record<string, unknown>): Promise<readonly string[]> {
  const { results } = await stylelint.lint({ code, config: { plugins, rules } });
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
    }
    :host { &:focus-visible {} }`;
    assert.deepEqual(await lint(code, rules), []);
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
