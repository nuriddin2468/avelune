import { ComponentHarness, HarnessPredicate, type BaseHarnessFilters } from '@angular/cdk/testing';

/**
 * Filters for {@link AveLinkHarness}.
 *
 * @beta
 */
export interface AveLinkHarnessFilters extends BaseHarnessFilters {
  /** Only match links whose words are this string, or match this pattern. */
  text?: string | RegExp;
}

/**
 * Harness for `a[aveLink]` from `@avelune/ui/link`.
 *
 * @beta
 */
export class AveLinkHarness extends ComponentHarness {
  /** Selector that finds kit links. */
  static hostSelector = 'a[aveLink]';

  /** Gets a predicate that matches links by the given filters. */
  static with(options: AveLinkHarnessFilters = {}): HarnessPredicate<AveLinkHarness> {
    return new HarnessPredicate(AveLinkHarness, options).addOption('text', options.text, (harness, text) =>
      HarnessPredicate.stringMatches(harness.getText(), text),
    );
  }

  /** Gets the link's words. */
  async getText(): Promise<string> {
    return (await (await this.host()).text()).trim();
  }

  /** Gets the address, as the page or the router wrote it. */
  async getHref(): Promise<string | null> {
    return (await this.host()).getAttribute('href');
  }

  /** Whether the link opens a new tab, and says so. */
  async opensInNewTab(): Promise<boolean> {
    return (await this.locatorForOptional('.new-tab')()) !== null;
  }

  /** Follows the link with a click. */
  async follow(): Promise<void> {
    await (await this.host()).click();
  }
}
