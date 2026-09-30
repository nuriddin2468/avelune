import { HarnessPredicate } from '@angular/cdk/testing';
import { AveSliderHarness, type AveSliderHarnessFilters } from './slider-harness';

/**
 * Harness for `<ave-range-slider>` from `@avelune/ui/slider`: its two thumbs, the lower and the upper. The slider's
 * own methods act on the lower thumb.
 *
 * @beta
 */
export class AveRangeSliderHarness extends AveSliderHarness {
  /** Selector that finds kit range sliders. */
  static override hostSelector = 'ave-range-slider';

  /** Gets a predicate that matches range sliders by the given filters (`valueText` is the lower thumb's). */
  static override with(options: AveSliderHarnessFilters = {}): HarnessPredicate<AveRangeSliderHarness> {
    return new HarnessPredicate(AveRangeSliderHarness, options).addOption(
      'valueText',
      options.valueText,
      (harness, text) => HarnessPredicate.stringMatches(harness.getValueText(), text),
    );
  }

  /** Gets both ends. */
  async getRange(): Promise<{ start: number; end: number }> {
    const [start, end] = await Promise.all(
      ([0, 1] as const).map(async (index) => (await this.thumb(index)).getProperty<string>('value')),
    );
    return { start: Number(start), end: Number(end) };
  }

  /** Moves the lower thumb; it stops at the upper one. */
  async setStart(value: number): Promise<void> {
    await this.move(0, value);
  }

  /** Moves the upper thumb; it stops at the lower one. */
  async setEnd(value: number): Promise<void> {
    await this.move(1, value);
  }

  /** Gets how the upper thumb is written for screen readers. */
  async getEndText(): Promise<string | null> {
    return (await this.thumb(1)).getAttribute('aria-valuetext');
  }

  /** Gets the ids that name each thumb (`aria-labelledby`), the lower one's first. */
  async getThumbNames(): Promise<string[]> {
    const names = await Promise.all(
      ([0, 1] as const).map(async (index) => (await this.thumb(index)).getAttribute('aria-labelledby')),
    );
    return names.filter((name): name is string => name !== null);
  }

  /** Focuses the upper thumb. */
  async focusEnd(): Promise<void> {
    await (await this.thumb(1)).focus();
  }
}
