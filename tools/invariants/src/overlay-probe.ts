// Opens and closes every kind of overlay on a screen, the way a person does, and records what overlays.ts judges: one
// control per kind (the kit component around an `aria-haspopup` control, and its popup type), opened by a click, or by
// ArrowDown for a combobox's input; closed once by Escape and once by a press outside it. Needs recordMotion
// (motion.ts) in the page, for the keyframes that ran.
import type { ElementHandle, JSHandle, Page } from '@playwright/test';
import { motionGlobal, type MotionRecord } from './motion.ts';
import type { OverlayProbe } from './overlays.ts';

/** The controls that open an overlay. */
const triggerSelector = '[aria-haspopup]:not([aria-haspopup="false"])';

/** How long an overlay may take to open or to close, its motion included. */
const settleTimeout = 3000;

/** An overlay on screen: its root (the modal `<dialog>`, or the popover it is in) and its surface. */
interface Opened {
  readonly root: ElementHandle<Element>;
  readonly surface: ElementHandle<Element>;
  readonly modal: boolean;
}

/** The first visible, enabled control of each kind, as its index among the triggers and a description. */
async function triggersOf(page: Page): Promise<{ index: number; overlay: string }[]> {
  return page.locator(triggerSelector).evaluateAll((elements) => {
    const seen = new Set<string>();
    const found: { index: number; overlay: string }[] = [];
    elements.forEach((element, index) => {
      if (!(element instanceof HTMLElement) || !element.checkVisibility()) return;
      if (element.matches(':disabled, [aria-disabled="true"]')) return;
      // The kit component around the control; an application's own components (ave-showcase-*) are not the kit's.
      let owner: Element | null = element.parentElement;
      while (owner !== null && !(owner.localName.startsWith('ave-') && !owner.localName.startsWith('ave-showcase-'))) {
        owner = owner.parentElement;
      }
      const kind = `${owner?.localName ?? element.localName} [${element.getAttribute('aria-haspopup') ?? ''}]`;
      if (seen.has(kind)) return;
      seen.add(kind);
      const name = (element.getAttribute('aria-label') ?? element.textContent).replace(/\s+/g, ' ').trim();
      found.push({ index, overlay: `${kind} "${name}"` });
    });
    return found;
  });
}

/**
 * The overlay open now, if any: the topmost modal dialog, else the last popover that shows, leaving out tooltips and
 * the toast region; its surface is the first element in it (itself included) that casts a shadow.
 */
async function openOverlay(page: Page): Promise<Opened | undefined> {
  const found: JSHandle<{ root: Element; surface: Element; modal: boolean } | null> = await page.evaluateHandle(() => {
    const surfaceOf = (root: Element): Element | null =>
      [root, ...root.querySelectorAll('*')].find((element) => getComputedStyle(element).boxShadow !== 'none') ?? null;
    const modal = [...document.querySelectorAll('dialog')].filter((dialog) => dialog.matches(':modal')).at(-1);
    if (modal !== undefined) {
      const surface = surfaceOf(modal);
      return surface === null ? null : { root: modal, surface, modal: true };
    }
    const popups = [...document.querySelectorAll(':popover-open')].filter(
      (host) =>
        host.localName !== 'ave-toast-region' &&
        !host.matches('[data-ave-tooltip-of]') &&
        host.querySelector('[data-ave-tooltip-of]') === null,
    );
    for (const root of popups.reverse()) {
      const surface = surfaceOf(root);
      if (surface !== null) return { root, surface, modal: false };
    }
    return null;
  });
  const root = (await found.evaluateHandle((overlay) => overlay?.root ?? null)).asElement();
  const surface = (await found.evaluateHandle((overlay) => overlay?.surface ?? null)).asElement();
  if (root === null || surface === null) return undefined;
  return { root, surface, modal: await found.evaluate((overlay) => overlay?.modal === true) };
}

