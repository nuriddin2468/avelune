// Every docs page of the Storybook build, in the light and dark projects at 1280 px: it must render cleanly, its
// stories included, and axe must find no violation on the whole page, prose, tables and code blocks as well as the
// stories. Docs pages are the components' specs; the dark Icon page was once unreadable (ADR 0034). They have no
// screenshot baselines: their stories have their own.
import { expect, test } from '@playwright/test';
import { axeViolations } from './axe.ts';
import { readDocs } from './story-index.ts';
import { openDocs } from './story-page.ts';

for (const docs of readDocs()) {
  test.describe(docs.id, () => {
    test('renders cleanly and has no axe violations', async ({ page }, testInfo) => {
      await openDocs(page, docs.id, testInfo.project.use.colorScheme === 'dark' ? 'dark' : 'light');
      expect(await axeViolations(page, '#storybook-docs')).toEqual([]);
    });
  });
}
