// The Storybook suite (ADR 0006, 0010, 0027): every story in both themes at 1280 and 390 px, compared with its
// committed baseline and swept by axe. It runs only in the pinned container; start it with `pnpm nx run visual:e2e`.
import { defineConfig } from '@playwright/test';
import { join, relative } from 'node:path';
import { fixedEnvironment, requireContainer, staticServer, workspaceRoot } from './src/environment.ts';
import { baselinesDir, siteDir } from './src/story-index.ts';

requireContainer();

const port = 6106;
const output = join(workspaceRoot, 'dist', 'tools', 'visual');

/** Theme × viewport. The theme sets `prefers-color-scheme` here and Storybook's theme global in the spec. */
const matrix = [
  { name: 'light-1280', colorScheme: 'light', viewport: { width: 1280, height: 800 } },
  { name: 'dark-1280', colorScheme: 'dark', viewport: { width: 1280, height: 800 } },
  { name: 'light-390', colorScheme: 'light', viewport: { width: 390, height: 844 } },
  { name: 'dark-390', colorScheme: 'dark', viewport: { width: 390, height: 844 } },
] as const;

export default defineConfig({
  testDir: 'src',
  outputDir: join(output, 'results'),
  snapshotPathTemplate: `${baselinesDir}/{arg}{ext}`,
  fullyParallel: true,
  forbidOnly: true,
  // Emulated amd64 on Apple Silicon is slow: axe on the long contrast table can pass 30 seconds under load.
  timeout: 90_000,
  retries: 0,
  // A missing or changed baseline fails; only `--update` (container.ts) writes baselines.
  updateSnapshots: 'none',
  reporter: [['list'], ['html', { outputFolder: join(output, 'report'), open: 'never' }]],
  expect: {
    toHaveScreenshot: {
      // Per-pixel colour distance, and not one differing pixel (ADR 0010). A story that needs a tolerance sets it
      // itself, with a comment and an issue link.
      threshold: 0.1,
      maxDiffPixels: 0,
      animations: 'disabled',
      caret: 'hide',
      scale: 'css',
    },
  },
  use: { ...fixedEnvironment, baseURL: `http://127.0.0.1:${String(port)}` },
  webServer: staticServer({ port, root: relative(workspaceRoot, siteDir) }),
  projects: [
    ...matrix.map(({ name, colorScheme, viewport }) => ({
      name,
      testMatch: 'stories.e2e.ts',
      use: { colorScheme, viewport },
    })),
    { name: 'baselines', testMatch: 'baselines.e2e.ts' },
  ],
});
