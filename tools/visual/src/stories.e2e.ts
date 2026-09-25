// Every story of the Storybook build, once per project of playwright.config.ts (light and dark, 1280 and 390 px):
// its screenshot must equal the committed baseline, and axe must find no violation (ADR 0006, 0010, 0027). Both run on
// one load of the story, the costly part under amd64 emulation; each is a soft assertion, so one failing never hides
// the other (ADR 0027, addendum of 2026-09-25).
import { expect, test } from '@playwright/test';
import { axeViolations } from './axe.ts';
import { expectKitFonts } from './environment.ts';
import { readStories } from './story-index.ts';
import { openStory } from './story-page.ts';

/** Storybook's own elements, which axe skips in its a11y addon too. */
const storybookChrome = ['.sb-wrapper', '#storybook-docs', '#storybook-highlights-root'];

for (const story of readStories()) {
  test.describe(story.id, () => {
    test('matches its baseline and has no axe violations', async ({ page }, testInfo) => {
      await openStory(page, story.id, testInfo.project.use.colorScheme === 'dark' ? 'dark' : 'light');
      await expectKitFonts(page);
      await expect.soft(page).toHaveScreenshot([story.id, `${testInfo.project.name}.png`], { fullPage: true });
      expect.soft(await axeViolations(page, 'body', storybookChrome), 'axe violations').toEqual([]);
    });
  });
}
