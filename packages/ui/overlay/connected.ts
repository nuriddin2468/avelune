import type { CdkConnectedOverlayConfig, ConnectedPosition } from '@angular/cdk/overlay';

/**
 * Under the control, or over it when there is no room below; the panel starts at the control's inline start. The gap
 * to the control is the panel's own block margin (`space.1`), so it stays a token.
 */
const positions: ConnectedPosition[] = [
  { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top' },
  { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom' },
];

/**
 * Where a panel attached to a control opens (ADR 0046): CDK's connected overlay in the top layer (`popover`), under
 * the control or over it, and scaled from the control's edge (the panel's element matches `transformOrigin`). A list
 * is as wide as its control (`matchWidth`); a calendar keeps its own width.
 *
 * @alpha
 */
export function aveConnectedOverlay(
  origin: HTMLElement,
  options: { readonly matchWidth?: boolean; readonly transformOrigin?: string } = {},
): CdkConnectedOverlayConfig {
  return {
    origin,
    positions,
    usePopover: 'inline',
    matchWidth: options.matchWidth ?? true,
    transformOriginSelector: options.transformOrigin ?? '.popup',
  };
}
