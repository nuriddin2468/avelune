import {
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  LOCALE_ID,
  afterNextRender,
  booleanAttribute,
  computed,
  contentChildren,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
  type TemplateRef,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { _CdkPrivateStyleLoader, _VisuallyHiddenLoader } from '@angular/cdk/private';
import { lucideArrowDown, lucideArrowUp, lucideArrowUpDown } from '@avelune/icons/lucide';
import { AveAlert, AveAlertActions } from '@avelune/ui/alert';
import { AveButton } from '@avelune/ui/button';
import { AveCheckbox } from '@avelune/ui/checkbox';
import { AveEmptyState } from '@avelune/ui/empty-state';
import { aveNumberFormat, injectAveMessages } from '@avelune/ui/i18n';
import { AveIcon, provideAveIcons, type AveIconName } from '@avelune/ui/icon';
import { AvePagination } from '@avelune/ui/pagination';
import { AveSkeleton } from '@avelune/ui/skeleton';
import { AveCellTemplate, type AveCellContext } from './cell';
import { AveColumnWidth } from './column-width';
import { sortRows } from './sort';
import type { AveColumn, AveDataTableSource, AveSort } from './types';

/** The widths a column's range sets, in pixels, and its step (ADR 0087). */
const narrowest = 48;
const widest = 960;
const step = 8;

/** Skeleton rows while the first rows are on their way. */
const placeholderRows = 5;

let nextTable = 0;

/** A column's width being dragged: from where, from what width, and which way the inline end lies. */
interface Drag {
  readonly key: string;
  readonly x: number;
  readonly width: number;
  readonly sign: 1 | -1;
}

/**
 * The kit's data table (brief §9.4, ADR 0078, 0087): a native table of records, one page at a time, with the kit's
 * Pagination and its page-size select under it. Columns are data; rich cells are the application's templates
 * (`ng-template aveCell="key"`). Sortable headers are buttons, chosen rows have checkboxes, the header sticks in the
 * table's box, and columns can be resized with a native range. `source="server"` leaves the sorting and the pages to
 * the server: `rows` is the page it sent, `total` how many there are.
 *
 * ```html
 * <ave-data-table label="Договоры" [rows]="contracts" [columns]="columns" [rowKey]="byId" selectable [(selected)]="chosen">
 *   <ng-template aveCell="subject" [aveCellOf]="contracts" let-contract>
 *     <a aveLink [routerLink]="['/contracts', contract.id]">{{ contract.subject }}</a>
 *   </ng-template>
 * </ave-data-table>
 * ```
 *
 * @beta
 */
@Component({
  selector: 'ave-data-table',
  imports: [
    AveAlert,
    AveAlertActions,
    AveButton,
    AveCheckbox,
    AveColumnWidth,
    AveEmptyState,
    AveIcon,
    AvePagination,
    AveSkeleton,
    NgTemplateOutlet,
  ],
  providers: [provideAveIcons([lucideArrowDown, lucideArrowUp, lucideArrowUpDown])],
  host: {
    '[attr.data-resizing]': "dragging() === null ? null : ''",
  },
  template: `
    <!-- While its content overflows, the box is a named region people reach with Tab, to scroll it from the keyboard. -->
    <div
      #box
      class="box"
      [attr.role]="overflows() ? 'region' : null"
      [attr.aria-label]="overflows() ? label() : null"
      [attr.tabindex]="overflows() ? 0 : null"
    >
      <table #table [attr.aria-busy]="loading() ? 'true' : null">
        <caption class="cdk-visually-hidden">
          {{
            label()
          }}
        </caption>
        <thead>
          <tr>
            @if (selectable()) {
              <th scope="col" class="check">
                <input
                  type="checkbox"
                  aveCheckbox
                  [attr.aria-label]="messages.selectPage"
                  [checked]="pageChosen() === 'all'"
                  [indeterminate]="pageChosen() === 'some'"
                  [disabled]="loading() || failed() || shown().length === 0"
                  (change)="choosePage()"
                />
              </th>
            }
            @for (column of columns(); track column.key) {
              <th
                scope="col"
                [attr.data-column]="column.key"
                [attr.data-numeric]="column.numeric ? '' : null"
                [attr.aria-sort]="sortOf(column)"
                [aveColumnWidth]="widths()[column.key]"
              >
                @if (column.sortable) {
                  <button type="button" class="sort" (click)="toggleSort(column)">
                    <span [class.cdk-visually-hidden]="column.hideHeader">{{ column.header }}</span>
                    <ave-icon class="arrow" [name]="arrowOf(column)" decorative />
                  </button>
                } @else {
                  <span [class.cdk-visually-hidden]="column.hideHeader">{{ column.header }}</span>
                }
                @if (resizable()) {
                  <input
                    type="range"
                    class="resize"
                    data-focus-ring="inset"
                    [attr.data-dragging]="dragging() === column.key ? '' : null"
                    [min]="narrowest"
                    [max]="widest"
                    [step]="step"
                    [attr.aria-label]="messages.columnWidth(column.header)"
                    (focus)="showWidth($event)"
                    (input)="resize(column, $event)"
                    (pointerdown)="startDrag(column, $event)"
                    (pointermove)="moveDrag($event)"
                    (pointerup)="endDrag($event)"
                    (lostpointercapture)="endDrag($event)"
                  />
                }
              </th>
            }
          </tr>
        </thead>
        <tbody>
          @if (failed()) {
            <tr class="state">
              <td [attr.colspan]="span()">
                <ave-alert variant="danger">
                  {{ messages.recordsFailed }}
                  <div aveAlertActions>
                    <button aveButton type="button" (click)="retry.emit()">{{ messages.retry }}</button>
                  </div>
                </ave-alert>
              </td>
            </tr>
          } @else if (loading()) {
            @for (placeholder of placeholders(); track placeholder) {
              <tr data-placeholder>
                @if (selectable()) {
                  <td class="check"></td>
                }
                <!-- A column whose header is only said holds a row's controls (its menu): nothing to hold a place for. -->
                @for (column of columns(); track column.key) {
                  <td>
                    @if (!column.hideHeader) {
                      <ave-skeleton />
                    }
                  </td>
                }
              </tr>
            }
          } @else {
            @for (row of shown(); track rowKey()(row); let index = $index) {
              <tr [attr.data-selected]="isChosen(row) ? '' : null">
                @if (selectable()) {
                  <td class="check">
                    <input
                      type="checkbox"
                      aveCheckbox
                      [attr.aria-labelledby]="ids + '-select ' + ids + '-' + index"
                      [checked]="isChosen(row)"
                      (change)="toggleRow(row)"
                    />
                  </td>
                }
                @for (column of columns(); track column.key) {
                  @if (column.rowHeader) {
                    <th
                      scope="row"
                      [attr.id]="column === title() ? ids + '-' + index : null"
                      [attr.data-numeric]="column.numeric ? '' : null"
                    >
                      @if (templates().get(column.key); as custom) {
                        <ng-container [ngTemplateOutlet]="custom" [ngTemplateOutletContext]="{ $implicit: row }" />
                      } @else {
                        {{ text(column, row) }}
                      }
                    </th>
                  } @else {
                    <td
                      [attr.id]="column === title() ? ids + '-' + index : null"
                      [attr.data-numeric]="column.numeric ? '' : null"
                    >
                      @if (templates().get(column.key); as custom) {
                        <ng-container [ngTemplateOutlet]="custom" [ngTemplateOutletContext]="{ $implicit: row }" />
                      } @else {
                        {{ text(column, row) }}
                      }
                    </td>
                  }
                }
              </tr>
            } @empty {
              <tr class="state">
                <td [attr.colspan]="span()">
                  <ng-content select="[aveDataTableEmpty]">
                    <ave-empty-state [heading]="messages.noRecords" />
                  </ng-content>
                </td>
              </tr>
            }
          }
        </tbody>
      </table>
    </div>
    <span hidden [id]="ids + '-select'">{{ messages.selectRow }}</span>
    @if (!failed()) {
      <ave-pagination
        [label]="messages.pagesOf(label())"
        [total]="count()"
        [pageSizes]="pageSizes()"
        [(pageSize)]="pageSize"
        [(page)]="page"
      />
    }
  `,
  styleUrl: './data-table.css',
})
export class AveDataTable<R, K = unknown> {
  /** Names the table (its caption, which only screen readers hear) and its pagination: "Договоры". */
  readonly label = input.required<string>();

  /** The rows: all of them for `source="local"`, the page the server sent for `source="server"`. */
  readonly rows = input.required<readonly R[]>();

  /** The columns, in order. */
  readonly columns = input.required<readonly AveColumn<R>[]>();

  /** A row's key (its id): it tracks the row and says which rows are chosen. */
  readonly rowKey = input.required<(row: R) => K>();

  /** Who sorts and pages the rows: the table (`local`, the default) or the server (`server`). */
  readonly source = input<AveDataTableSource>('local');

  /**
   * How the rows are sorted, or `null` for their own order; a header's button changes it. It holds an `AveSort`: its
   * `column`, the `key` of the sorted column, and its `direction`, an `AveSortDirection`, `ascending` or
   * `descending`. Example: `{ column: 'amount', direction: 'descending' }`.
   */
  readonly sort = model<AveSort | null>(null);

  /** Whether the rows have checkboxes, and the header one for the page. */
  readonly selectable = input(false, { transform: booleanAttribute });

  /** The keys of the chosen rows; they stay chosen across pages and sorts. */
  readonly selected = model<readonly K[]>([]);

  /** The page shown, from 1. */
  readonly page = model(1);

  /** How many rows a page shows; the pagination's select changes it. */
  readonly pageSize = model(20);

  /** The page sizes people choose from, under the table. */
  readonly pageSizes = input<readonly number[]>([10, 20, 50, 100]);

  /** How many rows there are in all, for `source="server"`; the local rows count themselves. */
  readonly total = input<number>();

  /** Whether people can set the columns' widths, with the keyboard or the pointer. */
  readonly resizable = input(false, { transform: booleanAttribute });

  /** The widths people set, in pixels, by column key; the others take the width their content gives them. */
  readonly widths = model<Readonly<Record<string, number>>>({});

  /** Whether rows are on their way: skeleton rows hold their place. */
  readonly loading = input(false, { transform: booleanAttribute });

  /** Whether the rows did not come: an alert with a Retry button stands in their place. */
  readonly failed = input(false, { transform: booleanAttribute });

  /** Emits when the person asks for the rows again, after they did not come. */
  readonly retry = output();

  protected readonly messages = injectAveMessages();
  protected readonly narrowest = narrowest;
  protected readonly widest = widest;
  protected readonly step = step;
  protected readonly ids = `ave-data-table-${String(nextTable++)}`;
  private readonly locale = inject(LOCALE_ID);
  private readonly numbers = aveNumberFormat(this.locale);
  private readonly injector = inject(Injector);

  private readonly cells = contentChildren<AveCellTemplate<R>>(AveCellTemplate);
  private readonly box = viewChild.required<ElementRef<HTMLElement>>('box');
  private readonly table = viewChild.required<ElementRef<HTMLTableElement>>('table');

  /** The application's cell templates by column key. */
  protected readonly templates = computed(
    () => new Map<string, TemplateRef<AveCellContext<R>>>(this.cells().map((cell) => [cell.aveCell(), cell.template])),
  );

  /** The column whose cell is a row's title, which names its checkbox: its row header, or its first column. */
  protected readonly title = computed(() => this.columns().find((column) => column.rowHeader) ?? this.columns()[0]);

  /** How many rows there are in all. */
  protected readonly count = computed(() =>
    this.source() === 'server' ? (this.total() ?? this.rows().length) : this.rows().length,
  );

  /** The rows of the page shown, in order. */
  protected readonly shown = computed(() => {
    const rows = this.rows();
    if (this.source() === 'server') return rows;
    const size = Math.max(1, this.pageSize());
    const page = Math.min(Math.max(1, Math.trunc(this.page())), Math.max(1, Math.ceil(rows.length / size)));
    return sortRows(rows, this.columns(), this.sort(), this.locale).slice((page - 1) * size, page * size);
  });

  /** The skeleton rows: as many as the rows shown, so the table keeps its height, or five. */
  protected readonly placeholders = computed(() =>
    Array.from({ length: this.shown().length || placeholderRows }, (_, index) => index),
  );

  /** How many cells a row has. */
  protected readonly span = computed(() => this.columns().length + (this.selectable() ? 1 : 0));

  private readonly chosen = computed(() => new Set(this.selected()));

  /** Whether the page's rows are chosen: none, some or all. */
  protected readonly pageChosen = computed(() => {
    const key = this.rowKey();
    const keys = this.shown().map((row) => key(row));
    const chosen = keys.filter((key) => this.chosen().has(key)).length;
    if (chosen === 0) return 'none';
    return chosen === keys.length ? 'all' : 'some';
  });

  /** Whether the box's content overflows it, so it scrolls. */
  protected readonly overflows = signal(false);

  /** The width the pointer drags, from where, or `null`. */
  private readonly drag = signal<Drag | null>(null);

  /** The key of the column whose width the pointer drags, or `null`. */
  protected readonly dragging = computed(() => this.drag()?.key ?? null);

  constructor() {
    // The caption and hidden headers use CDK's visually hidden class, whose styles CDK loads only for its own parts.
    inject(_CdkPrivateStyleLoader).load(_VisuallyHiddenLoader);
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const box = this.box().nativeElement;
      const table = this.table().nativeElement;
      const observer = new ResizeObserver(() => {
        this.overflows.set(box.scrollWidth > box.clientWidth || box.scrollHeight > box.clientHeight);
      });
      observer.observe(box);
      observer.observe(table);
      destroyRef.onDestroy(() => {
        observer.disconnect();
      });
    });
  }

  /** A header's `aria-sort`: on the sorted column only. */
  protected sortOf(column: AveColumn<R>): string | null {
    const sort = this.sort();
    return sort?.column === column.key ? sort.direction : null;
  }

  /** A sortable header's arrow: its order, or both ways while it does not sort. */
  protected arrowOf(column: AveColumn<R>): AveIconName {
    const direction = this.sortOf(column);
    if (direction === null) return 'arrow-up-down';
    return direction === 'ascending' ? 'arrow-up' : 'arrow-down';
  }

  /** A header's button: sorts ascending, then turns the order over; the page goes back to the first. */
  protected toggleSort(column: AveColumn<R>): void {
    const ascending = this.sortOf(column) === 'ascending';
    this.sort.set({ column: column.key, direction: ascending ? 'descending' : 'ascending' });
    this.page.set(1);
  }

  /** What a cell shows without a template: its value, a number written for the locale. */
  protected text(column: AveColumn<R>, row: R): string {
    const value = column.value?.(row) ?? null;
    if (value === null) return '';
    return typeof value === 'number' ? this.numbers.format(value) : value;
  }

  protected isChosen(row: R): boolean {
    return this.chosen().has(this.rowKey()(row));
  }

  /** A row's checkbox: the row joins or leaves the chosen. */
  protected toggleRow(row: R): void {
    const key = this.rowKey()(row);
    const selected = this.selected();
    this.selected.set(this.chosen().has(key) ? selected.filter((one) => one !== key) : [...selected, key]);
  }

  /** The header's checkbox: every row of the page chosen, or, when they all are, none of them. */
  protected choosePage(): void {
    const key = this.rowKey();
    const keys = this.shown().map((row) => key(row));
    if (this.pageChosen() === 'all') {
      const page = new Set(keys);
      this.selected.set(this.selected().filter((key) => !page.has(key)));
    } else {
      this.selected.set([...this.selected(), ...keys.filter((key) => !this.chosen().has(key))]);
    }
  }

  /** A column's range, as it takes focus: the width the column is drawn at. */
  protected showWidth(event: Event): void {
    if (event.target instanceof HTMLInputElement) this.syncRange(event.target);
  }

  /** A column's range moved from the keyboard. */
  protected resize(column: AveColumn<R>, event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) return;
    const range = event.target;
    this.setWidth(column.key, Number(range.value));
    afterNextRender(
      () => {
        this.syncRange(range);
      },
      { injector: this.injector },
    );
  }

  /** The pointer takes a column's edge: it drags the width, not the range's value. */
  protected startDrag(column: AveColumn<R>, event: PointerEvent): void {
    const range = event.target;
    const cell = range instanceof HTMLInputElement ? range.closest('th') : null;
    if (event.button !== 0 || !(range instanceof HTMLInputElement) || cell === null) return;
    event.preventDefault();
    range.focus();
    range.setPointerCapture(event.pointerId);
    const sign = getComputedStyle(cell).direction === 'rtl' ? -1 : 1;
    this.drag.set({ key: column.key, x: event.clientX, width: cell.getBoundingClientRect().width, sign });
  }

  protected moveDrag(event: PointerEvent): void {
    const drag = this.drag();
    if (drag === null) return;
    this.setWidth(drag.key, drag.width + (event.clientX - drag.x) * drag.sign);
  }

  protected endDrag(event: PointerEvent): void {
    if (this.drag() === null) return;
    this.drag.set(null);
    if (event.target instanceof HTMLInputElement) this.syncRange(event.target);
  }

  private setWidth(key: string, width: number): void {
    this.widths.set({ ...this.widths(), [key]: Math.round(Math.min(Math.max(width, narrowest), widest)) });
  }

  /** The range says the width its column is drawn at, which content may keep wider than the width set. */
  private syncRange(range: HTMLInputElement): void {
    const cell = range.closest('th');
    if (cell !== null) range.value = String(Math.round(cell.getBoundingClientRect().width));
  }
}
