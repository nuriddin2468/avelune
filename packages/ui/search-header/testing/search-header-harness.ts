import { ComponentHarness, HarnessPredicate, type BaseHarnessFilters } from '@angular/cdk/testing';

/**
 * Filters for {@link AveSearchHeaderHarness}.
 *
 * @alpha
 */
export interface AveSearchHeaderHarnessFilters extends BaseHarnessFilters {
  /** Only match headers whose heading is this string, or matches this pattern. */
  heading?: string | RegExp;
}

/**
 * Harness for `<ave-search-header>` from `@avelune/ui/search-header`.
 *
 * @alpha
 */
export class AveSearchHeaderHarness extends ComponentHarness {
  /** Selector that finds kit search headers. */
  static hostSelector = 'ave-search-header';

  private readonly heading = this.locatorFor('h1');
  private readonly summary = this.locatorFor('.summary');
  private readonly search = this.locatorFor('search');
  private readonly actions = this.locatorForAll('[aveSearchHeaderActions] button, [aveSearchHeaderActions] a');
  private readonly filtersButton = this.locatorForOptional('search > button');

  /** Gets a predicate that matches search headers by the given filters. */
  static with(options: AveSearchHeaderHarnessFilters = {}): HarnessPredicate<AveSearchHeaderHarness> {
    return new HarnessPredicate(AveSearchHeaderHarness, options).addOption(
      'heading',
      options.heading,
      (harness, heading) => HarnessPredicate.stringMatches(harness.getHeading(), heading),
    );
  }

  /** Gets the page's heading. */
  async getHeading(): Promise<string> {
    return (await (await this.heading()).text()).trim();
  }

  /** Gets the count of records after the heading, or an empty string. */
  async getSummary(): Promise<string> {
    return (await (await this.summary()).text()).trim();
  }

  /** Gets the search landmark's name, or `null` when it has none. */
  async getSearchLabel(): Promise<string | null> {
    return (await this.search()).getAttribute('aria-label');
  }

  /** Gets the words of the actions' buttons and links, in order. */
  async getActions(): Promise<string[]> {
    return Promise.all((await this.actions()).map(async (action) => (await action.text()).replace(/\s+/g, ' ').trim()));
  }

  /** Whether the header has a filters' button. */
  async hasFiltersButton(): Promise<boolean> {
    return (await this.filtersButton()) !== null;
  }

  /** Gets the filters' button's words with its count: "Фильтры 2". */
  async getFiltersButtonText(): Promise<string> {
    return (await (await this.button()).text()).replace(/\s+/g, ' ').trim();
  }

  /** Whether the filters' button says its column is shown; `null` while the filters open in a drawer. */
  async isFiltersExpanded(): Promise<boolean | null> {
    const expanded = await (await this.button()).getAttribute('aria-expanded');
    return expanded === null ? null : expanded === 'true';
  }

  /** Presses the filters' button. */
  async toggleFilters(): Promise<void> {
    await (await this.button()).click();
  }

  private async button() {
    const button = await this.filtersButton();
    if (button === null) throw new Error('The search header has no filters.');
    return button;
  }
}
