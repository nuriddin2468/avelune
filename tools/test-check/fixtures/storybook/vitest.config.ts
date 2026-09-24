// The real story-test setup (apps/storybook/vitest.config.ts) pointed at this folder's Storybook config.
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { storybookAngularVitest } from '@storybook/angular-vite/vitest';
import { playwright } from '@vitest/browser-playwright';
import { join } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [storybookTest({ configDir: join(import.meta.dirname, '.storybook') }), storybookAngularVitest()],
  test: {
    name: 'storybook-fixtures',
    browser: { enabled: true, headless: true, provider: playwright(), instances: [{ browser: 'chromium' }] },
  },
});
