import {
  Component,
  DestroyRef,
  ElementRef,
  LOCALE_ID,
  booleanAttribute,
  computed,
  inject,
  input,
  model,
  numberAttribute,
  output,
  signal,
} from '@angular/core';
import { NgControl, type ControlValueAccessor } from '@angular/forms';
import { FORM_FIELD } from '@angular/forms/signals';
import { AVE_CONTROL_OWNER, AVE_FIELD, AveControlTarget, injectControlState } from '@avelune/ui/forms';
import { aveNumberFormat } from '@avelune/ui/i18n';
import { clamp, ratio } from './scale';

/**
 * The kit's slider (brief §9.4, ADR 0051): a number within bounds, chosen by dragging a thumb along a track. It is a
 * native `input[type=range]`, so the keyboard, the role and the value are the browser's; the kit draws the track, the
 * chosen part and the thumb, and writes the bounds under the track's ends. The value, formatted in the locale, shows
 * at the end of the `<ave-form-field>`'s label row (product owner, 2026-09-25). Signal Forms bind its `value` model
 * (`[formField]`), Reactive Forms its value accessor.
 *
 * ```html
 * <ave-form-field label="Аванс">
 *   <ave-slider [maxValue]="50" [step]="5" [format]="{ style: 'unit', unit: 'percent' }" [formField]="contract.advance" />
 * </ave-form-field>
 * ```
 *
 * @alpha
 */
@Component({
  selector: 'ave-slider',
  imports: [AveControlTarget],
  providers: [{ provide: AVE_CONTROL_OWNER, useExisting: AveSlider }],
  host: {
    // The share of the track before the thumb: state for the stylesheet, as data-* attributes are (ADR 0051).
    '[style.--ave-slider-end]': 'share()',
    '[attr.data-disabled]': "isDisabled() ? 'true' : null",
    '[attr.data-invalid]': "state.bound && state.showError() ? 'true' : null",
    '(focusout)': 'left($event)',
  },
  template: `
    @if (field === null) {
      <span class="head" aria-hidden="true">{{ text() }}</span>
    }
    <div class="control">
      <div class="track"><div class="fill"></div></div>
      <input
        class="range"
        type="range"
        data-focus-ring="thumb"
        aveControlTarget
        [min]="minValue()"
        [max]="maxValue()"
        [step]="step()"
        [value]="current()"
        [disabled]="isDisabled()"
        [attr.aria-valuetext]="text()"
        [attr.aria-label]="field === null ? label() || null : null"
        (input)="moved($event)"
      />
    </div>
    <div class="scale" aria-hidden="true">
      <span>{{ write(minValue()) }}</span>
      <span>{{ write(maxValue()) }}</span>
    </div>
  `,
  styleUrl: './slider.css',
})
export class AveSlider implements ControlValueAccessor {
  /** The value, within `minValue` and `maxValue`. Signal Forms bind it with `[formField]`. */
  readonly value = model(0);

  /**
   * The lower bound. Named apart from Signal Forms' `min` rule, which a control takes as its own value's type
   * (ADR 0048, 0051); a schema's `min()` still validates.
   */
  readonly minValue = input(0, { transform: numberAttribute });

  /** The upper bound; a schema's `max()` still validates. */
  readonly maxValue = input(100, { transform: numberAttribute });

  /** The step between values: the arrow keys move by it, and a drag lands on it. */
  readonly step = input(1, { transform: numberAttribute });

  /**
   * How the value and the bounds are written, as `Intl.NumberFormatOptions` (`{ style: 'unit', unit: 'percent' }`);
   * the kit formats them in the application's locale with `aveNumberFormat`.
   */
  readonly format = input<Intl.NumberFormatOptions>({});

  /** Whether the slider is disabled. A form binding sets it too. */
  readonly disabled = input(false, { transform: booleanAttribute });

  /** The accessible name when the slider has no visible label; an `<ave-form-field>` gives it one instead. */
  readonly label = input('');

  /** Emits when the person leaves the slider, which marks a Signal Forms field touched. */
  readonly touch = output();

  /** The form state, read on the host, where the form binding is. */
  readonly state = injectControlState();

  /** The field around the slider, whose label row shows the value. */
  protected readonly field = inject(AVE_FIELD, { optional: true });

  private readonly locale = inject(LOCALE_ID);
  private readonly formatter = computed(() => aveNumberFormat(this.locale, this.format()));

  /** The value within the bounds, as the input shows it. */
  protected readonly current = computed(() => clamp(this.value(), this.minValue(), this.maxValue()));
  protected readonly share = computed(() => ratio(this.current(), this.minValue(), this.maxValue()));
  protected readonly text = computed(() => this.write(this.current()));
  protected readonly isDisabled = computed(() => this.disabled() || this.state.disabled() || this.disabledByForm());

  /** @internal The field around the control dims its label while the control is disabled, by input or by form. */
  readonly controlDisabled = this.isDisabled;

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly disabledByForm = signal(false);
  private changed: (value: number) => void = () => undefined;
  private touched: () => void = () => undefined;

  constructor() {
    const remove = this.field?.showValue?.(this.text);
    if (remove !== undefined) inject(DestroyRef).onDestroy(remove);
    // Reactive Forms reach the slider through its value accessor; Signal Forms through its value model.
    const ngControl =
      inject(FORM_FIELD, { self: true, optional: true }) === null
        ? inject(NgControl, { self: true, optional: true })
        : null;
    if (ngControl !== null) ngControl.valueAccessor = this;
  }

  /** A number as the slider writes it, in the locale and the `format`. */
  protected write(value: number): string {
    return this.formatter().format(value);
  }

  protected moved(event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) return;
    const value = Number(event.target.value);
    this.value.set(value);
    this.changed(value);
  }

  protected left(event: FocusEvent): void {
    const next = event.relatedTarget;
    if (next instanceof Node && this.host.contains(next)) return;
    this.touch.emit();
    this.touched();
  }

  /** @internal */
  writeValue(value: unknown): void {
    this.value.set(typeof value === 'number' && Number.isFinite(value) ? value : this.minValue());
  }

  /** @internal */
  registerOnChange(callback: (value: number) => void): void {
    this.changed = callback;
  }

  /** @internal */
  registerOnTouched(callback: () => void): void {
    this.touched = callback;
  }

  /** @internal */
  setDisabledState(disabled: boolean): void {
    this.disabledByForm.set(disabled);
  }
}
