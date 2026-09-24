// The showcase suite (brief §5.4, §8.2; ADR 0027): axe and the cross-component invariants on every showcase screen.
// It runs only in the pinned container, in the environment of the visual suite; start it with
// `pnpm nx run invariants:e2e`.
import { defineConfig } from '@playwright/test';
import { fixedEnvironment, requireContainer, staticServer, workspaceRoot } from '@avelune/visual';
import { join } from 'node:path';

requireContainer();

const port = 6107;
const output = join(workspaceRoot, 'dist', 'tools', 'invariants');

/** The built showcase, or a fixture site (the proof sets AVELUNE_INVARIANTS_SITE). */
const site = process.env['AVELUNE_INVARIANTS_SITE'] ?? join('dist', 'apps', 'showcase', 'browser');

const matrix = [
  { name: 'light-1280', colorScheme: 'light', viewport: { width: 1280, height: 800 } },
  { name: 'dark-1280', colorScheme: 'dark', viewport: { width: 1280, height: 800 } },
  { name: 'light-390', colorScheme: 'light', viewport: { width: 390, height: 844 } },
  { name: 'dark-390', colorScheme: 'dark', viewport: { width: 390, height: 844 } },
] as const;

export default defineConfig({
  testDir: 'src',
  testMatch: '*.e2e.ts',
  outputDir: join(output, 'results'),
  fullyParallel: true,
  forbidOnly: true,
  // Emulated amd64 on Apple Silicon is slow; the same budget as the visual suite.
  timeout: 90_000,
  retries: 0,
  reporter: [['list'], ['html', { outputFolder: join(output, 'report'), open: 'never' }]],
  use: { ...fixedEnvironment, baseURL: `http://127.0.0.1:${String(port)}` },
  // Fixture sites load the tokens and fonts from these prefixes; the showcase bundles its own.
  webServer: staticServer({
    port,
    root: site,
    mounts: { '/tokens': 'packages/tokens/dist', '/fonts': 'packages/ui/styles/fonts' },
    spa: true,
  }),
  projects: matrix.map(({ name, colorScheme, viewport }) => ({ name, use: { colorScheme, viewport } })),
});
