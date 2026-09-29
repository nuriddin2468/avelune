// Cross-component invariants of brief §8.2 and the axe gate of brief §5.4, on every showcase screen, once per project
// of playwright.config.ts (light and dark, 1280 and 390 px). Same-size controls joined with Wave 1, the overlays with
// Wave 3.
import { AxeBuilder } from '@axe-core/playwright';
import { test as base, expect, type Page } from '@playwright/test';
import { tokens } from '@avelune/tokens';
import { fixedEnvironment } from '@avelune/visual';
import { controlSelector, sameSizeViolations, type ControlBox } from './controls.ts';
import { motionGlobal, motionTokens, recordMotion, reducedMotionViolations, timingViolations } from './motion.ts';
import type { MotionRecord } from './motion.ts';
import { probeOverlays } from './overlay-probe.ts';
import { overlayViolations, type OverlayProbe } from './overlays.ts';
import { findScreens, openScreen } from './screens.ts';

const test = base.extend<object, { screens: string[] }>({
  screens: [
    async ({ browser }, use, workerInfo) => {
      const { baseURL } = workerInfo.project.use;
      if (baseURL === undefined) throw new Error('playwright.config.ts sets no baseURL');
      await use(await findScreens(browser, { ...fixedEnvironment, baseURL }));
    },
    { scope: 'worker' },
  ],
});

/**
 * The animations recordMotion has seen so far, after two more frames. They are attached to the report as
 * `motion <path>`, so a reviewer (and the proof in tools/test-check) can see what was measured.
 */
async function recordedMotion(page: Page, path: string): Promise<MotionRecord[]> {
  const records = await page.evaluate(async (name) => {
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const recorded: unknown = Reflect.get(window, name);
    return Array.isArray(recorded) ? (recorded as MotionRecord[]) : [];
  }, motionGlobal);
  await test.info().attach(`motion ${path}`, { body: JSON.stringify(records), contentType: 'application/json' });
  return records;
}

/** The easing tokens as this browser serialises them, so `linear(0, …)` compares equal to `linear(0 0%, …)`. */
async function canonicalEasings(page: Page, easings: readonly string[]): Promise<Set<string>> {
  const canonical = await page.evaluate(
    (values) => values.map((easing) => new KeyframeEffect(null, null, { easing }).getTiming().easing ?? easing),
    easings,
  );
  return new Set(canonical);
}

test('every screen passes axe', async ({ page, screens }) => {
  for (const path of screens) {
    await test.step(path, async () => {
      await openScreen(page, path);
      const { violations } = await new AxeBuilder({ page }).analyze();
      const found = violations.map((violation) => `${violation.id}: ${violation.help}`);
      expect.soft(found, `axe violations on ${path}`).toEqual([]);
    });
  }
});

test('no screen scrolls horizontally at 320px', async ({ page, screens }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  for (const path of screens) {
    await test.step(path, async () => {
      await openScreen(page, path);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect.soft(overflow, `horizontal overflow in px on ${path}`).toBe(0);
    });
  }
});

/** A `<link rel="preload" as="font">` of a screen: its URL, and how the page used it. */
interface FontPreload {
  readonly href: string;
  /** Some @font-face rule of the page's stylesheets names this URL. */
  readonly declared: boolean;
  /** Resource Timing entries for the URL: 1 when the face reused the preload, 2 when it fetched the file again. */
  readonly fetches: number;
}

