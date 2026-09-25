// Stories tagged `forced-colors`, once more with forced colours active (Windows' contrast themes), in the project of
// the same name: light, 1280 px. The screenshot must equal `baselines/<story id>/forced-colors.png`, and the story,
// its play function included, must render cleanly, so a play function can assert what forced colours change
// (brief §6.1, ADR 0030). Axe is left out: its contrast rules read the author colours that forced colours replace.
import { expect, test } from '@playwright/test';
import { expectKitFonts } from './environment.ts';
import { forcedColorsTag, readStories } from './story-index.ts';
import { openStory } from './story-page.ts';

for (const story of readStories().filter((entry) => entry.tags.includes(forcedColorsTag))) {
  test.describe(story.id, () => {
    test('matches its forced-colors baseline', async ({ page }) => {
      await openStory(page, story.id, 'light');
      await expect
        .poll(() => page.evaluate(() => matchMedia('(forced-colors: active)').matches), 'forced colours are active')
        .toBe(true);
      await expectKitFonts(page);
      // Forced colours force `caret-color`, so the screenshot's `caret: 'hide'` cannot hide a focused field's caret,
      // and it blinked into one run's screenshot and not another's (Input States, 2026-09-25). A caret that does not
      // blink is drawn in every run (ADR 0027, addendum).
      await page.addStyleTag({ content: '* { caret-animation: manual; }' });
      await expect(page).toHaveScreenshot([story.id, 'forced-colors.png'], { fullPage: true });
    });
  });
}
