import { ComponentHarness, HarnessPredicate, type BaseHarnessFilters } from '@angular/cdk/testing';
import type { AveBadgeVariant } from '@avelune/ui/badge';

const VARIANTS: readonly AveBadgeVariant[] = ['neutral', 'info', 'success', 'warning', 'danger'];

/**
 * Filters for {@link AveBadgeHarness}.
 *
 * @beta
 */
export interface AveBadgeHarnessFilters extends BaseHarnessFilters {
  /** Only match badges of this variant. */
  variant?: AveBadgeVariant;
  /** Only match badges whose words are this string, or match this pattern. */
  text?: string | RegExp;
}

/**
 * Harness for `<ave-badge>` from `@avelune/ui/badge`.
 *
 * @beta
 */
export class AveBadgeHarness extends ComponentHarness {
  /** Selector that finds kit badges. */
  static hostSelector = 'ave-badge';

  /** Gets a predicate that matches badges by the given filters. */
  static with(options: AveBadgeHarnessFilters = {}): HarnessPredicate<AveBadgeHarness> {
    return new HarnessPredicate(AveBadgeHarness, options)
      .addOption('variant', options.variant, async (harness, variant) => (await harness.getVariant()) === variant)
      .addOption('text', options.text, (harness, text) => HarnessPredicate.stringMatches(harness.getText(), text));
  }

  /** Gets the variant. */
  async getVariant(): Promise<AveBadgeVariant> {
    const value = await (await this.host()).getAttribute('data-variant');
    const variant = VARIANTS.find((candidate) => candidate === value);
    if (variant === undefined) throw new Error(`AveBadgeHarness: unexpected data-variant "${String(value)}".`);
    return variant;
  }

  /** Gets the words, on one line. */
  async getText(): Promise<string> {
    return (await (await this.host()).text()).replace(/\s+/g, ' ').trim();
  }
}
