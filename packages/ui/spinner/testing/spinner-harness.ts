import { ComponentHarness, HarnessPredicate, type BaseHarnessFilters } from '@angular/cdk/testing';
import type { AveSpinnerSize } from '@avelune/ui/spinner';

const SIZES: readonly AveSpinnerSize[] = ['sm', 'md', 'lg'];

/**
 * Filters for {@link AveSpinnerHarness}.
 *
 * @alpha
 */
export interface AveSpinnerHarnessFilters extends BaseHarnessFilters {
  /** Only match spinners that show, or that wait for their delay or have finished. */
  shown?: boolean;
}

/**
 * Harness for `<ave-spinner>` from `@avelune/ui/spinner`.
 *
 * @alpha
 */
export class AveSpinnerHarness extends ComponentHarness {
  /** Selector that finds kit spinners. */
  static hostSelector = 'ave-spinner';

  /** Gets a predicate that matches spinners by the given filters. */
  static with(options: AveSpinnerHarnessFilters = {}): HarnessPredicate<AveSpinnerHarness> {
    return new HarnessPredicate(AveSpinnerHarness, options).addOption(
      'shown',
      options.shown,
      async (harness, shown) => (await harness.isShown()) === shown,
    );
  }

  /** Whether the spinner shows: its wait has lasted the spinner delay, and its minimum time has not passed. */
  async isShown(): Promise<boolean> {
    return (await (await this.host()).getAttribute('data-shown')) !== null;
  }

  /** Gets the accessible name while the spinner shows, or an empty string while it does not. */
  async getLabel(): Promise<string> {
    return (await (await this.host()).getAttribute('aria-label')) ?? '';
  }

  /** Gets the size. */
  async getSize(): Promise<AveSpinnerSize> {
    const value = await (await this.host()).getAttribute('data-size');
    const size = SIZES.find((candidate) => candidate === value);
    if (size === undefined) throw new Error(`AveSpinnerHarness: unexpected data-size "${String(value)}".`);
    return size;
  }
}
