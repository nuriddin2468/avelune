import { ComponentHarness, HarnessPredicate, type BaseHarnessFilters, type TestElement } from '@angular/cdk/testing';
import { AvePaginationHarness } from '@avelune/ui/pagination/testing';

/**
 * Filters for {@link AveDataTableHarness}.
 *
 * @alpha
 */
export interface AveDataTableHarnessFilters extends BaseHarnessFilters {
  /** Only match tables named by this string, or by a name that matches this pattern. */
  label?: string | RegExp;
}

/**
 * How a table is sorted, as the harness reads it: by the header with these words, in this order.
 *
 * @alpha
 */
export interface AveDataTableSortState {
  /** The sorted column's header. */
  readonly header: string;
  /** The order. */
  readonly direction: 'ascending' | 'descending';
}

/** The rows of records: not the skeleton rows, and not the row of a state. */
const rows = 'tbody > tr:not([data-placeholder], .state)';

/**
 * Harness for `<ave-data-table>` from `@avelune/ui/data-table`: its headers and cells, sorting, choosing rows, its
 * states, a column's width and its pagination.
 *
 * @alpha
 */
export class AveDataTableHarness extends ComponentHarness {
  /** Selector that finds kit data tables. */
  static hostSelector = 'ave-data-table';

  private readonly headerCells = this.locatorForAll('thead th[data-column]');
  private readonly cells = this.locatorForAll(`${rows} > :not(.check)`);
  private readonly titles = this.locatorForAll(`${rows} > [id]`);
  private readonly rowElements = this.locatorForAll(rows);
  private readonly rowChecks = this.locatorForAll(`${rows} > .check > input`);
  private readonly pageCheck = this.locatorFor('thead .check > input');
  private readonly state = this.locatorForOptional('tbody > .state > td');

  /** Gets a predicate that matches tables by the given filters. */
  static with(options: AveDataTableHarnessFilters = {}): HarnessPredicate<AveDataTableHarness> {
    return new HarnessPredicate(AveDataTableHarness, options).addOption('label', options.label, (harness, label) =>
      HarnessPredicate.stringMatches(harness.getLabel(), label),
    );
  }

  /** Gets the table's name, its caption. */
  async getLabel(): Promise<string> {
    return (await (await this.locatorFor('caption')()).text()).trim();
  }

  /** Gets the columns' headers, in order, hidden ones among them; not the checkboxes' column. */
  async getHeaders(): Promise<string[]> {
    return Promise.all((await this.headerCells()).map(async (cell) => (await cell.text()).trim()));
  }

  /** Gets the text of the rows' cells, row by row; not their checkboxes. None while skeleton rows or a state show. */
  async getRows(): Promise<string[][]> {
    const width = (await this.headerCells()).length;
    const texts = await Promise.all((await this.cells()).map(async (cell) => (await cell.text()).trim()));
    return Array.from({ length: texts.length / Math.max(1, width) }, (_, row) =>
      texts.slice(row * width, (row + 1) * width),
    );
  }

  /** Gets the sorted column and its order, or `null` while the rows are in their own order. */
  async getSort(): Promise<AveDataTableSortState | null> {
    const sorted = await this.locatorForOptional('thead th[aria-sort]')();
    if (sorted === null) return null;
    const direction = await sorted.getAttribute('aria-sort');
    return { header: (await sorted.text()).trim(), direction: direction === 'descending' ? 'descending' : 'ascending' };
  }

  /** Presses the sort button of the header with these words; throws when that column does not sort. */
  async sortBy(header: string | RegExp): Promise<void> {
    for (const button of await this.locatorForAll('thead th[data-column] > .sort')()) {
      if (await HarnessPredicate.stringMatches((await button.text()).trim(), header)) {
        await button.click();
        return;
      }
    }
    throw new Error(`AveDataTableHarness: no column sorts by ${String(header)}.`);
  }

  /** Gets the titles of the rows shown (their row headers, or first cells), in order. */
  async getRowTitles(): Promise<string[]> {
    return Promise.all((await this.titles()).map(async (title) => (await title.text()).trim()));
  }

