import { ComponentHarness, HarnessPredicate, type BaseHarnessFilters } from '@angular/cdk/testing';

/**
 * Filters for {@link AveCardHarness}.
 *
 * @beta
 */
export interface AveCardHarnessFilters extends BaseHarnessFilters {
  /** Only match cards whose title is this string, or matches this pattern. */
  title?: string | RegExp;
}

/**
 * Harness for `<ave-card>` from `@avelune/ui/card`.
 *
 * @beta
 */
export class AveCardHarness extends ComponentHarness {
  /** Selector that finds kit cards. */
  static hostSelector = 'ave-card';

  private readonly title = this.locatorForOptional('[aveCardTitle]');
  private readonly actions = this.locatorForAll('[aveCardFooter] button, [aveCardFooter] a');

  /** Gets a predicate that matches cards by the given filters. */
  static with(options: AveCardHarnessFilters = {}): HarnessPredicate<AveCardHarness> {
    return new HarnessPredicate(AveCardHarness, options).addOption('title', options.title, (harness, title) =>
      HarnessPredicate.stringMatches(harness.getTitle(), title),
    );
  }

  /** Gets the title's words, or an empty string for a card without one. */
  async getTitle(): Promise<string> {
    const title = await this.title();
    return title === null ? '' : (await title.text()).replace(/\s+/g, ' ').trim();
  }

  /** Gets the card's text, on one line. */
  async getText(): Promise<string> {
    return (await (await this.host()).text()).replace(/\s+/g, ' ').trim();
  }

  /** Gets the words of the footer's buttons and links, in order; none for a card without a footer. */
  async getFooterActions(): Promise<string[]> {
    return Promise.all((await this.actions()).map(async (action) => (await action.text()).replace(/\s+/g, ' ').trim()));
  }
}
