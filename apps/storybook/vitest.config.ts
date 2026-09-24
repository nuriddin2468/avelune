// Every story runs as a test in Chromium (ADR 0006): it must render, its play function must pass, and axe must find
// no violation (parameters.a11y.test = 'error' in .storybook/preview.ts).
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { storybookAngularVitest } from '@storybook/angular-vite/vitest';
import { playwright } from '@vitest/browser-playwright';
import { join } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [storybookTest({ configDir: join(import.meta.dirname, '.storybook') }), storybookAngularVitest()],
  test: {
    name: 'storybook',
    browser: { enabled: true, headless: true, provider: playwright(), instances: [{ browser: 'chromium' }] },
  },
});
