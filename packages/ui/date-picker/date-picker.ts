import {
  Component,
  ElementRef,
  Injector,
  LOCALE_ID,
  afterNextRender,
  booleanAttribute,
  computed,
  inject,
  input,
  linkedSignal,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { CdkTrapFocus } from '@angular/cdk/a11y';
import { OverlayModule } from '@angular/cdk/overlay';
import { NgControl, type ControlValueAccessor } from '@angular/forms';
import { FORM_FIELD } from '@angular/forms/signals';
import { lucideCalendar, lucideX } from '@avelune/icons/lucide';
import { AVE_CONTROL_OWNER, AveClearButton, AveControlTarget, injectControlState } from '@avelune/ui/forms';
import { aveDateFormat, injectAveMessages, type AvePlainDate } from '@avelune/ui/i18n';
import { AveIcon, provideAveIcons } from '@avelune/ui/icon';
import { aveConnectedOverlay, aveOverlayPresence } from '@avelune/ui/overlay';
import { AveCalendar } from './calendar';
import { clamp, today, within } from './calendar-math';
import type { AveDatePickerSize } from './types';

/**
 * The kit's date field (brief §9.1, ADR 0048): an input with the box of an Input, in which people type a date in the
 * locale's order (`23.09.2026` in Russian, `23/09/2026` in Uzbek, `09/23/2026` in English), and a button that opens a
 * calendar of the month, with the locale's month names and first day of the week. The value is an ISO date
 * (`2026-09-23`) or `null`. Signal Forms bind its `value` model (`[formField]`), Reactive Forms its value accessor. Put
 * it in an `<ave-form-field>` for its label, hint and error.
 *
 * ```html
 * <ave-date-picker [formField]="contract.signedOn" maxDate="2026-12-31" />
 * ```
 *
 * @alpha
 */
@Component({
  selector: 'ave-date-picker',
  imports: [AveCalendar, AveClearButton, AveControlTarget, AveIcon, CdkTrapFocus, OverlayModule],
  providers: [provideAveIcons([lucideCalendar, lucideX]), { provide: AVE_CONTROL_OWNER, useExisting: AveDatePicker }],
  host: {
    '[attr.data-size]': 'size()',
    '(focusout)': 'left($event)',
  },
  template: `
    <input
      #input
      class="trigger"
      type="text"
      inputmode="numeric"
      autocomplete="off"
      aveControlTarget
      [value]="text()"
      [disabled]="isDisabled()"
      [readOnly]="readonly()"
      [attr.placeholder]="format.placeholder"
      [attr.aria-label]="label() || null"
      [attr.data-clear]="clearable() ? '' : null"
      (input)="typed($event)"
      (keydown.enter)="commit()"
    />
    @if (clearable()) {
      <button aveClearButton type="button" class="clear" [label]="label()" (click)="clear()">
        <ave-icon name="x" decorative />
      </button>
    }
    <button
      #opener
      class="open"
      type="button"
      data-focus-ring="inset"
      aria-haspopup="dialog"
      [attr.aria-expanded]="expanded()"
      [attr.aria-label]="messages.chooseDate"
      [disabled]="isDisabled() || readonly()"
      (click)="toggle()"
    >
      <ave-icon name="calendar" decorative />
    </button>
    <ng-template
      [cdkConnectedOverlay]="overlay()"
      [cdkConnectedOverlayOpen]="presence.open()"
      (overlayOutsideClick)="outside($event)"
    >
      <div
        #popup
        class="popup ave-motion-popover-enter"
        role="dialog"
        aria-modal="true"
        cdkTrapFocus
        [class.ave-motion-popover-exit]="presence.closing()"
        [attr.aria-label]="messages.chooseDate"
        (keydown.escape)="close(true)"
      >
        <ave-calendar
          [format]="format"
          [today]="today"
          [chosen]="chosen()"
          [min]="earliest()"
          [max]="latest()"
          (choose)="choose($event)"
        />
      </div>
    </ng-template>
  `,
  styleUrls: ['./field.css', './popup.css'],
})
export class AveDatePicker implements ControlValueAccessor {
  /** The chosen date as an ISO date (`2026-09-23`), or `null`. Signal Forms bind it with `[formField]`. */
  readonly value = model<AvePlainDate | null>(null);

  /** The earliest date that can be chosen or typed, as an ISO date. */
  readonly minDate = input<AvePlainDate | null>(null);

  /** The latest date that can be chosen or typed, as an ISO date. */
  readonly maxDate = input<AvePlainDate | null>(null);

  /** The bounds. */
  protected readonly earliest = this.minDate;
  protected readonly latest = this.maxDate;

  /** The size: the box of an Input of that size. */
  readonly size = input<AveDatePickerSize>('md');

  /** Whether the field is disabled. A form binding sets it too. */
  readonly disabled = input(false, { transform: booleanAttribute });

  /** Whether the date can be read but not changed. A form binding sets it too. */
  readonly readonly = input(false, { transform: booleanAttribute });

  /** The accessible name when the field has no visible label; an `<ave-form-field>` gives it one instead. */
  readonly label = input('');

  /** Emits when the person leaves the field, which marks a Signal Forms field touched. */
  readonly touch = output();

  /** The form state, read on the host, where the form binding is. */
  readonly state = injectControlState();

  /** How the application's locale writes and names dates. */
  protected readonly format = aveDateFormat(inject(LOCALE_ID));
  protected readonly messages = injectAveMessages();
  protected readonly today = today();

  /** What the input says: the value in the locale's order, reset whenever it changes, or what the person types. */
  protected readonly text = linkedSignal(() => {
    const value = this.value();
    return value === null ? '' : this.format.numeric(value);
  });

  /** Whether the calendar is open. */
  protected readonly expanded = signal(false);
  protected readonly chosen = computed<readonly AvePlainDate[]>(() => {
    const value = this.value();
    return value === null ? [] : [value];
  });
  protected readonly isDisabled = computed(() => this.disabled() || this.state.disabled() || this.disabledByForm());

  /** Whether the clear button shows: a date that can be changed and may be taken away (ADR 0052). */
  protected readonly clearable = computed(
    () => this.value() !== null && !this.isDisabled() && !this.readonly() && !this.state.required(),
  );

  /** @internal The field around the control dims its label while the control is disabled, by input or by form. */
  readonly controlDisabled = this.isDisabled;

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly injector = inject(Injector);
  private readonly input = viewChild.required<ElementRef<HTMLInputElement>>('input');
  private readonly opener = viewChild.required<ElementRef<HTMLButtonElement>>('opener');
  private readonly popup = viewChild<ElementRef<HTMLElement>>('popup');
  private readonly calendar = viewChild(AveCalendar);

  protected readonly overlay = computed(() =>
    aveConnectedOverlay(this.input().nativeElement, { matchWidth: false, transformOrigin: '.popup' }),
  );

  /** The overlay stays open while the calendar plays its exit (ADR 0046). */
  protected readonly presence = aveOverlayPresence(
    this.expanded,
    computed(() => this.popup()?.nativeElement),
  );

  private readonly disabledByForm = signal(false);
  private changed: (value: AvePlainDate | null) => void = () => undefined;
  private touched: () => void = () => undefined;

  constructor() {
    // Reactive Forms reach the field through its value accessor; Signal Forms through its value model.
    const ngControl =
      inject(FORM_FIELD, { self: true, optional: true }) === null
        ? inject(NgControl, { self: true, optional: true })
        : null;
    if (ngControl !== null) ngControl.valueAccessor = this;
  }

  /** The button opens the calendar on the chosen date, or today, and moves focus into it; a second press closes it. */
  protected toggle(): void {
    if (this.expanded()) {
      this.close(false);
      return;
    }
    this.commit();
    this.expanded.set(true);
    const start = this.value() ?? clamp(this.today, this.earliest(), this.latest());
    afterNextRender(() => this.calendar()?.focus(start), { injector: this.injector });
  }

  /** The calendar closes; focus goes back to the button when it was in the calendar. */
  protected close(returnFocus: boolean): void {
    this.expanded.set(false);
    if (returnFocus) this.opener().nativeElement.focus();
  }

  /** A click outside the field and its calendar closes the calendar; one on the field's own button toggles it. */
  protected outside(event: MouseEvent): void {
    if (event.target instanceof Node && this.host.contains(event.target)) return;
    this.close(false);
  }

  /** The clear button: the field empties, the calendar closes, and focus is in the input (ADR 0052). */
  protected clear(): void {
    this.set(null);
    this.expanded.set(false);
    this.input().nativeElement.focus();
  }

  /** The person chose a date in the calendar. */
  protected choose(date: AvePlainDate): void {
    this.set(date);
    this.close(true);
  }

  protected typed(event: Event): void {
    if (event.target instanceof HTMLInputElement) this.text.set(event.target.value);
  }

  /** Reads what was typed: a date within the bounds becomes the value, an empty field clears it, anything else is put back. */
  protected commit(): void {
    const text = this.text().trim();
    if (text === '') {
      if (this.value() !== null) this.set(null);
      return;
    }
    const date = this.format.parse(text);
    if (date !== null && within(date, this.earliest(), this.latest())) this.set(date);
    else this.text.set(this.value() === null ? '' : this.format.numeric(this.value() ?? ''));
  }

  /** Focus left the field and its calendar: what was typed is read, and the field is touched. */
  protected left(event: FocusEvent): void {
    const next = event.relatedTarget;
    if (next instanceof Node && this.host.contains(next)) return;
    this.commit();
    if (this.expanded()) this.close(false);
    this.touch.emit();
    this.touched();
  }

  private set(date: AvePlainDate | null): void {
    this.value.set(date);
    this.text.set(date === null ? '' : this.format.numeric(date));
    this.changed(date);
  }

  /** @internal */
  writeValue(value: unknown): void {
    this.value.set(typeof value === 'string' ? value : null);
  }

  /** @internal */
  registerOnChange(callback: (value: AvePlainDate | null) => void): void {
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
