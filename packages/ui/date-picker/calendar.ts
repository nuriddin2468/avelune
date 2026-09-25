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
import { injectAveMessages, toPlainDate, type AveDateFormat, type AvePlainDate } from '@avelune/ui/i18n';
import { provideAveIcons } from '@avelune/ui/icon';
import {
  addDays,
  addMonths,
  clamp,
  dayOfMonth,
  daysIn,
  monthOf,
  monthWithin,
  weeksOf,
  within,
  yearPage,
  yearWithin,
  type CalendarMonth,
} from './calendar-math';

/** Unique ids for the headings of calendars. */
let nextCalendar = 0;

/** Where a day lies in a range: its first day, its last day, or between them. */
type RangePart = 'start' | 'end' | 'between';

/** What the calendar shows: the days of a month, the months of a year, or a page of twelve years (ADR 0053). */
type CalendarView = 'days' | 'months' | 'years';

/** A cell of one of the views. */
type CalendarCell = { readonly day: AvePlainDate } | { readonly month: number } | { readonly year: number };

/** The months and the years are three columns by four rows. */
const rowsOfThree = <T>(items: readonly T[]): T[][] => [0, 3, 6, 9].map((start) => items.slice(start, start + 3));

/**
 * The calendar of a date picker (ADR 0048, 0053): a heading between the buttons to the months before and after, and
 * the days of a month under the weekdays from the locale's first day. The heading is a button that shows the months
 * of the year, and then a page of twelve years, for dates far away. Each view is a grid on Angular Aria's grid: the
 * arrow keys move, Enter, Space or a click choose; at the edges the arrows, and Page Up and Page Down anywhere, move to
 * the next or previous month, year or page. Escape in the months or years goes back to the days.
 */
