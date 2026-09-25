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
import { lucideCalendar } from '@avelune/icons/lucide';
import { AVE_CONTROL_OWNER, AVE_FIELD, AveControlTarget, injectControlState } from '@avelune/ui/forms';
import { aveDateFormat, injectAveMessages, type AvePlainDate } from '@avelune/ui/i18n';
import { AveIcon, provideAveIcons } from '@avelune/ui/icon';
import { aveConnectedOverlay, aveOverlayPresence } from '@avelune/ui/overlay';
import { AveCalendar } from './calendar';
import { today, within } from './calendar-math';
import type { AveDatePickerSize, AveDateRange } from './types';

/** Unique ids for the names of the two inputs. */
let nextRange = 0;

/** Which end of the range the next date chosen in the calendar sets. */
type RangeEnd = 'start' | 'end';

/**
 * The kit's date range field (brief §9.1, ADR 0048): two inputs for the first and the last date, a dash between them,
 * and one calendar in which the first choice sets the start and the second the end (days between are marked). Typed
 * dates are read in the locale's order as in a date field; an end before the start swaps them. The value is an
 * `AveDateRange` of ISO dates, or `null` while both are missing. Signal Forms bind its `value` model, Reactive Forms its
 * value accessor. Put it in an `<ave-form-field>`: each input is named by the field's label and "Start date" or "End
 * date" in the locale.
 *
 * ```html
 * <ave-date-range-picker [formField]="contract.period" />
 * ```
 *
 * @alpha
 */
@Component({
  selector: 'ave-date-range-picker',
  imports: [AveCalendar, AveControlTarget, AveIcon, CdkTrapFocus, OverlayModule],
  providers: [provideAveIcons([lucideCalendar]), { provide: AVE_CONTROL_OWNER, useExisting: AveDateRangePicker }],
  host: {
    '[attr.data-size]': 'size()',
    '(focusout)': 'left($event)',
  },
  template: `
    @if (label() !== '') {
      <span hidden [id]="labelId">{{ label() }}</span>
    }
    <span hidden [id]="startNameId">{{ messages.rangeStart }}</span>
    <span hidden [id]="endNameId">{{ messages.rangeEnd }}</span>
    <div class="range" #origin>
      <input
        class="trigger start"
        type="text"
        inputmode="numeric"
        autocomplete="off"
        aveControlTarget
        [value]="startText()"
        [disabled]="isDisabled()"
        [readOnly]="readonly()"
        [attr.placeholder]="format.placeholder"
        [attr.aria-labelledby]="labelledBy(startNameId)"
        (input)="typed('start', $event)"
        (keydown.enter)="commit()"
      />
      <span class="dash" aria-hidden="true">–</span>
      <div class="end">
        <input
          class="trigger"
          type="text"
          inputmode="numeric"
          autocomplete="off"
          [value]="endText()"
          [disabled]="isDisabled()"
          [readOnly]="readonly()"
          [attr.placeholder]="format.placeholder"
          [attr.aria-labelledby]="labelledBy(endNameId)"
          [attr.aria-describedby]="describedBy()"
          [attr.aria-invalid]="state.bound && state.showError() ? 'true' : null"
          (input)="typed('end', $event)"
          (keydown.enter)="commit()"
        />
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
      </div>
    </div>
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
          [range]="current()"
          [min]="earliest()"
          [max]="latest()"
          (choose)="choose($event)"
        />
      </div>
    </ng-template>
  `,
  styleUrls: ['./field.css', './popup.css', './range.css'],
})
export class AveDateRangePicker implements ControlValueAccessor {
  /** The range: its first and last ISO dates, or `null` while both are missing. */
  readonly value = model<AveDateRange | null>(null);

  /** The earliest date that can be chosen or typed, as an ISO date. */
  readonly minDate = input<AvePlainDate | null>(null);

  /** The latest date that can be chosen or typed, as an ISO date. */
  readonly maxDate = input<AvePlainDate | null>(null);

  /** The size: the box of an Input of that size, for each input. */
  readonly size = input<AveDatePickerSize>('md');

  /** Whether the field is disabled. A form binding sets it too. */
  readonly disabled = input(false, { transform: booleanAttribute });

  /** Whether the range can be read but not changed. A form binding sets it too. */
  readonly readonly = input(false, { transform: booleanAttribute });

  /**
   * The accessible name when the field has no visible label, joined with "Start date" and "End date"; an
   * `<ave-form-field>` gives it one instead.
   */
  readonly label = input('');

  /** Emits when the person leaves the field, which marks a Signal Forms field touched. */
  readonly touch = output();

  /** The form state, read on the host, where the form binding is. */
  readonly state = injectControlState();

  protected readonly format = aveDateFormat(inject(LOCALE_ID));
  protected readonly messages = injectAveMessages();
  protected readonly today = today();
  protected readonly labelId = `ave-range-${String(nextRange)}-label`;
  protected readonly startNameId = `ave-range-${String(nextRange)}-start`;
  protected readonly endNameId = `ave-range-${String(nextRange++)}-end`;

  private readonly field = inject(AVE_FIELD, { optional: true });

