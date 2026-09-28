import { Directive, TemplateRef, inject, input } from '@angular/core';
import type { AveOption } from './types';

/**
 * What an option template or a value template draws: the option.
 *
 * @alpha
 */
export interface AveOptionContext<V> {
  /** The option, as `let-option`. */
  readonly $implicit: AveOption<V>;
}

/**
 * Draws the inside of every option of a select, a combobox or a multiselect in the application's markup (ADR 0055),
 * inside the kit's row: its height, padding and check stay. The option is still named by its label.
 *
 * ```html
 * <ng-template aveOption [aveOptionOf]="accounts" let-option>{{ option.label }} <b>{{ option.value.balance }}</b></ng-template>
 * ```
 *
 * @alpha
 */
@Directive({ selector: 'ng-template[aveOption]' })
export class AveOptionTemplate<V> {
  /** The options the template draws, for its type only: `let-option` is then an option of their value. */
  readonly aveOptionOf = input<readonly AveOption<V>[]>();

  /** @internal */
  readonly template = inject<TemplateRef<AveOptionContext<V>>>(TemplateRef);

  /** Types `let-option` in the template; the compiler reads it, and nothing calls it. */
  static ngTemplateContextGuard<V>(_directive: AveOptionTemplate<V>, context: unknown): context is AveOptionContext<V> {
    return typeof context === 'object' && context !== null && '$implicit' in context;
  }
}

/**
 * Draws the chosen value inside a select's trigger in the application's markup (ADR 0055): its box, chevron and
 * clear button stay.
 *
 * ```html
 * <ng-template aveSelectValue [aveSelectValueOf]="accounts" let-option>{{ option.value.number }}</ng-template>
 * ```
 *
 * @alpha
 */
@Directive({ selector: 'ng-template[aveSelectValue]' })
export class AveSelectValueTemplate<V> {
  /** The options the template draws, for its type only: `let-option` is then an option of their value. */
  readonly aveSelectValueOf = input<readonly AveOption<V>[]>();

  /** @internal */
  readonly template = inject<TemplateRef<AveOptionContext<V>>>(TemplateRef);

  /** Types `let-option` in the template; the compiler reads it, and nothing calls it. */
  static ngTemplateContextGuard<V>(
    _directive: AveSelectValueTemplate<V>,
    context: unknown,
  ): context is AveOptionContext<V> {
    return typeof context === 'object' && context !== null && '$implicit' in context;
  }
}
