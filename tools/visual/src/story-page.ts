// Opening a story or a docs page the way every visual test does (ADR 0027): in Storybook's iframe, with the theme
// global set and the fixed clock, failing on anything that went wrong while it rendered.
import type { Page } from '@playwright/test';
import { fixedTime } from './environment.ts';

export type Theme = 'light' | 'dark';
type Phase = 'finished' | 'errored';

/** Set on `window` by the init script of openDocs once Storybook's channel has emitted `docsRendered`. */
const docsRenderedFlag = '__aveDocsRendered';

/**
 * Collects what went wrong while a page renders: Storybook only logs a failing play function
 * (throwPlayFunctionExceptions is false by default), Angular logs rendering errors, and the browser logs a missing
 * file.
 */
async function openCollectingErrors(page: Page, url: string): Promise<string[]> {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.clock.setFixedTime(fixedTime);
  await page.goto(url);
  return errors;
}

/**
 * Opens a story in Storybook's iframe with the theme global set, and waits until Storybook has finished it: rendered,
 * played, animations settled and its afterEach hooks run. Fails when the story errored, and when anything logged an
 * error on the way.
 */
export async function openStory(page: Page, id: string, theme: Theme): Promise<void> {
  const errors = await openCollectingErrors(
    page,
    `/iframe.html?id=${encodeURIComponent(id)}&viewMode=story&globals=theme:${theme}`,
  );
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

/**
 * Opens a docs page in Storybook's iframe with the theme global set, and waits until the page has rendered and every
 * story on it has finished. Storybook emits `docsRendered` when the page's React tree is in place, but the stories on
 * it start from effects after that, so the wait also needs one finished render per story block in the page. Fails
 * when the page or one of its stories errored, and when anything logged an error on the way.
 */
export async function openDocs(page: Page, id: string, theme: Theme): Promise<void> {
  // The channel is assigned once, at preview start-up; listening from the assignment misses no event.
  await page.addInitScript((flag) => {
    let channel: unknown;
    Object.defineProperty(globalThis, '__STORYBOOK_ADDONS_CHANNEL__', {
      configurable: true,
      get: () => channel,
      set: (value: unknown) => {
        channel = value;
        const on: unknown = typeof value === 'object' && value !== null ? Reflect.get(value, 'on') : undefined;
        if (typeof on === 'function') {
          Reflect.apply(on, value, [
            'docsRendered',
            () => {
              Reflect.set(window, flag, true);
            },
          ]);
        }
      },
    });
  }, docsRenderedFlag);
  const errors = await openCollectingErrors(
    page,
    `/iframe.html?id=${encodeURIComponent(id)}&viewMode=docs&globals=theme:${theme}`,
  );
  const failed = await page
    .waitForFunction((flag): string[] | false => {
      if (document.body.classList.contains('sb-show-errordisplay')) return ['the docs page'];
      if (Reflect.get(window, flag) !== true) return false;
      const preview: unknown = Reflect.get(window, '__STORYBOOK_PREVIEW__');
      const renders: unknown =
        typeof preview === 'object' && preview !== null ? Reflect.get(preview, 'storyRenders') : null;
      if (!Array.isArray(renders)) return false;
      // One inline story block (`story--<id>-inner`, or `…--primary-inner`) per story render.
      const blocks = document.querySelectorAll('#storybook-docs [id^="story--"][id$="-inner"]').length;
      if (renders.length < blocks) return false;
      const states = renders.map((render: unknown) => {
        const id: unknown = typeof render === 'object' && render !== null ? Reflect.get(render, 'id') : render;
        const phase: unknown = typeof render === 'object' && render !== null ? Reflect.get(render, 'phase') : undefined;
        return { id: String(id), phase };
      });
      if (!states.every((state) => state.phase === 'finished' || state.phase === 'errored')) return false;
      return states.filter((state) => state.phase === 'errored').map((state) => `story ${state.id}`);
    }, docsRenderedFlag)
    .then((handle) => handle.jsonValue());
  // waitForFunction resolves only on a truthy value; an empty list means nothing errored.
  if (failed === false) throw new Error('Unreachable: the docs wait resolved without a result');
  if (failed.length > 0) errors.unshift(`Errored: ${failed.join(', ')}`);
  if (errors.length > 0) throw new Error(`Storybook could not render the docs page cleanly:\n${errors.join('\n')}`);
}