/** Polls `check` until it is true or the time is up. */
async function until(check: () => Promise<boolean>): Promise<boolean> {
  const end = Date.now() + settleTimeout;
  for (;;) {
    if (await check()) return true;
    if (Date.now() > end) return false;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

/** Opens the control's overlay and waits until its enter has played. */
async function open(page: Page, trigger: ElementHandle<Element>): Promise<Opened | undefined> {
  await trigger.click();
  let opened: Opened | undefined;
  await until(async () => (opened = await openOverlay(page)) !== undefined);
  if (opened === undefined && (await trigger.evaluate((element) => element instanceof HTMLInputElement))) {
    await trigger.press('ArrowDown');
    await until(async () => (opened = await openOverlay(page)) !== undefined);
  }
  if (opened === undefined) return undefined;
  await opened.root.evaluate(async (root) => {
    await Promise.allSettled(root.getAnimations({ subtree: true }).map((animation) => animation.finished));
  });
  return opened;
}

/** Whether the overlay has closed: a modal dialog no longer open, a popup's surface out of the DOM or hidden. */
async function closed(overlay: Opened): Promise<boolean> {
  return overlay.surface.evaluate(
    (surface, [root, modal]) =>
      modal ? !(root as HTMLDialogElement).open : !surface.isConnected || !root.matches(':popover-open'),
    [overlay.root, overlay.modal] as const,
  );
}

/** A point outside the overlay and its control where a press reaches nothing interactive: the page, or a backdrop. */
async function outsidePoint(
  overlay: Opened,
  trigger: ElementHandle<Element>,
): Promise<{ x: number; y: number } | null> {
  return overlay.surface.evaluate(
    (surface, [root, control, modal]) => {
      const interactive = 'a, button, input, select, textarea, label, summary, [role], [tabindex], [contenteditable]';
      for (let y = 0.95; y > 0; y -= 0.1) {
        for (let x = 0.05; x < 1; x += 0.1) {
          const point = { x: Math.round(innerWidth * x), y: Math.round(innerHeight * y) };
          const hit = document.elementFromPoint(point.x, point.y);
          if (hit === null) continue;
          if (modal) {
            if (hit === root) return point;
            continue;
          }
          if (surface.contains(hit) || control.contains(hit) || hit.closest(interactive) !== null) continue;
          if (hit.closest(':popover-open, dialog') !== null) continue;
          return point;
        }
      }
      return null;
    },
    [overlay.root, trigger, overlay.modal] as const,
  );
}

/** The catalog keyframes recordMotion saw from the given record on, tooltips left out. */
async function keyframesSince(page: Page, from: number): Promise<string[]> {
  const records = await page.evaluate(
    ([name, start]) => {
      const recorded: unknown = Reflect.get(window, name);
      return Array.isArray(recorded) ? (recorded.slice(start) as MotionRecord[]) : [];
    },
    [motionGlobal, from] as const,
  );
  return records
    .filter((record) => record.kind === 'animation' && !record.target.startsWith('ave-tooltip-panel'))
    .map((record) => record.name);
}

async function recorded(page: Page): Promise<number> {
  return page.evaluate((name) => {
    const records: unknown = Reflect.get(window, name);
    return Array.isArray(records) ? records.length : 0;
  }, motionGlobal);
}

/** Probes one control's overlay: open, Escape, open, press outside. */
async function probe(
  page: Page,
  trigger: ElementHandle<Element>,
  overlay: string,
  path: string,
): Promise<OverlayProbe> {
  const failed: OverlayProbe = {
    overlay,
    path,
    modal: false,
    opened: false,
    radius: '',
    shadow: '',
    entered: [],
    exited: [],
    closesOnEscape: false,
    returnsFocus: false,
    closesOnOutsidePress: false,
    removed: false,
  };
  const start = await recorded(page);
  const first = await open(page, trigger);
  if (first === undefined) return failed;
  const entered = await keyframesSince(page, start);
  // The largest corner: a drawer rounds only the corners away from its edge (ADR 0069, addendum).
  const { radius, shadow } = await first.surface.evaluate((surface) => {
    const style = getComputedStyle(surface);
    const corners = [
      style.borderTopLeftRadius,
      style.borderTopRightRadius,
      style.borderBottomRightRadius,
      style.borderBottomLeftRadius,
    ];
    return {
      radius: `${String(Math.max(...corners.map((corner) => Number.parseFloat(corner) || 0)))}px`,
      shadow: style.boxShadow,
    };
  });

  const beforeExit = await recorded(page);
  await page.keyboard.press('Escape');
  const closesOnEscape = await until(async () => closed(first));
  // A popup's surface leaves the DOM after its exit; wait for that before judging.
  if (closesOnEscape && !first.modal)
    await until(async () => first.surface.evaluate((surface) => !surface.isConnected));
  const exited = await keyframesSince(page, beforeExit);
  const returnsFocus = await trigger.evaluate(
    (control) => document.activeElement !== null && control.contains(document.activeElement),
  );
  const removed = await first.surface.evaluate(
    (surface, [root, modal]) => (modal ? !root.checkVisibility() : !surface.isConnected),
    [first.root, first.modal] as const,
  );

  // Still open when Escape did not close it; opened again when it did.
  let closesOnOutsidePress = false;
  const second = closesOnEscape ? await open(page, trigger) : first;
  if (second !== undefined) {
    const point = await outsidePoint(second, trigger);
    if (point !== null) {
      await page.mouse.click(point.x, point.y);
      closesOnOutsidePress = await until(async () => closed(second));
    }
    // An overlay that stays open would stand in the way of the next control's.
    if (!closesOnOutsidePress) {
      await page.reload();
      await loaded(page);
    }
  }
  return {
    ...failed,
    modal: first.modal,
    opened: true,
    radius,
    shadow,
    entered,
    exited,
    closesOnEscape,
    returnsFocus,
    closesOnOutsidePress,
    removed,
  };
}

/** Waits until nothing on the screen is loading (`aria-busy`), so every control that opens an overlay is there. */
async function loaded(page: Page): Promise<void> {
  await page.waitForFunction(() => document.querySelector('[aria-busy="true"]') === null);
}

/** Probes the overlay of every kind of control on the open screen. */
export async function probeOverlays(page: Page, path: string): Promise<OverlayProbe[]> {
  await loaded(page);
  const probes: OverlayProbe[] = [];
  for (const { index, overlay } of await triggersOf(page)) {
    const trigger = await page.locator(triggerSelector).nth(index).elementHandle();
    probes.push(await probe(page, trigger, overlay, path));
  }
  return probes;
}
