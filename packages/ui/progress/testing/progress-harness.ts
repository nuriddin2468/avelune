import { ComponentHarness, HarnessPredicate, type BaseHarnessFilters } from '@angular/cdk/testing';
import type { AveProgressSize, AveProgressVariant } from '@avelune/ui/progress';

const VARIANTS: readonly AveProgressVariant[] = ['accent', 'success', 'danger'];
const SIZES: readonly AveProgressSize[] = ['sm', 'md'];

/**
 * Filters for {@link AveProgressHarness}.
 *
 * @beta
 */
export interface AveProgressHarnessFilters extends BaseHarnessFilters {
  /** Only match progress bars whose accessible name is this string, or matches this pattern. */
  label?: string | RegExp;
}

/**
 * Harness for `progress[aveProgress]` from `@avelune/ui/progress`.
 *
 * @beta
 */
export class AveProgressHarness extends ComponentHarness {
  /** Selector that finds kit progress bars. */
  static hostSelector = 'progress[aveProgress]';

  /** Gets a predicate that matches progress bars by the given filters. */
  static with(options: AveProgressHarnessFilters = {}): HarnessPredicate<AveProgressHarness> {
    return new HarnessPredicate(AveProgressHarness, options).addOption('label', options.label, (harness, label) =>
      HarnessPredicate.stringMatches(harness.getLabel(), label),
    );
  }

  /**
   * Gets what names the progress bar: its `aria-label`, or the text of its first label. Reads the element's native
   * `labels`, which the unit-test environment passes through.
   */
  async getLabel(): Promise<string> {
    const host = await this.host();
    const ariaLabel = await host.getAttribute('aria-label');
    if (ariaLabel !== null) return ariaLabel;
    const labels = await host.getProperty<ArrayLike<{ readonly textContent: string | null }> | null>('labels');
    return (labels?.[0]?.textContent ?? '').replace(/\s+/g, ' ').trim();
  }

  /** Gets the value, or `null` when the progress bar has none. */
  async getValue(): Promise<number | null> {
    const host = await this.host();
    if ((await host.getAttribute('value')) === null) return null;
    return host.getProperty<number>('value');
  }

  /** Gets the maximum, 1 unless `max` is set. */
  async getMax(): Promise<number> {
    return (await this.host()).getProperty<number>('max');
  }

  /** Gets how much of the work is done, from 0 to 100, or `null` without a value. */
  async getPercent(): Promise<number | null> {
    const value = await this.getValue();
    if (value === null) return null;
    return (Math.min(value, await this.getMax()) / (await this.getMax())) * 100;
  }

  /** Gets the variant. */
  async getVariant(): Promise<AveProgressVariant> {
    const value = await (await this.host()).getAttribute('data-variant');
    const variant = VARIANTS.find((candidate) => candidate === value);
    if (variant === undefined) throw new Error(`AveProgressHarness: unexpected data-variant "${String(value)}".`);
    return variant;
  }

  /** Gets the size. */
  async getSize(): Promise<AveProgressSize> {
    const value = await (await this.host()).getAttribute('data-size');
    const size = SIZES.find((candidate) => candidate === value);
    if (size === undefined) throw new Error(`AveProgressHarness: unexpected data-size "${String(value)}".`);
    return size;
  }
}
