// The pinned image and the installed Playwright must be the same release (ADR 0010): the image's browsers are the
// ones that Playwright version drives, and a mismatch fails every run with a missing-browser error.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { imageVersion, playwrightImage } from './image.ts';

const require = createRequire(import.meta.url);
const workspaceRoot = join(import.meta.dirname, '..', '..', '..');

describe('pinned image', () => {
  it('is pinned by digest to a Playwright release tag', () => {
    assert.match(playwrightImage, /^mcr\.microsoft\.com\/playwright:v\d+\.\d+\.\d+-noble@sha256:[0-9a-f]{64}$/);
    assert.throws(() => imageVersion('mcr.microsoft.com/playwright:v1.63.0-noble'), /Not a pinned/);
  });

  it('has the version of every installed Playwright package', () => {
    const version = (from: NodeJS.Require, name: string): unknown => {
      const manifest: unknown = from(`${name}/package.json`);
      return typeof manifest === 'object' && manifest !== null ? Reflect.get(manifest, 'version') : null;
    };
    // playwright-core is not a direct dependency: resolve it as @playwright/test and @axe-core/playwright do.
    const fromTest = createRequire(require.resolve('@playwright/test/package.json'));
    const fromAxe = createRequire(require.resolve('@axe-core/playwright'));
    assert.equal(version(require, '@playwright/test'), imageVersion(), '@playwright/test');
    assert.equal(version(require, 'playwright'), imageVersion(), 'playwright');
    assert.equal(
      version(createRequire(fromTest.resolve('playwright/package.json')), 'playwright-core'),
      imageVersion(),
    );
    assert.equal(version(fromAxe, 'playwright-core'), imageVersion(), 'playwright-core of @axe-core/playwright');
  });

  it('has the version the catalog pins', () => {
    const catalog = readFileSync(join(workspaceRoot, 'pnpm-workspace.yaml'), 'utf8');
    for (const name of ["'@playwright/test'", 'playwright']) {
      const pinned = new RegExp(`^  ${name}: (\\S+)$`, 'm').exec(catalog)?.[1];
      assert.equal(pinned, imageVersion(), name);
    }
  });
});
