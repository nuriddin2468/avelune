import { ComponentHarness, HarnessPredicate, type BaseHarnessFilters } from '@angular/cdk/testing';

/**
 * Filters for {@link AveEmptyStateHarness}.
 *
 * @alpha
 */
export interface AveEmptyStateHarnessFilters extends BaseHarnessFilters {
  /** Only match empty states whose heading is this string, or matches this pattern. */
  heading?: string | RegExp;
}

/**
 * Harness for `<ave-empty-state>` from `@avelune/ui/empty-state`.
 *
 * @alpha
 */
export class AveEmptyStateHarness extends ComponentHarness {
  /** Selector that finds kit empty states. */
  static hostSelector = 'ave-empty-state';

  /** Gets a predicate that matches empty states by the given filters. */
  static with(options: AveEmptyStateHarnessFilters = {}): HarnessPredicate<AveEmptyStateHarness> {
    return new HarnessPredicate(AveEmptyStateHarness, options).addOption(
      'heading',
      options.heading,
      (harness, heading) => HarnessPredicate.stringMatches(harness.getHeading(), heading),
    );
  }

  /** Gets the heading. */
  async getHeading(): Promise<string> {
    return (await (await this.locatorFor('.heading')()).text()).trim();
  }

  /** Gets the message, as one line of text. */
  async getMessage(): Promise<string> {
    return (await (await this.locatorFor('.message')()).text()).replace(/\s+/g, ' ').trim();
  }

  /** Gets the name of the icon, or `null` without one. */
  async getIcon(): Promise<string | null> {
    const icon = await this.locatorForOptional('.badge ave-icon')();
    return icon === null ? null : icon.getAttribute('data-icon');
  }

  /** Gets the text of each action: the buttons and links under the message. */
  async getActions(): Promise<string[]> {
    const actions = await this.locatorForAll('[aveEmptyStateActions] :is(button, a)')();
    return Promise.all(actions.map(async (action) => (await action.text()).trim()));
  }
}
