import { Directive, input } from '@angular/core';

/** Sets a header's width, in pixels, when people have set one (ADR 0087). Internal to `<ave-data-table>`. */
@Directive({
  selector: 'th[aveColumnWidth]',
  host: { '[style.--ave-data-table-column-width.px]': 'aveColumnWidth() ?? null' },
})
export class AveColumnWidth {
  /** The width people set, or none: the width the content gives. */
  readonly aveColumnWidth = input<number>();
}
