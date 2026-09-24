// Cross-component invariants of brief §8.2 and the axe gate of brief §5.4, on every showcase screen, once per project
// of playwright.config.ts (light and dark, 1280 and 390 px). The component invariants (same-size controls, overlays,
// animate.leave) join as the components arrive in Phase 5.
import { AxeBuilder } from '@axe-core/playwright';
import { test as base, expect, type Page } from '@playwright/test';
import { tokens } from '@avelune/tokens';
import { fixedEnvironment } from '@avelune/visual';
import { motionGlobal, motionTokens, recordMotion, reducedMotionViolations, timingViolations } from './motion.ts';
import type { MotionRecord } from './motion.ts';
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
