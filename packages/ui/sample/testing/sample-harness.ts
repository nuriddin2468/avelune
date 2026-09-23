import { ComponentHarness, HarnessPredicate, type BaseHarnessFilters } from '@angular/cdk/testing';
import type { AveSampleTone } from '@avelune/ui/sample';

const TONES: readonly AveSampleTone[] = ['neutral', 'accent'];

/**
 * Filters for {@link AveSampleHarness}.
 *
 * @alpha
 */
export interface AveSampleHarnessFilters extends BaseHarnessFilters {
  /** Only match samples with this tone. */
  tone?: AveSampleTone;
}

/**
 * Harness for the `aveSample` directive from `@avelune/ui/sample`.
 *
 * @alpha
 */
export class AveSampleHarness extends ComponentHarness {
  /** Selector that finds sample hosts. */
  static hostSelector = '[aveSample]';

  /** Gets a predicate that matches samples by the given filters. */
  static with(options: AveSampleHarnessFilters = {}): HarnessPredicate<AveSampleHarness> {
    return new HarnessPredicate(AveSampleHarness, options).addOption(
      'tone',
      options.tone,
      async (harness, tone) => (await harness.getTone()) === tone,
    );
  }

  /** Gets the tone reflected on the host. */
  async getTone(): Promise<AveSampleTone> {
    const value = await (await this.host()).getAttribute('data-tone');
    const tone = TONES.find((candidate) => candidate === value);
    if (tone === undefined) {
      throw new Error(`AveSampleHarness: unexpected data-tone "${value}".`);
    }
    return tone;
  }

  /** Whether the sample is disabled. */
  async isDisabled(): Promise<boolean> {
    return (await (await this.host()).getAttribute('data-disabled')) !== null;
  }
}
