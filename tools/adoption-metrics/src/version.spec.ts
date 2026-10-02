// Proves the kit version lag (ADR 0105): the first part that differs and by how much, a range read as its lowest
// version, a repository without the kit, and a latest that is no version.
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { installedVersion, lag } from './version.ts';

describe('lag', () => {
  it('names the first part that differs and the distance in it', () => {
    assert.deepEqual(lag('0.3.1', '0.3.1'), { installed: '0.3.1', latest: '0.3.1', behind: 'none', distance: 0 });
    assert.deepEqual(lag('0.3.0', '0.3.4'), { installed: '0.3.0', latest: '0.3.4', behind: 'patch', distance: 4 });
    assert.deepEqual(lag('0.1.9', '0.3.0'), { installed: '0.1.9', latest: '0.3.0', behind: 'minor', distance: 2 });
    assert.deepEqual(lag('0.9.0', '2.0.0'), { installed: '0.9.0', latest: '2.0.0', behind: 'major', distance: 2 });
  });

  it('is not behind when ahead, and says when the kit is not installed', () => {
    assert.deepEqual(lag('0.4.0', '0.3.1'), { installed: '0.4.0', latest: '0.3.1', behind: 'none', distance: 0 });
    assert.deepEqual(lag(null, '0.3.1'), { installed: null, latest: '0.3.1', behind: 'not-installed', distance: 0 });
  });

  it('refuses a latest that is no version', () => {
    assert.throws(() => lag('0.1.0', 'next'), /--latest next is not a version/);
  });
});

describe('installedVersion', () => {
  const repository = (manifest: unknown) => {
    const root = mkdtempSync(join(tmpdir(), 'adoption-version-'));
    writeFileSync(join(root, 'package.json'), JSON.stringify(manifest));
    return root;
  };

  it('reads a range as its lowest version, from dependencies or devDependencies', () => {
    assert.equal(installedVersion(repository({ dependencies: { '@avelune/ui': '^0.2.3' } })), '0.2.3');
    assert.equal(installedVersion(repository({ devDependencies: { '@avelune/ui': '~1.4.0' } })), '1.4.0');
  });

  it('is null without the kit or without a package.json', () => {
    assert.equal(installedVersion(repository({ dependencies: { '@angular/core': '^22.2.0' } })), null);
    assert.equal(installedVersion(mkdtempSync(join(tmpdir(), 'adoption-empty-'))), null);
  });
});
