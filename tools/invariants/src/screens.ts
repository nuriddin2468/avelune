// The showcase's screens: every same-origin page reachable by links from `/`. The suite finds them itself, so a new
// screen is checked as soon as the showcase links to it.
import type { Browser, BrowserContextOptions, Page } from '@playwright/test';
import { expectKitFonts } from '@avelune/visual';

/** Upper bound on screens, so a link loop or generated URLs fail instead of running forever. */
const maxScreens = 200;

/** Opens a screen and waits until it has loaded, gone quiet on the network and set its text in the kit's fonts. */
export async function openScreen(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
  await expectKitFonts(page);
}

/** Every same-origin path linked from `/`, breadth first, at desktop width. */
export async function findScreens(browser: Browser, options: BrowserContextOptions): Promise<string[]> {
  const context = await browser.newContext({ ...options, viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  const screens = ['/'];
  try {
    for (let index = 0; index < screens.length; index++) {
      await openScreen(page, screens[index] ?? '/');
      const origin = new URL(page.url()).origin;
      const links = await page
        .locator('a[href]')
        .evaluateAll((anchors) =>
          anchors.flatMap((anchor) => (anchor instanceof HTMLAnchorElement ? [anchor.href] : [])),
        );
      for (const link of links) {
        const url = new URL(link);
        if (url.origin === origin && !screens.includes(url.pathname)) screens.push(url.pathname);
      }
      if (screens.length > maxScreens) throw new Error(`More than ${String(maxScreens)} screens linked from /`);
    }
  } finally {
    await context.close();
  }
  return screens;
}
