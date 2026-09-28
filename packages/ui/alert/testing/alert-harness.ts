import { ComponentHarness, HarnessPredicate, type BaseHarnessFilters } from '@angular/cdk/testing';
import type { AveAlertVariant } from '@avelune/ui/alert';

const VARIANTS: readonly AveAlertVariant[] = ['info', 'success', 'warning', 'danger'];

/** Reads the variant of an alert or a banner from its `data-variant`. */
export function variantOf(value: string | null, harness: string): AveAlertVariant {
  const variant = VARIANTS.find((candidate) => candidate === value);
  if (variant === undefined) throw new Error(`${harness}: unexpected data-variant "${String(value)}".`);
  return variant;
}

/**
 * Filters for {@link AveAlertHarness}.
 *
 * @alpha
 */
export interface AveAlertHarnessFilters extends BaseHarnessFilters {
  /** Only match alerts of this variant. */
  variant?: AveAlertVariant;
  /** Only match alerts whose text (heading and message) is this string, or matches this pattern. */
  text?: string | RegExp;
}

/**
 * Harness for `<ave-alert>` from `@avelune/ui/alert`.
 *
 * @alpha
 */
export class AveAlertHarness extends ComponentHarness {
  /** Selector that finds kit alerts. */
  static hostSelector = 'ave-alert';

  /** Gets a predicate that matches alerts by the given filters. */
  static with(options: AveAlertHarnessFilters = {}): HarnessPredicate<AveAlertHarness> {
    return new HarnessPredicate(AveAlertHarness, options)
      .addOption('variant', options.variant, async (harness, variant) => (await harness.getVariant()) === variant)
      .addOption('text', options.text, (harness, text) => HarnessPredicate.stringMatches(harness.getText(), text));
  }

  /** Gets the variant. */
  async getVariant(): Promise<AveAlertVariant> {
    return variantOf(await (await this.host()).getAttribute('data-variant'), 'AveAlertHarness');
  }

  /** Gets the live role: `alert` for a warning or an error, `status` for information or a success. */
  async getRole(): Promise<string | null> {
    return (await this.host()).getAttribute('role');
  }

  /** Gets the heading, or an empty string without one. */
  async getHeading(): Promise<string> {
    const heading = await this.locatorForOptional('.heading')();
    return heading === null ? '' : (await heading.text()).trim();
  }

  /** Gets the message, without the heading. */
  async getMessage(): Promise<string> {
    return (await (await this.locatorFor('.message')()).text()).replace(/\s+/g, ' ').trim();
  }

  /** Gets the heading and the message, as one line of text. */
  async getText(): Promise<string> {
    return (await (await this.locatorFor('.content')()).text()).replace(/\s+/g, ' ').trim();
  }

  /** Gets the name of the icon's kind, as assistive technology hears it ("Warning"). */
  async getKind(): Promise<string> {
    return (await (await this.locatorFor('.icon')()).getAttribute('aria-label')) ?? '';
  }
}
