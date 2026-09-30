import { Component, computed, input, numberAttribute } from '@angular/core';
import type { AveSkeletonShape } from './types';

/**
 * The kit's skeleton (brief §6.3, §7.3, ADR 0060): the shape of content that is on its way, so the page does not
 * jump when it arrives. Lines of body text, or a block as large as the application makes it, in
 * `color.bg.placeholder`, with the shimmer of the motion catalog sweeping across; under reduced motion the fill stands
 * still. It is hidden from assistive technology: mark the region that loads `aria-busy="true"` and say that it loads.
 *
 * ```html
 * <section aria-busy="true" aria-labelledby="title">
 *   <h2 id="title">Договоры</h2>
 *   <ave-skeleton lines="3" />
 * </section>
 * ```
 *
 * @beta
 */
@Component({
  selector: 'ave-skeleton',
  host: {
    'aria-hidden': 'true',
    '[attr.data-shape]': 'shape()',
  },
  template: `
    @for (line of rows(); track line) {
      <span class="part"><span class="highlight ave-motion-shimmer"></span></span>
    }
  `,
  styleUrl: './skeleton.css',
})
export class AveSkeleton {
  /** What it stands for: `text` (default), lines of body text; `block`, a box the application sizes. */
  readonly shape = input<AveSkeletonShape>('text');

  /** How many lines of text it stands for, 1 by default; the last of several is shorter, as a paragraph ends. */
  readonly lines = input(1, { transform: numberAttribute });

  /** One part per line of text, or the one block. */
  protected readonly rows = computed(() =>
    Array.from(
      { length: this.shape() === 'block' ? 1 : Math.max(1, Math.floor(this.lines() || 1)) },
      (_, index) => index,
    ),
  );
}
