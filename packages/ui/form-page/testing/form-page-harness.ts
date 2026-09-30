import { ComponentHarness, HarnessPredicate, type BaseHarnessFilters } from '@angular/cdk/testing';

/**
 * Filters for {@link AveFormPageHarness}.
 *
 * @alpha
 */
export interface AveFormPageHarnessFilters extends BaseHarnessFilters {
  /** Only match form pages whose heading is this string, or matches this pattern. */
  heading?: string | RegExp;
}

/**
 * Harness for `form[aveFormPage]` from `@avelune/ui/form-page`.
 *
 * @alpha
 */
export class AveFormPageHarness extends ComponentHarness {
  /** Selector that finds kit form pages. */
  static hostSelector = 'form[aveFormPage]';

  private readonly heading = this.locatorFor(':scope > .header > h1');
  private readonly description = this.locatorForOptional(':scope > .header > p');
  private readonly bar = this.locatorForOptional(':scope > [aveFormPageActions]');
  private readonly start = this.locatorForAll(
    ':scope > [aveFormPageActions] > .start button, :scope > [aveFormPageActions] > .start a',
  );
  private readonly end = this.locatorForAll(
    ':scope > [aveFormPageActions] > .end button, :scope > [aveFormPageActions] > .end a',
  );

  /** Gets a predicate that matches form pages by the given filters. */
  static with(options: AveFormPageHarnessFilters = {}): HarnessPredicate<AveFormPageHarness> {
    return new HarnessPredicate(AveFormPageHarness, options).addOption('heading', options.heading, (harness, heading) =>
      HarnessPredicate.stringMatches(harness.getHeading(), heading),
    );
  }

  /** Gets the page's heading, which names the form. */
  async getHeading(): Promise<string> {
    return (await (await this.heading()).text()).trim();
  }

  /** Gets the words under the heading, or an empty string. */
  async getDescription(): Promise<string> {
    const description = await this.description();
    return description === null ? '' : (await description.text()).trim();
  }

  /** Gets the words of the actions at the bar's end, in order, the primary last. */
  async getActions(): Promise<string[]> {
    return Promise.all((await this.end()).map(async (action) => (await action.text()).replace(/\s+/g, ' ').trim()));
  }

  /** Gets the words of the actions at the bar's start. */
  async getStartActions(): Promise<string[]> {
    return Promise.all((await this.start()).map(async (action) => (await action.text()).replace(/\s+/g, ' ').trim()));
  }

  /** Whether the form has a bar of actions. */
  async hasActions(): Promise<boolean> {
    return (await this.bar()) !== null;
  }
}
