// Every story of the Storybook build, once per project of playwright.config.ts (light and dark, 1280 and 390 px):
// its screenshot must equal the committed baseline, and axe must find no violation (ADR 0006, 0010, 0027).
import { AxeBuilder } from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { expectKitFonts, fixedTime } from './environment.ts';
import { readStories } from './story-index.ts';

type Theme = 'light' | 'dark';
type Phase = 'finished' | 'errored';

/**
 * Opens a story in Storybook's iframe with the theme global set, and waits until Storybook has finished it: rendered,
 * played, animations settled and its afterEach hooks run. Fails when the story errored, and when anything logged an
 * error on the way: Storybook only logs a failing play function (throwPlayFunctionExceptions is false by default),
 * Angular logs rendering errors, and the browser logs a missing file.
 */
async function openStory(page: Page, id: string, theme: Theme): Promise<void> {
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

/** Storybook's own elements, which axe skips in its a11y addon too. */
const storybookChrome = ['.sb-wrapper', '#storybook-docs', '#storybook-highlights-root'];

for (const story of readStories()) {
  test.describe(story.id, () => {
    test.beforeEach(async ({ page }, testInfo) => {
      await openStory(page, story.id, testInfo.project.use.colorScheme === 'dark' ? 'dark' : 'light');
    });

    test('matches its baseline', async ({ page }, testInfo) => {
      await expectKitFonts(page);
      await expect(page).toHaveScreenshot([story.id, `${testInfo.project.name}.png`], { fullPage: true });
    });

    test('has no axe violations', async ({ page }) => {
      // The same rules as the Storybook gate (parameters.a11y.test = 'error'): axe's defaults without `region`,
      // because a story is a fragment, not a page. Showcase screens keep `region` (tools/invariants).
      let axe = new AxeBuilder({ page }).include('body').disableRules(['region']);
      for (const selector of storybookChrome) axe = axe.exclude(selector);
      const { violations } = await axe.analyze();
      expect(
        violations.map((violation) => ({
          rule: violation.id,
          help: violation.help,
          targets: violation.nodes.map((node) => node.target.join(' ')),
        })),
      ).toEqual([]);
    });
  });
}
