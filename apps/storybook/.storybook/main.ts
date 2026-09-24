// Storybook on @storybook/angular-vite (ADR 0008). Phase 2 runs the Foundations pages; Phase 3 adds addon-vitest,
// the a11y gate and component stories from packages/ui.
import type { StorybookConfig } from '@storybook/angular-vite';
import { join } from 'node:path';

const workspaceRoot = join(import.meta.dirname, '..', '..', '..');

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.ts'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y', '@storybook/addon-vitest'],
  framework: {
    name: '@storybook/angular-vite',
    // JIT, the framework default: with AOT the production build drops the compiler that Storybook's wrapper needs.
    // Templates are type-checked by `storybook:typecheck` (ngc, strictTemplates) instead (ADR 0025).
    options: { jit: true, compodoc: false, tsconfig: join(import.meta.dirname, '..', 'tsconfig.json') },
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
