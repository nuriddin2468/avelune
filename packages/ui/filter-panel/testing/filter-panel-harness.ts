import { ComponentHarness, HarnessPredicate, type BaseHarnessFilters } from '@angular/cdk/testing';

/**
 * Filters for {@link AveFilterPanelHarness}.
 *
 * @alpha
 */
export interface AveFilterPanelHarnessFilters extends BaseHarnessFilters {
  /** Only match panels whose heading is this string, or matches this pattern. */
  label?: string | RegExp;
}

/**
 * Harness for `<ave-filter-panel>` from `@avelune/ui/filter-panel`.
 *
 * @alpha
 */
export class AveFilterPanelHarness extends ComponentHarness {
  /** Selector that finds kit filter panels. */
  static hostSelector = 'ave-filter-panel';

  private readonly surface = this.locatorFor('.column, dialog[aveDrawer]');
  private readonly heading = this.locatorFor('.column > h2, dialog[aveDrawer] h2');
  private readonly fields = this.locatorForOptional('.fields');
  private readonly clearButton = this.locatorForOptional(
    '.actions button, [aveDialogActions] button[data-variant="ghost"]',
  );
  private readonly showButton = this.locatorForOptional('[aveDialogActions] button[data-variant="primary"]');

  /** Gets a predicate that matches filter panels by the given filters. */
  static with(options: AveFilterPanelHarnessFilters = {}): HarnessPredicate<AveFilterPanelHarness> {
    return new HarnessPredicate(AveFilterPanelHarness, options).addOption('label', options.label, (harness, label) =>
      HarnessPredicate.stringMatches(harness.getLabel(), label),
    );
  }

  /** Gets the filters' heading, or the drawer's. */
  async getLabel(): Promise<string> {
    return (await (await this.heading()).text()).trim();
  }

  /** Whether the filters open in a drawer, below `container.lg`, rather than in a column. */
  async isModal(): Promise<boolean> {
    return (await (await this.host()).getAttribute('data-mode')) === 'drawer';
  }

  /** Whether the filters are shown: the column, or the drawer. */
  async isOpen(): Promise<boolean> {
    return (await this.surface()).matchesSelector('dialog[open], .column:not([hidden])');
  }

  /** Gets the text of the fields shown, on one line; an empty string while closed. */
  async getFieldsText(): Promise<string> {
    const fields = await this.fields();
    return fields === null ? '' : (await fields.text()).replace(/\s+/g, ' ').trim();
  }

  /** Whether the panel offers to clear the applied filters. */
  async canClear(): Promise<boolean> {
    return (await this.clearButton()) !== null;
  }

  /** Presses "Сбросить фильтры". */
  async clear(): Promise<void> {
    const button = await this.clearButton();
    if (button === null) throw new Error('No filter is applied.');
    await button.click();
  }

  /** Presses the drawer's "Показать результаты", which closes it. */
  async showResults(): Promise<void> {
    const button = await this.showButton();
    if (button === null) throw new Error('The filters are not in a drawer.');
    await button.click();
  }
}
