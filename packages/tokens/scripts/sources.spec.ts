import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { modes, readManifest, tierOf } from './sources.ts';

const packageRoot = join(import.meta.dirname, '..');

describe('modes of the repository manifest', () => {
  const manifest = readManifest(packageRoot);
  const [base, ...overrides] = modes(manifest);

  it('resolves every non-override file in the base mode and emits all but primitives', () => {
    assert.ok(base !== undefined);
    assert.ok(base.sources.includes('src/semantic.light.tokens.json'));
    assert.ok(!base.sources.includes('src/semantic.dark.tokens.json'));
    assert.ok(base.emits.every((file) => tierOf(manifest, file) !== 'primitive'));
    assert.ok(base.sources.includes('src/primitives.color.tokens.json'));
  });

  it('replaces the base file by the override in each override mode, and emits only the override', () => {
    const dark = overrides.find((mode) => mode.id === 'src/semantic.dark.tokens.json');
    assert.ok(dark !== undefined);
    assert.ok(dark.sources.includes('src/semantic.dark.tokens.json'));
    assert.ok(!dark.sources.includes('src/semantic.light.tokens.json'));
    assert.deepEqual(dark.emits, ['src/semantic.dark.tokens.json']);
  });
});

describe('readManifest rejects', () => {
  const withManifest = (manifest: unknown, check: (root: string) => void) => {
    const root = mkdtempSync(join(tmpdir(), 'avelune-sources-'));
    try {
      writeFileSync(join(root, 'sources.json'), JSON.stringify(manifest));
      check(root);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  };
  const tiers = { primitive: ['p.json'], semantic: ['s.json', 'd.json'], component: [] };

  it('a file listed in two tiers', () => {
    withManifest({ tiers: { ...tiers, component: ['p.json'] }, overrides: {} }, (root) => {
      assert.throws(() => readManifest(root), /p\.json is listed twice/);
    });
  });

  it('an override whose base is not listed', () => {
    withManifest({ tiers, overrides: { 'd.json': { base: 'x.json', names: 'same' } } }, (root) => {
      assert.throws(() => readManifest(root), /needs a "base" that is in a tier/);
    });
  });

  it('an override without a names rule', () => {
    withManifest({ tiers, overrides: { 'd.json': { base: 's.json' } } }, (root) => {
      assert.throws(() => readManifest(root), /"names": "same" or "subset"/);
    });
  });
});
