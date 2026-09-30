import { ComponentHarness, HarnessPredicate, type BaseHarnessFilters } from '@angular/cdk/testing';

/**
 * Filters for {@link AveListHarness}.
 *
 * @beta
 */
export interface AveListHarnessFilters extends BaseHarnessFilters {
  /** Only match lists named by this string, or by a name that matches this pattern. */
  label?: string | RegExp;
}

/**
 * Harness for `<ave-list>` from `@avelune/ui/list`: its name and its records.
 *
 * @beta
 */
export class AveListHarness extends ComponentHarness {
  /** Selector that finds kit lists. */
  static hostSelector = 'ave-list';

  private readonly contents = this.locatorForAll('ave-list-item .content');

  /** Gets a predicate that matches lists by the given filters. */
  static with(options: AveListHarnessFilters = {}): HarnessPredicate<AveListHarness> {
    return new HarnessPredicate(AveListHarness, options).addOption('label', options.label, (harness, label) =>
      HarnessPredicate.stringMatches(harness.getLabel(), label),
    );
  }

  /** Gets the list's name. */
  async getLabel(): Promise<string | null> {
    return (await this.host()).getAttribute('aria-label');
  }

  /** Gets the text of each record's content, in order, on one line. */
  async getItems(): Promise<string[]> {
    return Promise.all(
      (await this.contents()).map(async (content) => (await content.text()).replace(/\s+/g, ' ').trim()),
    );
  }
}
