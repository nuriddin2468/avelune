import { Directive, TemplateRef, inject } from '@angular/core';

/**
 * The fields of a filter panel (ADR 0094), on an `ng-template`: the panel stamps them in its column or its drawer,
 * wherever it shows them, one under another, 16px apart. Their values live in the application's state.
 *
 * ```html
 * <ave-filter-panel #filters [count]="applied().length" (clear)="clearFilters()">
 *   <ng-template aveFilterPanelContent>
 *     <fieldset aveChoiceGroup legend="Статус">…</fieldset>
 *   </ng-template>
 * </ave-filter-panel>
 * ```
 *
 * @alpha
 */
@Directive({ selector: 'ng-template[aveFilterPanelContent]' })
export class AveFilterPanelContent {
  /** @internal The fields, stamped where the panel shows them. */
  readonly template = inject<TemplateRef<unknown>>(TemplateRef);
}
