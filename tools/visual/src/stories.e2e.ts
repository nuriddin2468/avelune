// Every story of the Storybook build, once per project of playwright.config.ts (light and dark, 1280 and 390 px):
// its screenshot must equal the committed baseline, and axe must find no violation (ADR 0006, 0010, 0027).
import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { expectKitFonts } from './environment.ts';
import { readStories } from './story-index.ts';
import { openStory } from './story-page.ts';

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
