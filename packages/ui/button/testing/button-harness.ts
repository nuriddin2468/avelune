import { ComponentHarness, HarnessPredicate, type BaseHarnessFilters } from '@angular/cdk/testing';
import type { AveButtonSize, AveButtonVariant } from '@avelune/ui/button';

const VARIANTS: readonly AveButtonVariant[] = ['primary', 'secondary', 'ghost', 'danger'];
const SIZES: readonly AveButtonSize[] = ['sm', 'md', 'lg'];

/**
 * Filters for {@link AveButtonHarness}.
 *
 * @alpha
 */
export interface AveButtonHarnessFilters extends BaseHarnessFilters {
  /** Only match buttons whose text is this string, or matches this pattern. */
  text?: string | RegExp;
  /** Only match buttons of this variant. */
  variant?: AveButtonVariant;
}

/**
 * Harness for `button[aveButton]` and `a[aveButton]` from `@avelune/ui/button`.
 *
 * @alpha
 */
export class AveButtonHarness extends ComponentHarness {
  /** Selector that finds kit buttons and button-styled links. */
  static hostSelector = 'button[aveButton], a[aveButton]';

  /** Gets a predicate that matches buttons by the given filters. */
  static with(options: AveButtonHarnessFilters = {}): HarnessPredicate<AveButtonHarness> {
    return new HarnessPredicate(AveButtonHarness, options)
      .addOption('text', options.text, (harness, text) => HarnessPredicate.stringMatches(harness.getText(), text))
      .addOption('variant', options.variant, async (harness, variant) => (await harness.getVariant()) === variant);
  }

  /** Clicks the button, as a pointer does. */
  async click(): Promise<void> {
    await (await this.host()).click();
  }

  /** Focuses the button. */
  async focus(): Promise<void> {
    await (await this.host()).focus();
  }

  /** Whether the button has focus. */
  async isFocused(): Promise<boolean> {
    return (await this.host()).isFocused();
  }

  /** Gets the visible label, without surrounding white space. */
  async getText(): Promise<string> {
    return (await (await this.host()).text()).trim();
  }

  /** Gets the variant. */
  async getVariant(): Promise<AveButtonVariant> {
    const value = await (await this.host()).getAttribute('data-variant');
    const variant = VARIANTS.find((candidate) => candidate === value);
    if (variant === undefined) throw new Error(`AveButtonHarness: unexpected data-variant "${String(value)}".`);
    return variant;
  }

  /** Gets the size. */
  async getSize(): Promise<AveButtonSize> {
    const value = await (await this.host()).getAttribute('data-size');
    const size = SIZES.find((candidate) => candidate === value);
    if (size === undefined) throw new Error(`AveButtonHarness: unexpected data-size "${String(value)}".`);
    return size;
  }

  /** Whether the button is disabled, natively or with `aria-disabled`. */
  async isDisabled(): Promise<boolean> {
    const host = await this.host();
    return (
      (await host.getProperty<boolean | undefined>('disabled')) === true ||
      (await host.getAttribute('aria-disabled')) === 'true'
    );
  }

  /** Whether the button can still take focus while it is disabled (`disabledInteractive`, or never disabled). */
  async isFocusable(): Promise<boolean> {
    const host = await this.host();
    if ((await host.getProperty<boolean | undefined>('disabled')) === true) return false;
    return (await host.getAttribute('tabindex')) !== '-1';
  }

  /** Whether the button is busy: loading, or its spinner still showing. */
  async isBusy(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-busy')) === 'true';
  }

  /** Whether the spinner shows in place of the label. */
  async isSpinnerShown(): Promise<boolean> {
    return (await (await this.host()).getAttribute('data-spinner')) !== null;
  }
}
