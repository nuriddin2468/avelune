import { Component, afterNextRender, input, signal } from '@angular/core';
import { AVE_LIST } from './token';

/** The last place of the stagger (brief §6.3): the fifth item and those after it come together with it. */
const lastPlace = 4;

/**
 * The kit's list (brief §9.4, ADR 0086): records one under another on one surface, between lines, each an
 * `<ave-list-item>` with its start (an avatar, an icon), its content and its end (facts, a status, a menu). A row that
 * comes later fades in and opens, after the rows that came with it; a row that goes fades out and closes. The rows the
 * list holds as it first renders stay still.
 *
 * ```html
 * <ave-list label="Файлы договора">
 *   <ave-list-item>
 *     <ave-icon aveListStart name="file-text" decorative />
 *     <span>Договор ДК-2025/114.pdf</span>
 *     <span>2,4 МБ</span>
 *   </ave-list-item>
 * </ave-list>
 * ```
 *
 * Rows from data are written with `@for` inside `<ave-list>`; the docs page shows it.
 *
 * @beta
 */
@Component({
  selector: 'ave-list',
  providers: [{ provide: AVE_LIST, useExisting: AveList }],
  host: {
    role: 'list',
    '[attr.aria-label]': 'label()',
  },
  template: '<ng-content />',
  styleUrl: './list.css',
})
export class AveList {
  /** Names the list for assistive technology: what its records are ("Файлы договора"). */
  readonly label = input.required<string>();

  /** @internal Whether the list has drawn its first rows: the rows that come after them move. */
  readonly ready = signal(false);

  private coming = 0;
  private counting = false;

  constructor() {
    afterNextRender(() => {
      this.ready.set(true);
    });
  }

  /** @internal The place of a row that comes among the rows that came in the same task, up to the fifth. */
  order(): number {
    const place = Math.min(this.coming, lastPlace);
    this.coming += 1;
    if (!this.counting) {
      this.counting = true;
      setTimeout(() => {
        this.coming = 0;
        this.counting = false;
      });
    }
    return place;
  }
}
