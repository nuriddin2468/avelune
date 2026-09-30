import { ComponentHarness, HarnessPredicate, type BaseHarnessFilters } from '@angular/cdk/testing';
import type { AveAlertVariant } from '@avelune/ui/alert';
import { variantOf } from './alert-harness';

/**
 * Filters for {@link AveBannerHarness}.
 *
 * @beta
 */
export interface AveBannerHarnessFilters extends BaseHarnessFilters {
  /** Only match banners of this variant. */
  variant?: AveAlertVariant;
  /** Only match banners whose message is this string, or matches this pattern. */
  text?: string | RegExp;
}

/**
 * Harness for `<ave-banner>` from `@avelune/ui/alert`.
 *
 * @beta
 */
export class AveBannerHarness extends ComponentHarness {
  /** Selector that finds kit banners. */
  static hostSelector = 'ave-banner';

  /** Gets a predicate that matches banners by the given filters. */
  static with(options: AveBannerHarnessFilters = {}): HarnessPredicate<AveBannerHarness> {
    return new HarnessPredicate(AveBannerHarness, options)
      .addOption('variant', options.variant, async (harness, variant) => (await harness.getVariant()) === variant)
      .addOption('text', options.text, (harness, text) => HarnessPredicate.stringMatches(harness.getText(), text));
  }

  /** Gets the variant. */
  async getVariant(): Promise<AveAlertVariant> {
    return variantOf(await (await this.host()).getAttribute('data-variant'), 'AveBannerHarness');
  }

  /** Gets the live role: `alert` for a warning or an error, `status` for information or a success. */
  async getRole(): Promise<string | null> {
    return (await this.host()).getAttribute('role');
  }

  /** Gets the message. */
  async getText(): Promise<string> {
    return (await (await this.locatorFor('.message')()).text()).replace(/\s+/g, ' ').trim();
  }

  /** Whether the banner has a close button. */
  async isDismissible(): Promise<boolean> {
    return (await this.locatorForOptional('button.close')()) !== null;
  }

  /** Presses the close button. */
  async dismiss(): Promise<void> {
    await (await this.locatorFor('button.close')()).click();
  }
}
