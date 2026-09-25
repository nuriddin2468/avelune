import { ComponentHarness, HarnessPredicate, type BaseHarnessFilters } from '@angular/cdk/testing';
import type { AveIconName, AveIconSize } from '@avelune/ui/icon';

const SIZES: readonly AveIconSize[] = ['sm', 'md', 'lg'];

/**
 * Filters for {@link AveIconHarness}.
 *
 * @beta
 */
export interface AveIconHarnessFilters extends BaseHarnessFilters {
  /** Only match icons with this name. */
  name?: AveIconName;
  /** Only match icons with this accessible name. */
  label?: string;
}

/**
 * Harness for `<ave-icon>` from `@avelune/ui/icon`.
 *
 * @beta
 */
export class AveIconHarness extends ComponentHarness {
  /** Selector that finds icon hosts. */
  static hostSelector = 'ave-icon';

  /** Gets a predicate that matches icons by the given filters. */
  static with(options: AveIconHarnessFilters = {}): HarnessPredicate<AveIconHarness> {
    return new HarnessPredicate(AveIconHarness, options)
      .addOption('name', options.name, async (harness, name) => (await harness.getName()) === name)
      .addOption('label', options.label, async (harness, label) => (await harness.getLabel()) === label);
  }

  /** Gets the name of the icon. */
  async getName(): Promise<string> {
    const name = await (await this.host()).getAttribute('data-icon');
    if (name === null) throw new Error('AveIconHarness: the icon has no data-icon.');
    return name;
  }

  /** Gets the size of the icon. */
  async getSize(): Promise<AveIconSize> {
    const value = await (await this.host()).getAttribute('data-size');
    const size = SIZES.find((candidate) => candidate === value);
    if (size === undefined) throw new Error(`AveIconHarness: unexpected data-size "${String(value)}".`);
    return size;
  }

  /** Gets the accessible name, or null for a decorative icon. */
  async getLabel(): Promise<string | null> {
    return (await this.host()).getAttribute('aria-label');
  }

  /** Whether the icon is hidden from assistive technology. */
  async isDecorative(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-hidden')) === 'true';
  }

  /**
   * Gets the rendered size of the icon and the kit's stroke width on it, in CSS pixels; the stroke is 0 for an icon
   * that keeps the strokes it was drawn with.
   */
  async getRenderedSize(): Promise<{ readonly size: number; readonly stroke: number }> {
    const host = await this.host();
    const { width } = await host.getDimensions();
    const svg = await this.locatorFor('svg')();
    const stroke = Number(await svg.getAttribute('stroke-width'));
    // The drawing scales its largest side, the width or height of its viewBox, to the icon box.
    const side = Math.max(
      ...String(await svg.getAttribute('viewBox'))
        .split(' ')
        .slice(2)
        .map(Number),
    );
    return { size: width, stroke: (stroke * width) / side };
  }
}
