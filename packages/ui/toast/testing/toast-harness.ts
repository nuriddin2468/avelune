import { ComponentHarness, HarnessPredicate, type BaseHarnessFilters } from '@angular/cdk/testing';
import type { AveToastVariant } from '@avelune/ui/toast';

const VARIANTS: readonly AveToastVariant[] = ['info', 'success', 'warning', 'danger'];

/**
 * Filters for {@link AveToastHarness}.
 *
 * @alpha
 */
export interface AveToastHarnessFilters extends BaseHarnessFilters {
  /** Only match toasts whose message is this string, or matches this pattern. */
  message?: string | RegExp;
  /** Only match toasts of this variant. */
  variant?: AveToastVariant;
}

/**
 * Harness for a toast that `AveToaster` from `@avelune/ui/toast` shows. Toasts are drawn at the end of `<body>`, so load
 * it with `TestbedHarnessEnvironment.documentRootLoader(fixture)`. A toast that plays its exit no longer matches. Each
 * stays for `timing.toast`; set that token in unit tests that wait for one to go.
 *
 * @alpha
 */
export class AveToastHarness extends ComponentHarness {
  /** Selector that finds the kit's toasts on screen, not those leaving. */
  static hostSelector = '[data-ave-toast]:not(.ave-motion-toast-exit)';

  /** Gets a predicate that matches toasts by the given filters. */
  static with(options: AveToastHarnessFilters = {}): HarnessPredicate<AveToastHarness> {
    return new HarnessPredicate(AveToastHarness, options)
      .addOption('message', options.message, (harness, message) =>
        HarnessPredicate.stringMatches(harness.getMessage(), message),
      )
      .addOption('variant', options.variant, async (harness, variant) => (await harness.getVariant()) === variant);
  }

  /** Gets the message. */
  async getMessage(): Promise<string> {
    return (await (await this.locatorFor('.message')()).text()).trim();
  }

  /** Gets the variant. */
  async getVariant(): Promise<AveToastVariant> {
    const value = await (await this.host()).getAttribute('data-variant');
    const variant = VARIANTS.find((candidate) => candidate === value);
    if (variant === undefined) throw new Error(`AveToastHarness: unexpected data-variant "${String(value)}".`);
    return variant;
  }

  /** Gets the words of the toast's action, or `null` when it has none. */
  async getActionLabel(): Promise<string | null> {
    const action = await this.locatorForOptional('button.action')();
    return action === null ? null : (await action.text()).trim();
  }

  /** Chooses the toast's action, which closes it. */
  async runAction(): Promise<void> {
    await (await this.locatorFor('button.action')()).click();
  }

  /** Presses the close button. */
  async dismiss(): Promise<void> {
    await (await this.locatorFor('button.close')()).click();
  }
}
