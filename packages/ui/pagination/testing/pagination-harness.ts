import { ComponentHarness, HarnessPredicate, type BaseHarnessFilters, type TestElement } from '@angular/cdk/testing';

/**
 * Filters for {@link AvePaginationHarness}.
 *
 * @alpha
 */
export interface AvePaginationHarnessFilters extends BaseHarnessFilters {
  /** Only match paginations whose current page is this number. */
  page?: number;
}

/**
 * Harness for `<ave-pagination>` from `@avelune/ui/pagination`: the range, the pages shown, and going to a page.
 *
 * @alpha
 */
export class AvePaginationHarness extends ComponentHarness {
  /** Selector that finds kit paginations. */
  static hostSelector = 'ave-pagination';

  private readonly pages = this.locatorForAll('.page');
  private readonly arrows = this.locatorForAll('.pages > button');

  /** Gets a predicate that matches paginations by the given filters. */
  static with(options: AvePaginationHarnessFilters = {}): HarnessPredicate<AvePaginationHarness> {
    return new HarnessPredicate(AvePaginationHarness, options).addOption(
      'page',
      options.page,
      async (harness, page) => (await harness.getCurrentPage()) === page,
    );
  }

  /** Gets which items the page shows, as the range says it ("21–40 из 134"), or `null` while nothing is drawn. */
  async getRange(): Promise<string | null> {
    const range = (await (await this.locatorFor('.range')()).text()).trim();
    return range === '' ? null : range;
  }

  /** Gets the numbers in the seven places, with `…` for a gap. */
  async getPages(): Promise<string[]> {
    const places = await this.locatorForAll('.numbers > li')();
    return Promise.all(places.map(async (place) => (await place.text()).trim()));
  }

  /** Gets the current page's number, or `null` while nothing is drawn. */
  async getCurrentPage(): Promise<number | null> {
    for (const page of await this.pages()) {
      if ((await page.getAttribute('aria-current')) === 'page') return Number((await page.text()).replace(/\D/g, ''));
    }
    return null;
  }

  /** Goes to a page by its number, with a click on its button; throws when it is not shown. */
  async goToPage(page: number): Promise<void> {
    for (const button of await this.pages()) {
      if (Number((await button.text()).replace(/\D/g, '')) === page) {
        await button.click();
        return;
      }
    }
    throw new Error(`AvePaginationHarness: page ${String(page)} is not shown.`);
  }

  /** Goes to the page before, with its button. */
  async previous(): Promise<void> {
    await (await this.arrow(0)).click();
  }

  /** Goes to the page after, with its button. */
  async next(): Promise<void> {
    await (await this.arrow(1)).click();
  }

  /** Whether there is a page before the current one. */
  async hasPrevious(): Promise<boolean> {
    return (await (await this.arrow(0)).getAttribute('aria-disabled')) !== 'true';
  }

  /** Whether there is a page after the current one. */
  async hasNext(): Promise<boolean> {
    return (await (await this.arrow(1)).getAttribute('aria-disabled')) !== 'true';
  }

  private async arrow(index: 0 | 1): Promise<TestElement> {
    const arrows = await this.arrows();
    const arrow = arrows[index];
    if (arrow === undefined) throw new Error('AvePaginationHarness: nothing is drawn.');
    return arrow;
  }
}
