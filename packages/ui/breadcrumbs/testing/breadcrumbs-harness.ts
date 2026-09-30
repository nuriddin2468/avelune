import { ComponentHarness, HarnessPredicate, type BaseHarnessFilters } from '@angular/cdk/testing';

/**
 * Filters for {@link AveBreadcrumbsHarness}.
 *
 * @beta
 */
export interface AveBreadcrumbsHarnessFilters extends BaseHarnessFilters {
  /** Only match trails whose current page is this string, or matches this pattern. */
  current?: string | RegExp;
}

/**
 * Harness for `<ave-breadcrumbs>` from `@avelune/ui/breadcrumbs`: its links and its current page.
 *
 * @beta
 */
export class AveBreadcrumbsHarness extends ComponentHarness {
  /** Selector that finds kit breadcrumbs. */
  static hostSelector = 'ave-breadcrumbs';

  private readonly links = this.locatorForAll('a');

  /** Gets a predicate that matches trails by the given filters. */
  static with(options: AveBreadcrumbsHarnessFilters = {}): HarnessPredicate<AveBreadcrumbsHarness> {
    return new HarnessPredicate(AveBreadcrumbsHarness, options).addOption(
      'current',
      options.current,
      (harness, current) => HarnessPredicate.stringMatches(harness.getCurrent(), current),
    );
  }

  /** Gets the name of the navigation landmark. */
  async getLabel(): Promise<string | null> {
    return (await this.locatorFor('nav')()).getAttribute('aria-label');
  }

  /** Gets the words of each link, from the top of the product down. */
  async getLinks(): Promise<string[]> {
    return Promise.all((await this.links()).map(async (link) => (await link.text()).trim()));
  }

  /** Gets the address of each link, as the router wrote it. */
  async getAddresses(): Promise<(string | null)[]> {
    return Promise.all((await this.links()).map(async (link) => link.getAttribute('href')));
  }

  /** Gets the current page's name. */
  async getCurrent(): Promise<string> {
    return (await (await this.locatorFor('[aria-current="page"]')()).text()).trim();
  }

  /** Follows the first link whose words are this string or match this pattern. */
  async follow(label: string | RegExp): Promise<void> {
    for (const link of await this.links()) {
      if (await HarnessPredicate.stringMatches((await link.text()).trim(), label)) {
        await link.click();
        return;
      }
    }
    throw new Error(`AveBreadcrumbsHarness: no link matches ${String(label)}.`);
  }
}