@Component({
  selector: 'ave-calendar',
  imports: [AveIconButton, Grid, GridCell, GridRow],
  providers: [provideAveIcons([lucideChevronLeft, lucideChevronRight])],
  host: {
    tabindex: '-1',
    '[attr.data-view]': 'mode()',
  },
  template: `
    <div class="header">
      <button
        aveIconButton
        type="button"
        variant="ghost"
        size="sm"
        icon="chevron-left"
        [label]="labels().previous"
        (click)="shift(-1)"
      ></button>
      <h2 class="heading" aria-live="polite" [id]="titleId">
        @if (mode() === 'years') {
          <span class="title">{{ title() }}</span>
        } @else {
          <button type="button" class="title" [attr.aria-describedby]="hintId" (click)="zoomOut()">
            {{ title() }}
          </button>
        }
      </h2>
      <span hidden [id]="hintId">{{ labels().heading }}</span>
      <button
        aveIconButton
        type="button"
        variant="ghost"
        size="sm"
        icon="chevron-right"
        [label]="labels().next"
        (click)="shift(1)"
      ></button>
    </div>
    <div class="body">
      @switch (mode()) {
        @case ('months') {
          <div
            class="picks"
            ngGrid
            colWrap="continuous"
            rowWrap="nowrap"
            selectionMode="explicit"
            [enableSelection]="true"
            [softDisabled]="false"
            [attr.aria-labelledby]="titleId"
          >
            @for (row of monthRows; track $index) {
              <div class="row" ngGridRow>
                @for (month of row; track month) {
                  <div
                    class="pick"
                    ngGridCell
                    [attr.data-month]="monthKey(month)"
                    [attr.aria-label]="format().monthYear(view().year, month)"
                    [attr.aria-current]="isThisMonth(month) ? 'date' : null"
                    [disabled]="!monthWithin(view().year, month, min(), max())"
                    [selected]="isChosenMonth(month)"
                    (selectedChange)="changed($event, { month })"
                  >
                    {{ format().months[month - 1] }}
                  </div>
                }
              </div>
            }
          </div>
        }
        @case ('years') {
          <div
            class="picks"
            ngGrid
            colWrap="continuous"
            rowWrap="nowrap"
            selectionMode="explicit"
            [enableSelection]="true"
            [softDisabled]="false"
            [attr.aria-labelledby]="titleId"
          >
            @for (row of yearRows(); track $index) {
              <div class="row" ngGridRow>
                @for (year of row; track year) {
                  <div
                    class="pick"
                    ngGridCell
                    [attr.data-year]="year"
                    [attr.aria-current]="year === thisYear() ? 'date' : null"
                    [disabled]="!yearWithin(year, min(), max())"
                    [selected]="isChosenYear(year)"
                    (selectedChange)="changed($event, { year })"
                  >
                    {{ year }}
                  </div>
                }
              </div>
            }
          </div>
        }
        @default {
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
                        (selectedChange)="changed($event, { day })"
                        (focus)="anchor = day"
                      >
                        {{ dayOf(day) }}
                      </td>
                    }
                  }
                </tr>
              }
            </tbody>
          </table>
        }
      }
    </div>
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
  protected readonly titleId = `ave-calendar-${String(nextCalendar)}`;
  protected readonly hintId = `ave-calendar-${String(nextCalendar++)}-hint`;
  protected readonly within = within;
  protected readonly monthWithin = monthWithin;
  protected readonly yearWithin = yearWithin;
  protected readonly monthRows = rowsOfThree([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);

  /** The month shown among the days; its year among the months, and the page of twelve years that holds it. */
  readonly view = signal<CalendarMonth>(monthOf('2026-01-01'));

  /** Which of the three the calendar shows. */
  protected readonly mode = signal<CalendarView>('days');

  /** The selection changes of the press being read (see `changed`). */
  private pressed: { readonly selected: boolean; readonly cell: CalendarCell }[] = [];

  /** The day that last had focus: the months take its day of the month, and Escape goes back to it. */
  protected anchor: AvePlainDate = '2026-01-01';

  protected readonly title = computed(() => {
    const { year, month } = this.view();
    const page = yearPage(year);
    const titles: Readonly<Record<CalendarView, () => string>> = {
      days: () => this.format().monthYear(year, month),
      months: () => String(year),
      years: () => `${String(page)}–${String(page + 11)}`,
    };
    return titles[this.mode()]();
  });

  /** The names of the buttons beside the heading, and what the heading does, in the view shown. */
  protected readonly labels = computed(() => {
    const messages = this.messages;
    const labels: Readonly<Record<CalendarView, { previous: string; next: string; heading: string }>> = {
      days: { previous: messages.previousMonth, next: messages.nextMonth, heading: messages.chooseMonth },
      months: { previous: messages.previousYear, next: messages.nextYear, heading: messages.chooseYear },
      years: { previous: messages.previousYears, next: messages.nextYears, heading: '' },
    };
    return labels[this.mode()];
  });

  protected readonly weeks = computed(() => weeksOf(this.view(), this.format().firstDayOfWeek));
  protected readonly weekdays = computed(() => {
    const { weekdays, firstDayOfWeek } = this.format();
    return [0, 1, 2, 3, 4, 5, 6].map((offset) => weekdays[(firstDayOfWeek + offset) % 7] ?? { long: '', short: '' });
  });
  protected readonly yearRows = computed(() => {
    const page = yearPage(this.view().year);
    return rowsOfThree(Array.from({ length: 12 }, (_, index) => page + index));
  });
  protected readonly thisYear = computed(() => monthOf(this.today()).year);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly injector = inject(Injector);

  /** The month the days showed when the months opened: Escape goes back to it. */
  private returnTo: CalendarMonth = monthOf('2026-01-01');

  constructor() {
    // The keys that leave the grid are read before the grid's own handler, in the capture phase: the grid stops the
    // arrow keys it handles, so they would never bubble here, and a key the calendar takes must not move the grid too.
    const listener = (event: KeyboardEvent) => {
      this.navigate(event);
    };
    this.host.addEventListener('keydown', listener, { capture: true });
    inject(DestroyRef).onDestroy(() => {
      this.host.removeEventListener('keydown', listener, { capture: true });
    });
  }

  /** Shows the days of a date's month and moves focus to that date once it is drawn. */
  focus(date: AvePlainDate): void {
    this.hold();
    this.mode.set('days');
    this.view.set(monthOf(date));
    this.anchor = date;
    this.focusCell(`[data-date="${date}"]`);
  }

  protected readonly dayOf = dayOfMonth;

  protected isChosen(date: AvePlainDate): boolean {
    return this.chosen().includes(date);
  }

  protected monthKey(month: number): string {
    return toPlainDate(this.view().year, month, 1).slice(0, 7);
  }

  protected isThisMonth(month: number): boolean {
    const today = monthOf(this.today());
    return today.year === this.view().year && today.month === month;
  }

  protected isChosenMonth(month: number): boolean {
    const key = this.monthKey(month);
    return this.chosen().some((date) => date.startsWith(key));
  }

  protected isChosenYear(year: number): boolean {
    return this.chosen().some((date) => monthOf(date).year === year);
  }

  protected rangePart(date: AvePlainDate): RangePart | null {
    const range = this.range();
    if (range === null) return null;
    if (date === range.start) return 'start';
    if (date === range.end) return 'end';
    return range.start !== null && range.end !== null && date > range.start && date < range.end ? 'between' : null;
  }

  /**
   * A cell's selection changed. A click, Enter or Space selects a cell after taking the selection from the others, and
   * on a cell already chosen only takes its own (Aria's single selection toggles). So the changes of one press are
   * read together: the cell selected is the one chosen, or else the one cell whose selection was taken.
   */
  protected changed(selected: boolean, cell: CalendarCell): void {
    if (this.pressed.length === 0) {
      queueMicrotask(() => {
        const changes = this.pressed;
        this.pressed = [];
        const chosen = changes.find((change) => change.selected) ?? (changes.length === 1 ? changes[0] : undefined);
        if (chosen !== undefined) this.activate(chosen.cell);
      });
    }
    this.pressed.push({ selected, cell });
  }

  /** The person chose a cell: a day is the calendar's choice; a month or a year opens its days or months. */
  private activate(cell: CalendarCell): void {
    if ('day' in cell) this.choose.emit(cell.day);
    else if ('month' in cell) this.pickMonth(cell.month);
    else this.pickYear(cell.year);
  }

  /** The heading: the days show the months of their year, and the months a page of twelve years. */
  protected zoomOut(): void {
    const { year, month } = this.view();
    this.hold();
    if (this.mode() === 'days') {
      this.returnTo = this.view();
      this.mode.set('months');
      this.focusCell(`[data-month="${toPlainDate(year, month, 1).slice(0, 7)}"]`);
      return;
    }
    this.mode.set('years');
    this.focusCell(`[data-year="${String(year)}"]`);
  }

  /** A month chosen among the months: its days, with focus on the day of the month the days had, within the bounds. */
  private pickMonth(month: number): void {
    const { year } = this.view();
    const day = Math.min(dayOfMonth(this.anchor), daysIn(year, month));
    this.focus(clamp(toPlainDate(year, month, day), this.min(), this.max()));
  }

  /** A year chosen among the years: its months, with focus on the month the calendar had. */
  private pickYear(year: number): void {
    const { month } = this.view();
    const inside = monthWithin(year, month, this.min(), this.max());
    const shown = inside ? month : monthOf(clamp(toPlainDate(year, month, 1), this.min(), this.max())).month;
    this.hold();
    this.view.set({ year, month: shown });
    this.mode.set('months');
    this.focusCell(`[data-month="${toPlainDate(year, shown, 1).slice(0, 7)}"]`);
  }

  /** The buttons beside the heading: a month, a year or twelve years; focus stays on the button. */
  protected shift(steps: number): void {
    const months: Readonly<Record<CalendarView, number>> = { days: 1, months: 12, years: 144 };
    const { year, month } = this.view();
    this.hold();
    this.view.set(monthOf(addMonths(toPlainDate(year, month, 1), steps * months[this.mode()])));
  }

  /**
   * Keys that leave the grid: an arrow from a cell at its edge, Page Up and Page Down (among the days, Shift for a
   * year), and Escape among the months and years. The grid moves within itself.
   */
  protected navigate(event: KeyboardEvent): void {
    const cell = event.target instanceof HTMLElement ? event.target : null;
    if (cell === null) return;
    if (event.key === 'Escape' && this.mode() !== 'days') {
      event.preventDefault();
      event.stopPropagation();
      this.back();
      return;
    }
    const date = cell.getAttribute('data-date');
    const month = cell.getAttribute('data-month');
    const year = cell.getAttribute('data-year');
    if (date !== null) this.leaveDays(event, date);
    else if (month !== null) this.leaveMonths(event, `${month}-01`);
    else if (year !== null) this.leaveYears(event, Number(year));
  }

  private leaveDays(event: KeyboardEvent, from: AvePlainDate): void {
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
    if (!this.paging(event) && year === view.year && month === view.month) return;
    event.preventDefault();
    event.stopPropagation();
    if (within(target, this.min(), this.max())) this.focus(target);
  }

  private leaveMonths(event: KeyboardEvent, from: AvePlainDate): void {
    const target = this.step(event, (months) => addMonths(from, months));
    if (target === undefined) return;
    const { year, month } = monthOf(target);
    if (!this.paging(event) && year === this.view().year) return;
    event.preventDefault();
    event.stopPropagation();
    if (!monthWithin(year, month, this.min(), this.max())) return;
    this.view.set({ year, month });
    this.focusCell(`[data-month="${target.slice(0, 7)}"]`);
  }

  private leaveYears(event: KeyboardEvent, from: number): void {
    const target = this.step(event, (years) => from + years);
    if (target === undefined) return;
    if (!this.paging(event) && yearPage(target) === yearPage(from)) return;
    event.preventDefault();
    event.stopPropagation();
    if (!yearWithin(target, this.min(), this.max())) return;
    this.hold();
    this.view.update((view) => ({ year: target, month: view.month }));
    this.focusCell(`[data-year="${String(target)}"]`);
  }

  /** Among the months and years: one to the side, three up or down, twelve with Page Up and Page Down. */
  private step<T>(event: KeyboardEvent, move: (steps: number) => T): T | undefined {
    const steps: Readonly<Record<string, number>> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -3,
      ArrowDown: 3,
      PageUp: -12,
      PageDown: 12,
    };
    const count = steps[event.key];
    return count === undefined ? undefined : move(count);
  }

  private paging(event: KeyboardEvent): boolean {
    return event.key === 'PageUp' || event.key === 'PageDown';
  }

  /** Escape among the months or years: the days the calendar showed, with focus on the day it left. */
  private back(): void {
    const { year, month } = this.returnTo;
    const day = Math.min(dayOfMonth(this.anchor), daysIn(year, month));
    this.focus(clamp(toPlainDate(year, month, day), this.min(), this.max()));
  }

  /**
   * Keeps focus in the calendar while a view is drawn anew: the cell or the heading that has focus is removed with the
   * view, and focus would leave the field, which closes it. The calendar itself takes focus (`tabindex="-1"`, out of
   * the Tab order) until the new view's cell does.
   */
  private hold(): void {
    const active = this.host.ownerDocument.activeElement;
    if (active instanceof HTMLElement && active.matches('.body *, button.title'))
      this.host.focus({ preventScroll: true });
  }

  /** Moves focus to a cell once the view that holds it is drawn. */
  private focusCell(selector: string): void {
    afterNextRender(
      () => {
        this.host.querySelector<HTMLElement>(selector)?.focus();
      },
      { injector: this.injector },
    );
  }
}