  /** Gets the titles of the chosen rows on the page. */
  async getSelectedRows(): Promise<string[]> {
    const titles = await this.getRowTitles();
    const chosen = await Promise.all(
      (await this.rowElements()).map(async (row) => (await row.getAttribute('data-selected')) !== null),
    );
    return titles.filter((_, index) => chosen[index]);
  }

  /** Toggles the checkbox of the row with this title; throws when no row shown has it, or rows have no checkboxes. */
  async toggleRow(title: string | RegExp): Promise<void> {
    const titles = await this.getRowTitles();
    const checks = await this.rowChecks();
    for (const [index, text] of titles.entries()) {
      const check = checks[index];
      if (check !== undefined && (await HarnessPredicate.stringMatches(text, title))) {
        await check.click();
        return;
      }
    }
    throw new Error(`AveDataTableHarness: no row ${String(title)} with a checkbox is shown.`);
  }

  /** Whether the page's rows are chosen: none, some or all, as the header's checkbox says. */
  async getPageSelection(): Promise<'none' | 'some' | 'all'> {
    const check = await this.pageCheck();
    if (await check.getProperty<boolean>('indeterminate')) return 'some';
    return (await check.getProperty<boolean>('checked')) ? 'all' : 'none';
  }

  /** Presses the header's checkbox: every row of the page chosen, or none when they all were. */
  async togglePage(): Promise<void> {
    await (await this.pageCheck()).click();
  }

  /** Whether skeleton rows hold the rows' place. */
  async isLoading(): Promise<boolean> {
    return (await (await this.locatorFor('table')()).getAttribute('aria-busy')) === 'true';
  }

  /** Whether the rows did not come: the alert shows in their place. */
  async isFailed(): Promise<boolean> {
    return (await this.locatorForOptional('tbody > .state ave-alert')()) !== null;
  }

  /** Presses the failed table's Retry button; throws while the table has not failed. */
  async retry(): Promise<void> {
    const button = await this.locatorForOptional('tbody > .state ave-alert button')();
    if (button === null) throw new Error('AveDataTableHarness: the table has not failed.');
    await button.click();
  }

  /** Gets the words of the state that stands in the rows' place (empty, failed), or `null` while rows show. */
  async getStateText(): Promise<string | null> {
    const state = await this.state();
    return state === null ? null : (await state.text()).trim();
  }

  /** Gets the width a column is drawn at, in pixels. */
  async getColumnWidth(header: string | RegExp): Promise<number> {
    return (await (await this.headerCell(header)).getDimensions()).width;
  }

  /** Sets a column's width with its range, as the keyboard does; throws when the table's columns are not resizable. */
  async setColumnWidth(header: string | RegExp, width: number): Promise<void> {
    const headers = await this.getHeaders();
    const ranges = await this.locatorForAll('thead th[data-column] > .resize')();
    for (const [index, text] of headers.entries()) {
      const range = ranges[index];
      if (range !== undefined && (await HarnessPredicate.stringMatches(text, header))) {
        await range.setInputValue(String(width));
        await range.dispatchEvent('input');
        return;
      }
    }
    throw new Error(`AveDataTableHarness: the column ${String(header)} cannot be resized.`);
  }

  /** Whether the table's box scrolls: it is then a named region, and a Tab stop. */
  async isScrollable(): Promise<boolean> {
    return (await (await this.locatorFor('.box')()).getAttribute('role')) === 'region';
  }

  /** Gets the pagination under the table, or `null` while it stands aside for a failure. */
  async getPagination(): Promise<AvePaginationHarness | null> {
    return this.locatorForOptional(AvePaginationHarness)();
  }

  private async headerCell(header: string | RegExp): Promise<TestElement> {
    for (const cell of await this.headerCells()) {
      if (await HarnessPredicate.stringMatches((await cell.text()).trim(), header)) return cell;
    }
    throw new Error(`AveDataTableHarness: no column ${String(header)}.`);
  }
}
