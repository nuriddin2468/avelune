import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';

describe('build', () => {
  const outDir = mkdtempSync(join(tmpdir(), 'avelune-tokens-'));
  let css = '';
  let ts = '';

  before(() => {
    const result = spawnSync(process.execPath, [join(import.meta.dirname, 'build.ts'), '--out', outDir], {
      encoding: 'utf8',
    });
    assert.equal(result.status, 0, result.stderr);
    css = readFileSync(join(outDir, 'tokens.css'), 'utf8');
    ts = readFileSync(join(outDir, 'tokens.ts'), 'utf8');
  });

  after(() => rmSync(outDir, { recursive: true, force: true }));

  /** Custom properties declared in the block that starts at `selector`. */
  const block = (selector: string): readonly string[] => {
    const start = css.indexOf(`${selector} {`);
    assert.notEqual(start, -1, `missing block ${selector}`);
    const body = css.slice(start, css.indexOf('}', start));
    return [...body.matchAll(/(--ave-[a-z0-9-]+):/g)].map((match) => match[1] ?? '');
  };

  it('puts every block inside @layer tokens, in cascade order', () => {
    assert.match(css, /^\/\*.*\*\/\n@layer tokens \{\n/);
    const order = [
      ':root {',
      "[data-theme='light'] {",
      '@media (prefers-color-scheme: dark) {',
      ":root:not([data-theme='light']) {",
      "[data-theme='dark'] {",
      "[data-density='compact'] {",
      '@media (prefers-reduced-motion: reduce) {',
      "[data-motion='reduced'] {",
    ].map((marker) => css.indexOf(marker));
    assert.ok(order.every((index) => index !== -1));
    assert.deepEqual(
      order,
      [...order].sort((a, b) => a - b),
    );
  });

  it('sets color-scheme in every theme block', () => {
    assert.equal(css.match(/color-scheme: light;/g)?.length, 2);
    assert.equal(css.match(/color-scheme: dark;/g)?.length, 2);
  });

  it('gives the dark theme exactly the names of the light theme', () => {
    const light = block("[data-theme='light']");
    assert.ok(light.length > 0);
    assert.deepEqual(block("[data-theme='dark']"), light);
    assert.deepEqual(block(":root:not([data-theme='light'])"), light);
  });

  it('emits no primitive', () => {
    for (const primitive of ['--ave-color-neutral-', '--ave-color-orange-', '--ave-color-white', '--ave-dimension-']) {
      assert.ok(!css.includes(primitive), primitive);
    }
    assert.ok(!css.includes('--ave-font-family-ibm-plex-sans'));
    assert.ok(!css.includes('--ave-font-weight-400'));
  });

  it('exports the TokenName union and typed values', () => {
    assert.match(ts, /export type TokenName = keyof typeof tokens;/);
    assert.match(
      ts,
      /"duration\.fast": \{\n {4}cssVar: "--ave-duration-fast",\n {4}type: "duration",\n {4}value: 120,/,
    );
  });
});
