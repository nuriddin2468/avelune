import { ComponentHarness, HarnessPredicate, type BaseHarnessFilters, type TestElement } from '@angular/cdk/testing';
import { AveSelectHarness } from '@avelune/ui/select/testing';

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
 * Harness for `<ave-pagination>` from `@avelune/ui/pagination`: the range, the pages shown, going to a page, and the
 * page size.
 *
 * @alpha
 */
export class AvePaginationHarness extends ComponentHarness {
  /** Selector that finds kit paginations. */
  static hostSelector = 'ave-pagination';

  private readonly pages = this.locatorForAll('.page');
  private readonly arrows = this.locatorForAll('.pages > button');
  private readonly sizeSelect = this.locatorForOptional(AveSelectHarness);

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

  /** Gets the page size the select shows, or `null` without a page-size select. */
  async getPageSize(): Promise<number | null> {
    const select = await this.sizeSelect();
    return select === null ? null : Number((await select.getText()).replace(/\D/g, ''));
  }

  /** Gets the page sizes people choose from, or none without a page-size select. */
  async getPageSizes(): Promise<number[]> {
    const select = await this.sizeSelect();
    if (select === null) return [];
    await select.open();
    const sizes = (await select.getOptions()).map((option) => Number(option.replace(/\D/g, '')));
    await select.close();
    return sizes;
  }

  /** Chooses a page size in the select; throws without one, or when the select does not offer it. */
  async setPageSize(size: number): Promise<void> {
    const select = await this.sizeSelect();
    if (select === null) throw new Error('AvePaginationHarness: there is no page-size select.');
    await select.open();
    const label = (await select.getOptions()).find((option) => Number(option.replace(/\D/g, '')) === size);
    if (label === undefined) {
      await select.close();
      throw new Error(`AvePaginationHarness: the page size ${String(size)} is not offered.`);
    }
    await select.choose(label);
  }

  private async arrow(index: 0 | 1): Promise<TestElement> {
    const arrows = await this.arrows();
    const arrow = arrows[index];
    if (arrow === undefined) throw new Error('AvePaginationHarness: nothing is drawn.');
    return arrow;
  }
}
