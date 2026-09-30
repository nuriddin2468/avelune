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
import { aveNumberFormat, injectAveMessages } from '@avelune/ui/i18n';
import { clamp, ratio } from './scale';
import type { AveNumberRange } from './types';

/** Unique ids for the names of the two thumbs. */
let nextRange = 0;

/**
 * The kit's range slider (brief §9.4, ADR 0051): the lower and the upper end of a range, two native
 * `input[type=range]` on one track, the part between them chosen. Neither thumb passes the other. Each thumb is named
 * by the field's label and its end ("Минимум", "Максимум"); the range shows, formatted, at the end of the field's
 * label row. Signal Forms bind its `value` model, Reactive Forms its value accessor.
 *
 * ```html
 * <ave-form-field label="Часы доставки">
 *   <ave-range-slider [maxValue]="24" [format]="{ style: 'unit', unit: 'hour' }" [formField]="settings.hours" />
 * </ave-form-field>
 * ```
 *
 * @beta
 */
@Component({
  selector: 'ave-range-slider',
  imports: [AveControlTarget],
  providers: [{ provide: AVE_CONTROL_OWNER, useExisting: AveRangeSlider }],
  host: {
    'data-range': '',
    // The shares of the track before each thumb: state for the stylesheet, as data-* attributes are (ADR 0051).
    '[style.--ave-slider-start]': 'shares().start',
    '[style.--ave-slider-end]': 'shares().end',
    '[attr.data-disabled]': "isDisabled() ? 'true' : null",
    '[attr.data-invalid]': "state.bound && state.showError() ? 'true' : null",
    '(focusout)': 'left($event)',
  },
  template: `
    @if (label() !== '') {
      <span hidden [id]="labelId">{{ label() }}</span>
    }
    <span hidden [id]="lowerId">{{ messages.lowerValue }}</span>
    <span hidden [id]="upperId">{{ messages.upperValue }}</span>
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
        [value]="current().start"
        [disabled]="isDisabled()"
        [attr.data-top]="startOnTop() ? '' : null"
        [attr.aria-valuetext]="write(current().start)"
        [attr.aria-labelledby]="labelledBy(lowerId)"
        (input)="moved('start', $event)"
      />
      <input
        class="range"
        type="range"
        data-focus-ring="thumb"
        [min]="minValue()"
        [max]="maxValue()"
        [step]="step()"
        [value]="current().end"
        [disabled]="isDisabled()"
        [attr.aria-valuetext]="write(current().end)"
        [attr.aria-labelledby]="labelledBy(upperId)"
        [attr.aria-describedby]="describedBy()"
        [attr.aria-invalid]="state.bound && state.showError() ? 'true' : null"
        (input)="moved('end', $event)"
      />
    </div>
    <div class="scale" aria-hidden="true">
      <span>{{ write(minValue()) }}</span>
      <span>{{ write(maxValue()) }}</span>
    </div>
  `,
  styleUrl: './slider.css',
})
export class AveRangeSlider implements ControlValueAccessor {
  /** The range, within `minValue` and `maxValue`, `start` never above `end`. Signal Forms bind it with `[formField]`. */
  readonly value = model<AveNumberRange>({ start: 0, end: 100 });

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
   * How the ends and the bounds are written, as `Intl.NumberFormatOptions` (`{ style: 'unit', unit: 'hour' }`); the
   * kit formats them in the application's locale with `aveNumberFormat`.
   */
  readonly format = input<Intl.NumberFormatOptions>({});

  /** Whether the slider is disabled. A form binding sets it too. */
  readonly disabled = input(false, { transform: booleanAttribute });

  /**
   * The accessible name when the slider has no visible label, joined with each thumb's end; an `<ave-form-field>`
   * gives it one instead.
   */
  readonly label = input('');

  /** Emits when the person leaves the slider, which marks a Signal Forms field touched. */
  readonly touch = output();

  /** The form state, read on the host, where the form binding is. */
  readonly state = injectControlState();

  /** The field around the slider, whose label row shows the range. */
  protected readonly field = inject(AVE_FIELD, { optional: true });

  protected readonly messages = injectAveMessages();
  protected readonly labelId = `ave-range-slider-${String(nextRange)}-label`;
  protected readonly lowerId = `ave-range-slider-${String(nextRange)}-lower`;
  protected readonly upperId = `ave-range-slider-${String(nextRange++)}-upper`;

  private readonly locale = inject(LOCALE_ID);
  private readonly formatter = computed(() => aveNumberFormat(this.locale, this.format()));

  /** The range within the bounds, as the inputs show it. */
  protected readonly current = computed<AveNumberRange>(() => {
    const { start, end } = this.value();
    const low = clamp(Math.min(start, end), this.minValue(), this.maxValue());
    return { start: low, end: clamp(Math.max(start, end), this.minValue(), this.maxValue()) };
  });
  protected readonly shares = computed(() => ({
    start: ratio(this.current().start, this.minValue(), this.maxValue()),
    end: ratio(this.current().end, this.minValue(), this.maxValue()),
  }));
  protected readonly text = computed(() => `${this.write(this.current().start)} – ${this.write(this.current().end)}`);
  protected readonly isDisabled = computed(() => this.disabled() || this.state.disabled() || this.disabledByForm());

  /** @internal The field around the control dims its label while the control is disabled, by input or by form. */
  readonly controlDisabled = this.isDisabled;

  /**
   * Where the thumbs meet, the one that can still move is on top: the lower thumb past the middle of the track, where
   * the upper one can only go back, and the upper one before it.
   */
  protected readonly startOnTop = computed(() => this.shares().start > 0.5);

  /** The field's hint and error describe the upper thumb too; the lower one takes them through `aveControlTarget`. */
  protected readonly describedBy = computed(() => {
    const ids = this.field?.describedBy() ?? [];
    return ids.length === 0 ? null : ids.join(' ');
  });

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly disabledByForm = signal(false);
  private changed: (value: AveNumberRange) => void = () => undefined;
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

  /** Each thumb is named by the field's label or the `label` input, when there is one, and its end. */
  protected labelledBy(own: string): string {
    const label = this.field?.labelId ?? (this.label() === '' ? undefined : this.labelId);
    return label === undefined ? own : `${label} ${own}`;
  }

  /** A thumb moved; it stops at the other, and the input is put back there when it went past. */
  protected moved(end: 'start' | 'end', event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) return;
    const { start, end: upper } = this.current();
    const wanted = Number(event.target.value);
    const next: AveNumberRange =
      end === 'start' ? { start: Math.min(wanted, upper), end: upper } : { start, end: Math.max(wanted, start) };
    const kept = end === 'start' ? next.start : next.end;
    if (kept !== wanted) event.target.value = String(kept);
    this.value.set(next);
    this.changed(next);
  }

  protected left(event: FocusEvent): void {
    const next = event.relatedTarget;
    if (next instanceof Node && this.host.contains(next)) return;
    this.touch.emit();
    this.touched();
  }

  /** @internal */
  writeValue(value: unknown): void {
    const range = value as Partial<AveNumberRange> | null;
    this.value.set(
      typeof range?.start === 'number' && typeof range.end === 'number'
        ? { start: range.start, end: range.end }
        : { start: this.minValue(), end: this.maxValue() },
    );
  }

  /** @internal */
  registerOnChange(callback: (value: AveNumberRange) => void): void {
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
