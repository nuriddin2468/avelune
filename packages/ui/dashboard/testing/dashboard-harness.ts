import { ComponentHarness, HarnessPredicate, type BaseHarnessFilters } from '@angular/cdk/testing';

/**
 * A key figure as {@link AveDashboardHarness.getMetrics} reads it.
 *
 * @alpha
 */
export interface AveDashboardMetricText {
  /** What the figure counts. */
  readonly label: string;
  /** The figure. */
  readonly value: string;
  /** What it means, or an empty string. */
  readonly note: string;
}

/**
 * Harness for `<ave-dashboard-metric>` from `@avelune/ui/dashboard`.
 *
 * @alpha
 */
export class AveDashboardMetricHarness extends ComponentHarness {
  /** Selector that finds kit key figures. */
  static hostSelector = 'ave-dashboard-metric';

  private readonly label = this.locatorFor('.label');
  private readonly value = this.locatorFor('.value');
  private readonly note = this.locatorForOptional('.note');

  /** Gets what the figure counts, its number and what it means. */
  async getText(): Promise<AveDashboardMetricText> {
    const note = await this.note();
    return {
      label: (await (await this.label()).text()).trim(),
      value: (await (await this.value()).text()).trim(),
      note: note === null ? '' : (await note.text()).trim(),
    };
  }
}

/**
 * Filters for {@link AveDashboardHarness}.
 *
 * @alpha
 */
export interface AveDashboardHarnessFilters extends BaseHarnessFilters {
  /** Only match dashboards whose heading is this string, or matches this pattern. */
  heading?: string | RegExp;
}

/**
 * Harness for `<ave-dashboard>` from `@avelune/ui/dashboard`.
 *
 * @alpha
 */
export class AveDashboardHarness extends ComponentHarness {
  /** Selector that finds kit dashboards. */
  static hostSelector = 'ave-dashboard';

  private readonly heading = this.locatorFor(':scope > .header h1');
  private readonly description = this.locatorForOptional(':scope > .header p');
  private readonly metrics = this.locatorForAll(AveDashboardMetricHarness);
  private readonly tiles = this.locatorFor(':scope > .tiles');

  /** Gets a predicate that matches dashboards by the given filters. */
  static with(options: AveDashboardHarnessFilters = {}): HarnessPredicate<AveDashboardHarness> {
    return new HarnessPredicate(AveDashboardHarness, options).addOption(
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

  /** Gets the key figures, in order. */
  async getMetrics(): Promise<AveDashboardMetricText[]> {
    return Promise.all((await this.metrics()).map((metric) => metric.getText()));
  }

  /** Gets how many columns the cards stand in: one, two from `container.md`, three from `container.lg`. */
  async getColumnCount(): Promise<number> {
    const columns = await (await this.tiles()).getCssValue('grid-template-columns');
    return columns.split(' ').filter((column) => column !== '').length;
  }
}
