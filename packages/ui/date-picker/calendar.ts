import {
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { Grid, GridCell, GridRow } from '@angular/aria/grid';
import { lucideChevronLeft, lucideChevronRight } from '@avelune/icons/lucide';
import { AveIconButton } from '@avelune/ui/button';
import { injectAveMessages, plainDateParts, type AveDateFormat, type AvePlainDate } from '@avelune/ui/i18n';
import { provideAveIcons } from '@avelune/ui/icon';
import { addDays, addMonths, monthOf, weeksOf, within, type CalendarMonth } from './calendar-math';

/** Unique ids for the headings of calendars. */
let nextCalendar = 0;

/** Where a day lies in a range: its first day, its last day, or between them. */
type RangePart = 'start' | 'end' | 'between';

/**
 * The month grid of a date picker (ADR 0048): a heading with the month and year between the buttons to the months
 * before and after, the weekdays from the locale's first day, and the days. Angular Aria's grid moves between the days
 * with the arrow keys and chooses one with Enter, Space or a click; at the edges of the month the arrows, and Page Up
 * and Page Down anywhere, move to the next or previous month.
 */
@Component({
  selector: 'ave-calendar',
  imports: [AveIconButton, Grid, GridCell, GridRow],
  providers: [provideAveIcons([lucideChevronLeft, lucideChevronRight])],
  template: `
    <div class="header">
      <button
        aveIconButton
        type="button"
        variant="ghost"
        size="sm"
        icon="chevron-left"
        [label]="messages.previousMonth"
        (click)="shift(-1)"
      ></button>
      <h2 class="title" aria-live="polite" [id]="titleId">{{ title() }}</h2>
      <button
        aveIconButton
        type="button"
        variant="ghost"
        size="sm"
        icon="chevron-right"
        [label]="messages.nextMonth"
        (click)="shift(1)"
      ></button>
    </div>
    <table
      class="grid"
      ngGrid
      colWrap="continuous"
      rowWrap="nowrap"
      selectionMode="explicit"
      [enableSelection]="true"
      [softDisabled]="false"
      [attr.aria-labelledby]="titleId"
    >
      <thead>
        <tr>
          @for (day of weekdays(); track $index) {
            <th scope="col" [attr.abbr]="day.long">{{ day.short }}</th>
          }
        </tr>
      </thead>
      <tbody>
        @for (week of weeks(); track $index) {
          <tr ngGridRow>
            @for (day of week; track $index) {
              @if (day === null) {
                <td class="empty" ngGridCell disabled></td>
              } @else {
                <td
                  class="day"
                  ngGridCell
                  [attr.data-date]="day"
                  [attr.aria-label]="format().long(day)"
                  [attr.aria-current]="day === today() ? 'date' : null"
                  [attr.data-range]="rangePart(day)"
                  [disabled]="!within(day, min(), max())"
                  [selected]="isChosen(day)"
                  (selectedChange)="select(day, $event)"
                >
                  {{ dayOf(day) }}
                </td>
              }
            }
          </tr>
        }
      </tbody>
    </table>
  `,
  styleUrl: './calendar.css',
})
export class AveCalendar {
  /** How the locale names and writes dates. */
  readonly format = input.required<AveDateFormat>();
  /** Today, marked in the grid. */
  readonly today = input.required<AvePlainDate>();
  /** The chosen date, or the dates of a range. */
  readonly chosen = input<readonly AvePlainDate[]>([]);
  /** The first and last date of a range, marked in the grid. */
  readonly range = input<{ readonly start: AvePlainDate | null; readonly end: AvePlainDate | null } | null>(null);
  /** The earliest date that can be chosen. */
  readonly min = input<AvePlainDate | null>(null);
  /** The latest date that can be chosen. */
  readonly max = input<AvePlainDate | null>(null);
  /** Emits the date the person chooses. */
  readonly choose = output<AvePlainDate>();

  protected readonly messages = injectAveMessages();
  protected readonly titleId = `ave-calendar-${String(nextCalendar++)}`;
  protected readonly within = within;

  /** The month shown. */
  readonly view = signal<CalendarMonth>(monthOf('2026-01-01'));

  protected readonly title = computed(() => this.format().monthYear(this.view().year, this.view().month));
  protected readonly weeks = computed(() => weeksOf(this.view(), this.format().firstDayOfWeek));
  protected readonly weekdays = computed(() => {
    const { weekdays, firstDayOfWeek } = this.format();
    return [0, 1, 2, 3, 4, 5, 6].map((offset) => weekdays[(firstDayOfWeek + offset) % 7] ?? { long: '', short: '' });
  });

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly injector = inject(Injector);

  constructor() {
    // The keys that leave the month are read before the grid's own handler, in the capture phase: the grid stops the
    // arrow keys it handles, so they would never bubble here, and a key the calendar takes must not move the grid too.
    const listener = (event: KeyboardEvent) => {
      this.navigate(event);
    };
    this.host.addEventListener('keydown', listener, { capture: true });
    inject(DestroyRef).onDestroy(() => {
      this.host.removeEventListener('keydown', listener, { capture: true });
    });
  }

  /** Shows the month of a date and moves focus to that date once it is drawn. */
  focus(date: AvePlainDate): void {
    this.view.set(monthOf(date));
    afterNextRender(
      () => {
        this.host.querySelector<HTMLElement>(`[data-date="${date}"]`)?.focus();
      },
      { injector: this.injector },
    );
  }

  protected dayOf(date: AvePlainDate): number {
    return plainDateParts(date)?.day ?? 0;
  }

  protected isChosen(date: AvePlainDate): boolean {
    return this.chosen().includes(date);
  }

  protected rangePart(date: AvePlainDate): RangePart | null {
    const range = this.range();
    if (range === null) return null;
    if (date === range.start) return 'start';
    if (date === range.end) return 'end';
    return range.start !== null && range.end !== null && date > range.start && date < range.end ? 'between' : null;
  }

  /** The grid selected a day: a click, Enter or Space on it. */
  protected select(date: AvePlainDate, selected: boolean): void {
    if (selected) this.choose.emit(date);
  }

  /** The buttons to the months before and after: the view moves; focus stays on the button. */
  protected shift(months: number): void {
    const { year, month } = this.view();
    this.view.set(monthOf(addMonths(`${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-01`, months)));
  }

  /**
   * Keys that leave the month: an arrow from a day at its edge, Page Up and Page Down (Shift for a year). The grid
   * moves within the month itself.
   */
  protected navigate(event: KeyboardEvent): void {
    const from = event.target instanceof HTMLElement ? event.target.getAttribute('data-date') : null;
    if (from === null) return;
    const steps: Readonly<Record<string, () => AvePlainDate>> = {
      ArrowLeft: () => addDays(from, -1),
      ArrowRight: () => addDays(from, 1),
      ArrowUp: () => addDays(from, -7),
      ArrowDown: () => addDays(from, 7),
      PageUp: () => addMonths(from, event.shiftKey ? -12 : -1),
      PageDown: () => addMonths(from, event.shiftKey ? 12 : 1),
    };
    const target = steps[event.key]?.();
    if (target === undefined) return;
    const view = this.view();
    const { year, month } = monthOf(target);
    const paging = event.key === 'PageUp' || event.key === 'PageDown';
    if (!paging && year === view.year && month === view.month) return;
    event.preventDefault();
    event.stopPropagation();
    if (within(target, this.min(), this.max())) this.focus(target);
  }
}
