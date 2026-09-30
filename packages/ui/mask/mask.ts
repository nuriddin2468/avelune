import { isPlatformBrowser } from '@angular/common';
import {
  DestroyRef,
  Directive,
  ElementRef,
  PLATFORM_ID,
  Renderer2,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  untracked,
} from '@angular/core';
import { NgControl, type ControlValueAccessor } from '@angular/forms';
import { FORM_FIELD } from '@angular/forms/signals';
import { Maskito } from '@maskito/core';
import { aveCompileMask } from './compile';
import type { AveMaskInput } from './types';

/**
 * A mask on the kit's input (brief §9.1, ADR 0100): the person types into a pattern such as `+998 90 123-45-67`, pastes
 * a number in any shape, and sees it grouped; the form holds the clean value (`+998901234567`). Characters that do
 * not fit are not written, so the field's hint says which fit.
 *
 * ```html
 * <ave-form-field label="Телефон контрагента">
 *   <input aveInput aveMask="phone" type="tel" autocomplete="tel" [formField]="contract.phone" />
 *   <p aveHint>Например, +998 90 123-45-67</p>
 * </ave-form-field>
 * ```
 *
 * @beta
 */
@Directive({
  selector: 'input[aveInput][aveMask]',
  host: {
    '[attr.data-ave-mask]': 'kind()',
    '(input)': 'read()',
    '(blur)': 'left()',
  },
})
export class AveMask implements ControlValueAccessor {
  /**
   * What the person types: a preset (`'phone'`, `'stir'`, `'pinfl'`, `'passport'`, `'card'`, `'account'`, `'mfo'`,
   * `'postcode'`), a pattern (`{ pattern: '00-000' }`), or a `RegExp` the whole text must match after every change.
   */
  readonly aveMask = input.required<AveMaskInput>();

  /**
   * The clean value: a phone as `+998901234567`, a pattern's typed characters, a `RegExp` mask's text; empty while
   * nothing is typed. Signal Forms bind it with `[formField]`.
   */
  readonly value = model('');

  /** Emits when the person leaves the field, which marks a Signal Forms field touched. */
  readonly touch = output();

  /**
   * The patterns the value must match: what `pattern()` in a Signal Forms schema sets. The mask holds them for the
   * value, so the form never puts them on the grouped text as a native `pattern`, which that text would never match.
   */
  readonly pattern = input<readonly RegExp[]>([]);

  /** The value's shortest length: what `minLength()` in a Signal Forms schema sets, held off the grouped text. */
  readonly minLength = input<number | undefined>(undefined);

  /**
   * The value's longest length: what `maxLength()` in a Signal Forms schema sets. As a native `maxlength` on the
   * grouped text it would stop the typing short, so the mask holds it.
   */
  readonly maxLength = input<number | undefined>(undefined);

  private readonly compiled = computed(() => aveCompileMask(this.aveMask()));

  /** What the element says it is masked by: the preset, `pattern` or `regexp`, for harnesses and the application. */
  protected readonly kind = computed(() => {
    const mask = this.aveMask();
    if (typeof mask === 'string') return mask;
    return mask instanceof RegExp ? 'regexp' : 'pattern';
  });
  private readonly element = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;
  private readonly renderer = inject(Renderer2);
  private changed: (value: string) => void = () => undefined;
  private touched: () => void = () => undefined;

  constructor() {
    // Reactive Forms: the mask takes the place of the native accessor; Signal Forms bind `value` (ADR 0046).
    const ngControl =
      inject(FORM_FIELD, { self: true, optional: true }) === null
        ? inject(NgControl, { self: true, optional: true })
        : null;
    if (ngControl !== null) ngControl.valueAccessor = this;
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return;

    // The keyboard a phone shows, unless the application chose one.
    const ownInputMode = !this.element.hasAttribute('inputmode');
    const ownCapitalize = !this.element.hasAttribute('autocapitalize');
    let maskito: Maskito | null = null;
    effect(() => {
      const mask = this.compiled();
      untracked(() => {
        maskito?.destroy();
        maskito = new Maskito(this.element, mask.options);
        if (ownInputMode) this.renderer.setAttribute(this.element, 'inputmode', mask.inputMode);
        if (ownCapitalize) {
          if (mask.capitalize) this.renderer.setAttribute(this.element, 'autocapitalize', 'characters');
          else this.renderer.removeAttribute(this.element, 'autocapitalize');
        }
      });
    });
    inject(DestroyRef).onDestroy(() => {
      maskito?.destroy();
    });

    // A value the form or the application writes shows grouped; what the person typed stays as it is.
    effect(() => {
      const value = this.value();
      const mask = this.compiled();
      untracked(() => {
        if (mask.toValue(this.element.value) !== value) {
          this.renderer.setProperty(this.element, 'value', mask.toShown(value));
        }
      });
    });
  }

  /** The input changed: the value follows what it shows. */
  protected read(): void {
    const value = this.compiled().toValue(this.element.value);
    if (value === this.value()) return;
    this.value.set(value);
    this.changed(value);
  }

  /** The person left the field. */
  protected left(): void {
    this.touch.emit();
    this.touched();
  }

  /** @internal */
  writeValue(value: unknown): void {
    this.value.set(typeof value === 'string' ? value : '');
  }

  /** @internal */
  registerOnChange(callback: (value: string) => void): void {
    this.changed = callback;
  }

  /** @internal */
  registerOnTouched(callback: () => void): void {
    this.touched = callback;
  }

  /** @internal */
  setDisabledState(disabled: boolean): void {
    this.renderer.setProperty(this.element, 'disabled', disabled);
  }
}
