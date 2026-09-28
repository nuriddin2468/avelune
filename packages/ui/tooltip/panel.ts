import { Component, input } from '@angular/core';
import type { AveTooltipSide } from './types';

/**
 * The tooltip's panel in the overlay, drawn by `AveTooltip`; never used on its own. Its host is a transparent frame
 * whose padding bridges the gap to the element, so the pointer can move onto the text (WCAG 1.4.13); the bubble
 * inside holds the text. It is hidden from assistive technology: the element is described by the same text.
 */
@Component({
  selector: 'ave-tooltip-panel',
  host: {
    class: 'ave-motion-tooltip-enter',
    'aria-hidden': 'true',
    '[attr.data-side]': 'side()',
    '[attr.data-state]': 'closing() ? "closing" : "open"',
    '[attr.data-ave-tooltip-of]': 'owner()',
    '[class.ave-motion-tooltip-exit]': 'closing()',
  },
  template: '<span class="bubble">{{ text() }}</span>',
  styleUrl: './panel.css',
})
export class AveTooltipPanel {
  /** The text. */
  readonly text = input('');

  /** The side of the element it shows on, after any flip; the motion moves away from the element. */
  readonly side = input<AveTooltipSide>('top');

  /** Whether it plays its exit, before the overlay detaches it. */
  readonly closing = input(false);

  /** The key of the element it belongs to (`data-ave-tooltip`), for the harness. */
  readonly owner = input('');
}
