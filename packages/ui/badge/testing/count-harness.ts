import { ComponentHarness, HarnessPredicate, type BaseHarnessFilters } from '@angular/cdk/testing';

/**
 * Filters for {@link AveCountHarness}.
 *
 * @alpha
 */
export interface AveCountHarnessFilters extends BaseHarnessFilters {
  /** Only match counts whose text is this string ("12", "99+"), or matches this pattern. */
  text?: string | RegExp;
}

/**
 * Harness for `<ave-count>` from `@avelune/ui/badge`.
 *
 * @alpha
 */
export class AveCountHarness extends ComponentHarness {
  /** Selector that finds kit counts. */
  static hostSelector = 'ave-count';

  /** Gets a predicate that matches counts by the given filters. */
  static with(options: AveCountHarnessFilters = {}): HarnessPredicate<AveCountHarness> {
    return new HarnessPredicate(AveCountHarness, options).addOption('text', options.text, (harness, text) =>
      HarnessPredicate.stringMatches(harness.getText(), text),
    );
  }

  /** Gets the text shown: the number in the locale ("1 234"), "99+" over the cap, or an empty string at 0. */
  async getText(): Promise<string> {
    return (await (await this.host()).text()).trim();
  }

  /** Whether the count is drawn: it is not at 0. */
  async isShown(): Promise<boolean> {
    return (await (await this.host()).getAttribute('data-empty')) === null;
  }
}
