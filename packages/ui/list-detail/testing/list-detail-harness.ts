import { ComponentHarness, HarnessPredicate, type BaseHarnessFilters } from '@angular/cdk/testing';

/**
 * Filters for {@link AveListDetailHarness}.
 *
 * @alpha
 */
export interface AveListDetailHarnessFilters extends BaseHarnessFilters {
  /** Only match pages whose heading is this string, or matches this pattern. */
  heading?: string | RegExp;
}

/**
 * Harness for `<ave-list-detail>` from `@avelune/ui/list-detail`.
 *
 * @alpha
 */
export class AveListDetailHarness extends ComponentHarness {
  /** Selector that finds kit list–detail pages. */
  static hostSelector = 'ave-list-detail';

  private readonly heading = this.locatorFor(':scope > .header > h1');
  private readonly description = this.locatorForOptional(':scope > .header > p');
  private readonly list = this.locatorFor(':scope > .panes > .list');
  private readonly record = this.locatorFor(':scope > .panes > .detail');
  private readonly back = this.locatorFor(':scope > .panes > .detail > button');

  /** Gets a predicate that matches list–detail pages by the given filters. */
  static with(options: AveListDetailHarnessFilters = {}): HarnessPredicate<AveListDetailHarness> {
    return new HarnessPredicate(AveListDetailHarness, options).addOption(
      'heading',
      options.heading,
      (harness, heading) => HarnessPredicate.stringMatches(harness.getHeading(), heading),
    );
  }

  /** Gets the page's heading. */
  async getHeading(): Promise<string> {
    return (await (await this.heading()).text()).trim();
  }

  /** Gets the words under the heading, or an empty string. */
  async getDescription(): Promise<string> {
    const description = await this.description();
    return description === null ? '' : (await description.text()).trim();
  }

  /** Whether the list shows: always from `container.md`, and below it until a record is chosen. */
  async isListShown(): Promise<boolean> {
    return (await (await this.list()).getCssValue('display')) !== 'none';
  }

  /** Whether the record shows: always from `container.md`, and below it while `detail` is true. */
  async isDetailShown(): Promise<boolean> {
    return (await (await this.record()).getCssValue('display')) !== 'none';
  }

  /** Whether the way back to the list shows: below `container.md`, over the record. */
  async hasBackButton(): Promise<boolean> {
    return (await (await this.back()).getCssValue('display')) !== 'none';
  }

  /** Gets the words of the way back to the list. */
  async getBackLabel(): Promise<string> {
    return (await (await this.back()).text()).trim();
  }

  /** Presses the way back to the list. */
  async goBack(): Promise<void> {
    await (await this.back()).click();
  }
}