  /** The range as the calendar marks it. */
  protected readonly current = computed<AveDateRange>(() => this.value() ?? { start: null, end: null });
  protected readonly chosen = computed(() =>
    [this.current().start, this.current().end].filter((date) => date !== null),
  );
  protected readonly startText = linkedSignal(() => this.written(this.current().start));
  protected readonly endText = linkedSignal(() => this.written(this.current().end));
  protected readonly earliest = this.minDate;
  protected readonly latest = this.maxDate;
  protected readonly isDisabled = computed(() => this.disabled() || this.state.disabled() || this.disabledByForm());

  /** @internal The field around the control dims its label while the control is disabled, by input or by form. */
  readonly controlDisabled = this.isDisabled;

  /** The field's hint and error describe the end input too; the start input takes them through `aveControlTarget`. */
  protected readonly describedBy = computed(() => {
    const ids = this.field?.describedBy() ?? [];
    return ids.length === 0 ? null : ids.join(' ');
  });

  /** Whether the calendar is open, and which end of the range its next choice sets. */
  protected readonly expanded = signal(false);
  private readonly setting = signal<RangeEnd>('start');

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly injector = inject(Injector);
  private readonly origin = viewChild.required<ElementRef<HTMLElement>>('origin');
  private readonly opener = viewChild.required<ElementRef<HTMLButtonElement>>('opener');
  private readonly popup = viewChild<ElementRef<HTMLElement>>('popup');
  private readonly calendar = viewChild(AveCalendar);

  protected readonly overlay = computed(() =>
    aveConnectedOverlay(this.origin().nativeElement, { matchWidth: false, transformOrigin: '.popup' }),
  );

  /** The overlay stays open while the calendar plays its exit (ADR 0046). */
  protected readonly presence = aveOverlayPresence(
    this.expanded,
    computed(() => this.popup()?.nativeElement),
  );

  private readonly disabledByForm = signal(false);
  private changed: (value: AveDateRange | null) => void = () => undefined;
  private touched: () => void = () => undefined;

  constructor() {
    // Reactive Forms reach the field through its value accessor; Signal Forms through its value model.
    const ngControl =
      inject(FORM_FIELD, { self: true, optional: true }) === null
        ? inject(NgControl, { self: true, optional: true })
        : null;
    if (ngControl !== null) ngControl.valueAccessor = this;
  }

  /** Each input is named by the field's label or the `label` input, when there is one, and its part ("Start date"). */
  protected labelledBy(own: string): string {
    const label = this.field?.labelId ?? (this.label() === '' ? undefined : this.labelId);
    return label === undefined ? own : `${label} ${own}`;
  }

  /**
   * The button opens the calendar: on the start, to set the end when only the start is there; otherwise to set a new
   * start. A second press closes it.
   */
  protected toggle(): void {
    if (this.expanded()) {
      this.close(false);
      return;
    }
    this.commit();
    const { start, end } = this.current();
    this.setting.set(start !== null && end === null ? 'end' : 'start');
    this.expanded.set(true);
    const focus = start ?? this.clamp(this.today);
    afterNextRender(() => this.calendar()?.focus(focus), { injector: this.injector });
  }

  protected close(returnFocus: boolean): void {
    this.expanded.set(false);
    if (returnFocus) this.opener().nativeElement.focus();
  }

  protected outside(event: MouseEvent): void {
    if (event.target instanceof Node && this.host.contains(event.target)) return;
    this.close(false);
  }

  /** A date chosen in the calendar: the start first, then the end, which closes the calendar. */
  protected choose(date: AvePlainDate): void {
    const { start } = this.current();
    if (this.setting() === 'start' || start === null || date < start) {
      this.set({ start: date, end: null });
      this.setting.set('end');
      return;
    }
    this.set({ start, end: date });
    this.close(true);
  }

  protected typed(end: 'start' | 'end', event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) return;
    if (end === 'start') this.startText.set(event.target.value);
    else this.endText.set(event.target.value);
  }

  /** Reads both inputs: dates within the bounds are taken, empty inputs clear their end, the rest is put back. */
  protected commit(): void {
    const read = (text: string, current: AvePlainDate | null): AvePlainDate | null => {
      if (text.trim() === '') return null;
      const date = this.format.parse(text);
      return date !== null && within(date, this.earliest(), this.latest()) ? date : current;
    };
    const { start, end } = this.current();
    let next: AveDateRange = { start: read(this.startText(), start), end: read(this.endText(), end) };
    if (next.start !== null && next.end !== null && next.end < next.start) next = { start: next.end, end: next.start };
    this.startText.set(this.written(next.start));
    this.endText.set(this.written(next.end));
    if (next.start !== start || next.end !== end) this.set(next);
  }

  protected left(event: FocusEvent): void {
    const next = event.relatedTarget;
    if (next instanceof Node && this.host.contains(next)) return;
    this.commit();
    if (this.expanded()) this.close(false);
    this.touch.emit();
    this.touched();
  }

  private written(date: AvePlainDate | null): string {
    return date === null ? '' : this.format.numeric(date);
  }

  private set(range: AveDateRange): void {
    const value = range.start === null && range.end === null ? null : range;
    this.value.set(value);
    this.changed(value);
  }

  private clamp(date: AvePlainDate): AvePlainDate {
    const min = this.earliest();
    const max = this.latest();
    if (min !== null && date < min) return min;
    if (max !== null && date > max) return max;
    return date;
  }

  /** @internal */
  writeValue(value: unknown): void {
    this.value.set(typeof value === 'object' && value !== null ? (value as AveDateRange) : null);
  }

  /** @internal */
  registerOnChange(callback: (value: AveDateRange | null) => void): void {
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
