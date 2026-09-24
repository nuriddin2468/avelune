// Opening a story the way every visual test does (ADR 0027): in Storybook's iframe, with the theme global set and the
// fixed clock, failing on anything that went wrong while it rendered.
import type { Page } from '@playwright/test';
import { fixedTime } from './environment.ts';

export type Theme = 'light' | 'dark';
type Phase = 'finished' | 'errored';

/**
 * Opens a story in Storybook's iframe with the theme global set, and waits until Storybook has finished it: rendered,
 * played, animations settled and its afterEach hooks run. Fails when the story errored, and when anything logged an
 * error on the way: Storybook only logs a failing play function (throwPlayFunctionExceptions is false by default),
 * Angular logs rendering errors, and the browser logs a missing file.
 */
export async function openStory(page: Page, id: string, theme: Theme): Promise<void> {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.clock.setFixedTime(fixedTime);
  await page.goto(`/iframe.html?id=${encodeURIComponent(id)}&viewMode=story&globals=theme:${theme}`);
  const phase = await page
    .waitForFunction((): Phase | false => {
      const preview: unknown = Reflect.get(window, '__STORYBOOK_PREVIEW__');
      const render: unknown =
        typeof preview === 'object' && preview !== null ? Reflect.get(preview, 'currentRender') : null;
      const current: unknown = typeof render === 'object' && render !== null ? Reflect.get(render, 'phase') : null;
      return current === 'finished' || current === 'errored' ? current : false;
    })
    .then((handle) => handle.jsonValue());
  if (phase === 'errored') errors.unshift(await page.locator('#error-message').innerText());
  if (errors.length > 0) throw new Error(`Storybook could not render the story cleanly:\n${errors.join('\n')}`);
}
