/**
 * What a cell shows without a template, and what sorting compares: text, a number (written for the locale), or
 * nothing.
 *
 * @beta
 */
export type AveCellValue = string | number | null;

/**
 * A column of a DataTable (ADR 0087), declared as data; a cell with rich content is the application's template
 * (`ng-template aveCell="key"`).
 *
 * @beta
 */
export interface AveColumn<R> {
  /** Names the column: its cell template's name, its sort and its width. */
  readonly key: string;
  /** The header's words; screen readers hear them with every cell of the column. */
  readonly header: string;
  /** What a cell shows without a template, and what sorting compares. */
  readonly value?: (row: R) => AveCellValue;
  /** Whether people sort the rows by this column, with a button in its header. */
  readonly sortable?: boolean;
  /** Figures: aligned to the end, in tabular figures. */
  readonly numeric?: boolean;
  /** The row's title (a number, a name): its cell is the row's header, and names the row's checkbox. */
  readonly rowHeader?: boolean;
  /** The header's words are said, not shown: a column of row menus. */
  readonly hideHeader?: boolean;
}

/**
 * The order of a sorted column.
 *
 * @beta
 */
export type AveSortDirection = 'ascending' | 'descending';

/**
 * How a DataTable is sorted: by which column, in which order.
 *
 * @beta
 */
export interface AveSort {
  /** The key of the column the rows are sorted by. */
  readonly column: string;
  /** The order. */
  readonly direction: AveSortDirection;
}

/**
 * Who sorts and pages the rows: `local`, the table itself; `server`, the server, which sends a page in its order.
 *
 * @beta
 */
export type AveDataTableSource = 'local' | 'server';
