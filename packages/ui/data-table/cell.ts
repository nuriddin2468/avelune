import { Directive, TemplateRef, inject, input } from '@angular/core';

/**
 * What a cell template draws: its row.
 *
 * @alpha
 */
export interface AveCellContext<R> {
  /** The row, as `let-row`. */
  readonly $implicit: R;
}

/**
 * Draws the cells of a DataTable's column in the application's markup (ADR 0087): a link to the record, a Badge, an
 * Avatar and a name, a row's Menu. The cell's padding and alignment stay the table's.
 *
 * ```html
 * <ng-template aveCell="subject" [aveCellOf]="contracts" let-contract>
 *   <a aveLink [routerLink]="['/contracts', contract.id]">{{ contract.subject }}</a>
 * </ng-template>
 * ```
 *
 * @alpha
 */
@Directive({ selector: 'ng-template[aveCell]' })
export class AveCellTemplate<R> {
  /** The key of the column whose cells the template draws. */
  readonly aveCell = input.required<string>();

  /** The table's rows, for the template's type only: `let-row` is then one of them. */
  readonly aveCellOf = input<readonly R[]>();

  /** @internal */
  readonly template = inject<TemplateRef<AveCellContext<R>>>(TemplateRef);

  /** Types `let-row` in the template; the compiler reads it, and nothing calls it. */
  static ngTemplateContextGuard<R>(_directive: AveCellTemplate<R>, context: unknown): context is AveCellContext<R> {
    return typeof context === 'object' && context !== null && '$implicit' in context;
  }
}
