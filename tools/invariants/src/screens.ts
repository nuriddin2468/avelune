// The showcase's screens: every same-origin route reachable by links from `/`. The suite finds them itself, so a new
// screen is checked as soon as the showcase links to it.
import { expect, type Browser, type BrowserContextOptions, type Page, type Request } from '@playwright/test';
import { expectKitFonts } from '@avelune/visual';
import { routeOf } from './routes.ts';

/** Upper bound on screens, so a link loop or generated URLs fail instead of running forever. */
const maxScreens = 200;

/** How long a screen's network must stay quiet: the 500ms of Playwright's `networkidle`. */
const quietPeriod = 500;

/**
 * Opens a screen and waits until it has loaded, gone quiet on the network and set its text in the kit's fonts.
 *
 * Quiet is `networkidle` counted from the page's own request events. Playwright's `networkidle` state can be lost when
 * requests finish before DOMContentLoaded, and its wait then never ends (2 of 24 tests timed out in each of two runs
 * on 2026-09-25; ADR 0027, addendum).
 */
export async function openScreen(page: Page, path: string): Promise<void> {
  const inFlight = new Set<Request>();
  let lastChange = Date.now();
  const started = (request: Request): void => {
    inFlight.add(request);
    lastChange = Date.now();
  };
  const ended = (request: Request): void => {
    inFlight.delete(request);
    lastChange = Date.now();
  };
  page.on('request', started);
  page.on('requestfinished', ended);
  page.on('requestfailed', ended);
  try {
    await page.goto(path);
    await expect
      .poll(() => inFlight.size === 0 && Date.now() - lastChange >= quietPeriod, {
        message: `the network of ${path} goes quiet`,
        intervals: [100],
        timeout: 0,
      })
      .toBe(true);
  } finally {
    page.off('request', started);
    page.off('requestfinished', ended);
    page.off('requestfailed', ended);
  }
  await expectKitFonts(page);
}

/** Waits until nothing on the screen is loading (`aria-busy`), so every control and link it shows is there. */
export async function loaded(page: Page): Promise<void> {
  await page.waitForFunction(() => document.querySelector('[aria-busy="true"]') === null);
}

/**
 * Every same-origin route linked from `/`, breadth first, at desktop width: the first path found of each. Links are
 * read once nothing loads, so a list's links (the register's contracts) are found on every run (ADR 0027, addendum).
 */
export async function findScreens(browser: Browser, options: BrowserContextOptions): Promise<string[]> {
  const context = await browser.newContext({ ...options, viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  const screens = ['/'];
  try {
    for (let index = 0; index < screens.length; index++) {
      await openScreen(page, screens[index] ?? '/');
      await loaded(page);
      const origin = new URL(page.url()).origin;
      const links = await page
        .locator('a[href]')
        .evaluateAll((anchors) =>
          anchors.flatMap((anchor) => (anchor instanceof HTMLAnchorElement ? [anchor.href] : [])),
        );
      for (const link of links) {
        const url = new URL(link);
        if (url.origin !== origin) continue;
        // One page of each route: /contracts/113 is the screen of /contracts/114.
        if (screens.some((screen) => routeOf(screen) === routeOf(url.pathname))) continue;
        screens.push(url.pathname);
      }
      if (screens.length > maxScreens) throw new Error(`More than ${String(maxScreens)} screens linked from /`);
    }
  } finally {
    await context.close();
  }
  return screens;
}
