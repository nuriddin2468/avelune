// The overlay invariants of brief §8.2: every overlay a control opens shares the elevation and the radius of its family
// (the popups attached to a control, the modal dialogs), plays an enter and an exit of the motion catalog, closes on
// Escape and on a press outside it, gives focus back to its control, and is gone from the DOM once closed (a closed
// modal dialog stays, not displayed). overlay-probe.ts opens each overlay in the browser; this module judges the
// results.

/** What opening and closing one overlay showed. */
export interface OverlayProbe {
  /** A short description for the report: the component, the popup type and the control's name. */
  readonly overlay: string;
  /** The screen it is on. */
  readonly path: string;
  /** Whether it is a modal dialog, whose family is the modal dialogs; otherwise a popup attached to its control. */
  readonly modal: boolean;
  /** Whether it opened at all; nothing else is judged when it did not. */
  readonly opened: boolean;
  /** The computed border radius and box shadow of its surface, the element that draws the elevation. */
  readonly radius: string;
  readonly shadow: string;
  /** The motion catalog's keyframes (`ave-motion-*-in`, `-out`) that ran as it opened and as it closed. */
  readonly entered: readonly string[];
  readonly exited: readonly string[];
  readonly closesOnEscape: boolean;
  /** Whether focus was on its control (or inside it) after Escape closed it. */
  readonly returnsFocus: boolean;
  readonly closesOnOutsidePress: boolean;
  /** Whether it was gone from the DOM (or, a modal dialog, not displayed) once closed. */
  readonly removed: boolean;
}

/** The motion catalog's enter and exit keyframes (ADR 0031): `ave-motion-fade-in`, `ave-motion-pop-out`, … */
export const enterKeyframes = /^ave-motion-[a-z]+-in$/;
export const exitKeyframes = /^ave-motion-[a-z]+-out$/;

/**
 * The overlays that break an invariant, one line each, ending in "on <path>". Radius and shadow are compared with the
 * first overlay of the same family that opened, on any screen.
 */
export function overlayViolations(probes: readonly OverlayProbe[]): string[] {
  const violations: string[] = [];
  const references = new Map<boolean, OverlayProbe>();
  for (const probe of probes) {
    const fail = (what: string) => {
      violations.push(`${probe.overlay}: ${what} on ${probe.path}`);
    };
    if (!probe.opened) {
      fail('does not open on a click or ArrowDown');
      continue;
    }
    const reference = references.get(probe.modal);
    if (reference === undefined) references.set(probe.modal, probe);
    else {
      const family = probe.modal ? 'modal dialog' : 'popup';
      if (probe.radius !== reference.radius) {
        fail(`radius ${probe.radius}, but the ${family} ${reference.overlay} has ${reference.radius}`);
      }
      if (probe.shadow !== reference.shadow) {
        fail(`elevation ${probe.shadow}, but the ${family} ${reference.overlay} has ${reference.shadow}`);
      }
    }
    if (!probe.entered.some((name) => enterKeyframes.test(name))) fail('plays no enter of the motion catalog');
    if (!probe.closesOnEscape) fail('does not close on Escape');
    else {
      if (!probe.exited.some((name) => exitKeyframes.test(name))) fail('plays no exit of the motion catalog');
      if (!probe.returnsFocus) fail('does not give focus back to its control after Escape');
      if (!probe.removed) fail('stays in the DOM after it closed');
    }
    if (!probe.closesOnOutsidePress) fail('does not close on a press outside it');
  }
  return violations;
}
