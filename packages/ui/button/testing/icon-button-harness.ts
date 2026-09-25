import { HarnessPredicate } from '@angular/cdk/testing';
import { AveButtonHarness, type AveButtonHarnessFilters } from './button-harness';

/**
 * Filters for {@link AveIconButtonHarness}.
 *
 * @beta
 */
export interface AveIconButtonHarnessFilters extends Omit<AveButtonHarnessFilters, 'text'> {
  /** Only match icon buttons whose label is this string, or matches this pattern. */
  label?: string | RegExp;
}

/**
 * Harness for `button[aveIconButton]` and `a[aveIconButton]` from `@avelune/ui/button`: the Button harness, with the
 * label and the icon.
 *
 * @beta
 */
export class AveIconButtonHarness extends AveButtonHarness {
  /** Selector that finds icon buttons. */
  static override hostSelector = 'button[aveIconButton], a[aveIconButton]';

  /** Gets a predicate that matches icon buttons by the given filters. */
  static override with(options: AveIconButtonHarnessFilters = {}): HarnessPredicate<AveIconButtonHarness> {
    return new HarnessPredicate(AveIconButtonHarness, options)
      .addOption('label', options.label, (harness, label) => HarnessPredicate.stringMatches(harness.getLabel(), label))
      .addOption('variant', options.variant, async (harness, variant) => (await harness.getVariant()) === variant);
  }

  /** Gets the accessible name. */
  async getLabel(): Promise<string> {
    return (await (await this.host()).getAttribute('aria-label')) ?? '';
  }

  /** Gets the name of the icon. */
  async getIcon(): Promise<string> {
    const icon = await this.locatorFor('.content ave-icon')();
    const name = await icon.getAttribute('data-icon');
    if (name === null) throw new Error('AveIconButtonHarness: the icon has no data-icon.');
    return name;
  }
}