test('every preloaded font is a face the screen uses, fetched once', async ({ page, screens }) => {
  for (const path of screens) {
    await test.step(path, async () => {
      await openScreen(page, path);
      const preloads = await page.evaluate((): FontPreload[] => {
        const faces = new Set<string>();
        const walk = (sheet: CSSStyleSheet) => {
          const base = sheet.href ?? document.baseURI;
          for (const rule of sheet.cssRules) {
            if (rule instanceof CSSImportRule && rule.styleSheet !== null) walk(rule.styleSheet);
            if (!(rule instanceof CSSFontFaceRule)) continue;
            for (const [, , url] of rule.style.getPropertyValue('src').matchAll(/url\(\s*(["']?)(.*?)\1\s*\)/g)) {
              if (url !== undefined) faces.add(new URL(url, base).href);
            }
          }
        };
        for (const sheet of document.styleSheets) walk(sheet);
        const fetched = performance.getEntriesByType('resource').map((entry) => entry.name);
        return [...document.querySelectorAll<HTMLLinkElement>('link[rel="preload"][as="font"]')].map((link) => ({
          href: link.href,
          declared: faces.has(link.href),
          fetches: fetched.filter((name) => name === link.href).length,
        }));
      });
      // A preload whose URL or credentials mode differs from the face's request downloads the font twice.
      expect
        .soft(
          preloads.filter((preload) => !preload.declared || preload.fetches !== 1),
          `font preloads the screen does not use on ${path}`,
        )
        .toEqual([]);
    });
  }
});

test('every animation runs on duration and easing tokens', async ({ page, screens }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.addInitScript(recordMotion);
  const { durations, easings } = motionTokens(tokens);
  for (const path of screens) {
    await test.step(path, async () => {
      await openScreen(page, path);
      const found = timingViolations(
        await recordedMotion(page, path),
        durations,
        await canonicalEasings(page, easings),
      );
      expect.soft(found, `animations off the motion tokens on ${path}`).toEqual([]);
    });
  }
});

test('nothing moves or scales under reduced motion', async ({ page, screens }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(recordMotion);
  for (const path of screens) {
    await test.step(path, async () => {
      await openScreen(page, path);
      expect
        .soft(reducedMotionViolations(await recordedMotion(page, path)), `movement under reduced motion on ${path}`)
        .toEqual([]);
    });
  }
});

test('controls of the same size share height, radius, border, font size and padding', async ({ page, screens }) => {
  for (const path of screens) {
    await test.step(path, async () => {
      await openScreen(page, path);
      const boxes = await page.evaluate(
        (selector): ControlBox[] =>
          [...document.querySelectorAll(selector)].map((control) => {
            const style = getComputedStyle(control);
            const owner = control.closest(
              'ave-select, ave-combobox, ave-multiselect, ave-date-picker, ave-date-range-picker',
            );
            const kind =
              owner?.localName ??
              ['aveButton', 'aveIconButton', 'aveInput', 'aveTextarea'].find((name) => control.hasAttribute(name)) ??
              '';
            const text = (control.getAttribute('aria-label') ?? control.textContent).replace(/\s+/g, ' ').trim();
            return {
              control: owner === null ? `${control.localName}[${kind}] "${text}"` : `${kind} "${text}"`,
              size: (owner ?? control).getAttribute('data-size') ?? '',
              square: kind === 'aveIconButton',
              multiline: kind === 'aveTextarea',
              height: control.getBoundingClientRect().height,
              radius: style.borderTopLeftRadius,
              border: style.borderTopWidth,
              fontSize: style.fontSize,
              padding: style.paddingInlineStart,
            };
          }),
        controlSelector,
      );
      expect.soft(sameSizeViolations(boxes), `controls of one size that differ on ${path}`).toEqual([]);
    });
  }
});

test("overlays share their family's look, enter and leave, close on Escape and outside, and return focus", async ({
  page,
  screens,
}) => {
  // Every kind of overlay opens twice on every screen; emulated amd64 is slow.
  test.setTimeout(300_000);
  await page.addInitScript(recordMotion);
  const probes: OverlayProbe[] = [];
  for (const path of screens) {
    await test.step(path, async () => {
      await openScreen(page, path);
      probes.push(...(await probeOverlays(page, path)));
    });
  }
  await test.info().attach('overlays', { body: JSON.stringify(probes), contentType: 'application/json' });
  // Judged together, so that each family is compared across screens; reported per screen.
  const violations = overlayViolations(probes);
  for (const path of screens) {
    expect
      .soft(
        violations.filter((violation) => violation.endsWith(` on ${path}`)),
        `overlays that break an invariant on ${path}`,
      )
      .toEqual([]);
  }
});
