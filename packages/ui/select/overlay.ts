import type { CdkConnectedOverlayConfig, ConnectedPosition } from '@angular/cdk/overlay';

/**
 * Under the control, or over it when there is no room below; the list starts at the control's inline start. The gap
 * to the control is the list's own block margin (`space.1`, list.css), so it stays a token.
 */
const positions: ConnectedPosition[] = [
  { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top' },
  { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom' },
];

/**
 * Where the list of a select, a combobox or a multiselect opens (ADR 0046): CDK's connected overlay in the top layer
 * (`popover`), as wide as the control, under it or over it, and scaled from the control's edge.
 */
export function listOverlay(origin: HTMLElement): CdkConnectedOverlayConfig {
  return {
    origin,
    positions,
    usePopover: 'inline',
    matchWidth: true,
    transformOriginSelector: '.popup',
  };
}
