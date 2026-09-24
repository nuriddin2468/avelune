import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { imageVariable, isPinnedContainer } from './environment.ts';
import { imageBrowsersPath, playwrightImage } from './image.ts';

describe('isPinnedContainer', () => {
  const container = {
    env: { [imageVariable]: playwrightImage, PLAYWRIGHT_BROWSERS_PATH: imageBrowsersPath },
    platform: 'linux',
    arch: 'x64',
  };

  it('accepts the pinned image on amd64', () => {
    assert.equal(isPinnedContainer(container), true);
  });

  it('rejects every other combination', () => {
    const other = 'mcr.microsoft.com/playwright:v1.62.0-noble@sha256:' + '0'.repeat(64);
    assert.equal(isPinnedContainer({ ...container, env: { PLAYWRIGHT_BROWSERS_PATH: imageBrowsersPath } }), false);
    assert.equal(isPinnedContainer({ ...container, env: { ...container.env, [imageVariable]: other } }), false);
    assert.equal(isPinnedContainer({ ...container, env: { [imageVariable]: playwrightImage } }), false);
    assert.equal(isPinnedContainer({ ...container, platform: 'darwin' }), false);
    assert.equal(isPinnedContainer({ ...container, arch: 'arm64' }), false);
  });
});
