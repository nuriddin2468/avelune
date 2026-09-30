import { ComponentHarness } from '@angular/cdk/testing';
import { AveAppliedFiltersHarness, AveFilterPanelHarness } from '@avelune/ui/filter-panel/testing';
import { AveSearchHeaderHarness } from '@avelune/ui/search-header/testing';

/**
 * Harness for `<ave-list-page>` from `@avelune/ui/list-page`.
 *
 * @beta
 */
export class AveListPageHarness extends ComponentHarness {
  /** Selector that finds kit list pages. */
  static hostSelector = 'ave-list-page';

  private readonly body = this.locatorFor(':scope > .list > .body');
  private readonly content = this.locatorFor(':scope > .list > .body > .content');
  private readonly notices = this.locatorForAll(':scope > [aveListPageNotice]');

  /** Gets the page's search header. */
  readonly getSearchHeader = this.locatorFor(AveSearchHeaderHarness);

  /** Gets the page's filter panel, or `null` for a list without filters. */
  readonly getFilterPanel = this.locatorForOptional(AveFilterPanelHarness);

  /** Gets the page's applied filters, or `null` for a list without them. */
  readonly getAppliedFilters = this.locatorForOptional(AveAppliedFiltersHarness);

  /** Whether the filters stand as a column at the list's start. */
  async isFiltersColumnShown(): Promise<boolean> {
    return (await (await this.body()).getAttribute('data-filters')) === 'open';
  }

  /** Gets the texts of the notices about the list, on one line each. */
  async getNotices(): Promise<string[]> {
    return Promise.all((await this.notices()).map(async (notice) => (await notice.text()).replace(/\s+/g, ' ').trim()));
  }

  /** Gets the text of the list, on one line. */
  async getListText(): Promise<string> {
    return (await (await this.content()).text()).replace(/\s+/g, ' ').trim();
  }
}
