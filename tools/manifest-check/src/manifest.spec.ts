// Proves that the manifest reader refuses what it cannot read, so a Storybook change fails loudly (ADR 0090).
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { readManifest, storiesEntry } from './manifest.ts';

function storybook(manifest: unknown): string {
  const root = mkdtempSync(join(tmpdir(), 'manifest-check-'));
  mkdirSync(join(root, 'manifests'));
  writeFileSync(join(root, 'manifests', 'components.json'), JSON.stringify(manifest));
  return root;
}

describe('readManifest', () => {
  it('fails without a manifest', () => {
    assert.throws(() => readManifest(mkdtempSync(join(tmpdir(), 'manifest-check-'))), /features\.componentsManifest/);
  });

  it('fails on a format it does not read', () => {
    assert.throws(() => readManifest(storybook({ v: 0, components: {} })), /split format/);
  });

  it('fails on a reference to a file the build lacks', () => {
    const root = storybook({
      v: 1,
      components: { 'components-x': { id: 'components-x', docgen: { $ref: '../services/core/docgen/x.json#/a' } } },
    });
    assert.throws(() => readManifest(root), /does not hold/);
  });
});

describe('storiesEntry', () => {
  it('names the entry point of a kit story file only', () => {
    assert.equal(storiesEntry('packages/ui/date-picker/date-range-picker.stories.ts'), 'date-picker');
    assert.equal(storiesEntry('src/foundations/colour.stories.ts'), undefined);
    assert.equal(storiesEntry(undefined), undefined);
  });
});
