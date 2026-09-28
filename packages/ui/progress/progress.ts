import { Component, input } from '@angular/core';
import type { AveProgressSize, AveProgressVariant } from './types';

/**
 * The kit's progress bar (ADR 0059), on a native `<progress>` with a `value` and a `max`: for work whose progress is
 * known, such as an upload or an import. The element stays native, so assistive technology reads its value as a
 * percentage; name it with a `<label for>`, `aria-labelledby` or `aria-label`, and show the value in words next to
 * it. Work of unknown length takes a spinner instead: a `<progress>` without a value draws an empty track.
 *
 * ```html
 * <label for="upload">Договор.pdf</label>
 * <progress aveProgress id="upload" [value]="sent()" [max]="size()"></progress>
 * ```
 *
 * @alpha
 */
@Component({
  selector: 'progress[aveProgress]',
  host: {
    '[attr.data-variant]': 'variant()',
    '[attr.data-size]': 'size()',
  },
  // A native progress bar shows no content.
  template: '',
  styleUrl: './progress.css',
})
export class AveProgress {
  /** The fill: `accent` (default) while the work goes on, `success` once finished, `danger` when it failed. */
  readonly variant = input<AveProgressVariant>('accent');

  /** The thickness: `sm` 4px, `md` 8px (default). */
  readonly size = input<AveProgressSize>('md');
}
