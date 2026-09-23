// Storybook on @storybook/angular-vite (ADR 0008). Phase 2 runs the Foundations pages; Phase 3 adds addon-vitest,
// the a11y gate and component stories from packages/ui.
import type { StorybookConfig } from '@storybook/angular-vite';
import { join } from 'node:path';

const workspaceRoot = join(import.meta.dirname, '..', '..', '..');

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.ts'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  framework: {
    name: '@storybook/angular-vite',
    // AOT, not the default JIT: templates are compiled and type-checked as in the library build.
    options: { jit: false, compodoc: false, tsconfig: join(import.meta.dirname, '..', 'tsconfig.json') },
  },
  // Storybook collects telemetry by default; nothing leaves the machine.
  core: { disableTelemetry: true },
  // Tokens and fonts are served as a consumer loads them: built CSS files and self-hosted woff2.
  staticDirs: [
    { from: join(workspaceRoot, 'packages', 'tokens', 'dist'), to: '/tokens' },
    { from: join(workspaceRoot, 'packages', 'ui', 'styles', 'fonts'), to: '/fonts' },
  ],
};

export default config;
