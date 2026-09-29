import type { CdkConnectedOverlayConfig, ConnectedPosition } from '@angular/cdk/overlay';

/**
 * Under the control, or over it when there is no room below; the panel starts at the control's inline start. The gap
 * to the control is the panel's own block margin (`space.1`), so it stays a token.
 */
const positions: ConnectedPosition[] = [
  { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top' },
  { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom' },
];

/** The same, and then ending at the control's inline end, for a panel wider than the room after the control's start. */
const eitherEdge: ConnectedPosition[] = [
  ...positions,
  { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top' },
  { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom' },
];

/**
 * Where a panel attached to a control opens (ADR 0046): CDK's connected overlay in the top layer (`popover`), under
 * the control or over it, and scaled from the control's edge (the panel's element matches `transformOrigin`). A list
 * is as wide as its control (`matchWidth`); a calendar keeps its own width. A menu or a popover wider than its button
 * may end at the button's end instead (`align: 'either'`), when a button at the end of a row leaves no room after its
 * start (ADR 0064); when neither fits, it is pushed inside the viewport, `space.2` from its edge (ADR 0065). CDK never
 * closes it on Escape itself (`disableClose`), which would take it away at once, without its exit: the component
 * closes it, through `aveOverlayPresence`.
 *
 * @alpha
 */
export function aveConnectedOverlay(
  origin: HTMLElement,
  options: {
    readonly matchWidth?: boolean;
    readonly transformOrigin?: string;
    readonly align?: 'start' | 'either';
  } = {},
): CdkConnectedOverlayConfig {
  const config: CdkConnectedOverlayConfig = {
    origin,
    positions,
    usePopover: 'inline',
    matchWidth: options.matchWidth ?? true,
    transformOriginSelector: options.transformOrigin ?? '.popup',
    disableClose: true,
  };
  if (options.align !== 'either') return config;
  // The margin is a token, read from the control as the kit reads its timings.
  const margin = Number.parseFloat(getComputedStyle(origin).getPropertyValue('--ave-space-2')) || 0;
  return { ...config, positions: eitherEdge, push: true, viewportMargin: margin };
}
