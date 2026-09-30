import { Component, input } from '@angular/core';
import type { AveBadgeVariant } from './types';

/**
 * The kit's badge (brief §9.4, ADR 0079): the status of a record in words, on the tinted fill of what it means. The
 * words say the status and the colour repeats it, so it never rests on colour. It has no role: a status that changes
 * after an action is announced by what the action shows.
 *
 * ```html
 * <ave-badge variant="success">Подписан</ave-badge>
 * ```
 *
 * @beta
 */
@Component({
  selector: 'ave-badge',
  host: { '[attr.data-variant]': 'variant()' },
  template: '<ng-content />',
  styleUrl: './badge.css',
})
export class AveBadge {
  /** What the status means: `neutral` (default), `info`, `success`, `warning` or `danger`. */
  readonly variant = input<AveBadgeVariant>('neutral');
}
