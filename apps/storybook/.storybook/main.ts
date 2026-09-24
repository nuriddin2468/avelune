// Storybook on @storybook/angular-vite (ADR 0008): the Foundations pages in src/, and each component's docs page and
// stories next to it in packages/ui (ADR 0033).
import type { StorybookConfig } from '@storybook/angular-vite';
import { join } from 'node:path';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.ts', '../../../packages/ui/**/*.mdx', '../../../packages/ui/**/*.stories.ts'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y', '@storybook/addon-vitest'],
  framework: {
    name: '@storybook/angular-vite',
    // JIT, the framework default: with AOT the production build drops the compiler that Storybook's wrapper needs.
    // Templates are type-checked by `storybook:typecheck` (ngc, strictTemplates) instead (ADR 0025).
    options: { jit: true, compodoc: false, tsconfig: join(import.meta.dirname, '..', 'tsconfig.json') },
  },
  // Storybook collects telemetry by default; nothing leaves the machine.
  core: { disableTelemetry: true },
};

export default config;
