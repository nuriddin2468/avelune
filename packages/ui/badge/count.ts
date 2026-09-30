import { Component, LOCALE_ID, computed, inject, input, numberAttribute } from '@angular/core';
import { aveNumberFormat } from '@avelune/ui/i18n';

/**
 * How many items wait in a place (ADR 0079), beside its name: "Входящие 12". The number in the application's locale on
 * the accent fill; above `max` it says "99+", and at 0 it draws nothing. It is text, read after the name around it,
 * so word that name for the number to make sense.
 *
 * ```html
 * <a aveLink routerLink="/inbox">Входящие <ave-count [value]="unread()" /></a>
 * ```
 *
 * @beta
 */
@Component({
  selector: 'ave-count',
  host: { '[attr.data-empty]': 'empty() ? "" : null' },
  template: `{{ text() }}`,
  styleUrl: './count.css',
})
export class AveCount {
  /** How many items wait; a whole number. Nothing is drawn at 0 or below. */
  readonly value = input.required({ transform: numberAttribute });

  /** The largest number written out; above it the count says "99+". 99 by default. */
  readonly max = input(99, { transform: numberAttribute });

  private readonly numbers = aveNumberFormat(inject(LOCALE_ID), { maximumFractionDigits: 0 });

  protected readonly empty = computed(() => !(this.value() >= 1));

  protected readonly text = computed(() => {
    if (this.empty()) return '';
    const value = Math.floor(this.value());
    const max = Math.floor(this.max());
    return value > max ? `${this.numbers.format(max)}+` : this.numbers.format(value);
  });
}
