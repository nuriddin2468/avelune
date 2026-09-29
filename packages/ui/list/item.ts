import { Component, inject } from '@angular/core';
import { AVE_LIST } from './token';

/**
 * One record of `<ave-list>` (ADR 0086): `[aveListStart]` (an avatar or an icon), its content, and `[aveListEnd]`
 * (facts, a status, a menu), on a row between lines. It enters with the catalog's list motion once the list has drawn
 * its first rows, and leaves with it.
 *
 * ```html
 * <ave-list-item>
 *   <ave-avatar aveListStart name="Азиза Каримова" decorative />
 *   <span>Азиза Каримова</span>
 *   <ave-badge aveListEnd variant="success">Согласовала</ave-badge>
 * </ave-list-item>
 * ```
 *
 * @alpha
 */
@Component({
  selector: 'ave-list-item',
  host: {
    role: 'listitem',
    '[animate.enter]': 'enter',
    'animate.leave': 'ave-motion-list-exit',
    '[style.--ave-motion-order]': 'order',
  },
  template: `
    <div class="clip">
      <div class="row">
        <div class="start"><ng-content select="[aveListStart]" /></div>
        <div class="content"><ng-content /></div>
        <div class="end"><ng-content select="[aveListEnd]" /></div>
      </div>
    </div>
  `,
  styleUrl: './item.css',
})
export class AveListItem {
  private readonly list = inject(AVE_LIST, { optional: true });

  /** Whether the row comes after the list's first rows: then it fades in and opens. */
  private readonly later = this.list?.ready() === true;

  protected readonly enter = this.later ? 'ave-motion-list-enter' : '';

  /** Its place among the rows that came with it, for the stagger. */
  protected readonly order = this.later ? (this.list?.order() ?? 0) : 0;
}
