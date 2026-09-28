import { ComponentHarness, HarnessPredicate, type BaseHarnessFilters } from '@angular/cdk/testing';
import type { AveSkeletonShape } from '@avelune/ui/skeleton';

const SHAPES: readonly AveSkeletonShape[] = ['text', 'block'];

/**
 * Filters for {@link AveSkeletonHarness}.
 *
 * @alpha
 */
export interface AveSkeletonHarnessFilters extends BaseHarnessFilters {
  /** Only match skeletons of this shape. */
  shape?: AveSkeletonShape;
}

/**
 * Harness for `<ave-skeleton>` from `@avelune/ui/skeleton`.
 *
 * @alpha
 */
export class AveSkeletonHarness extends ComponentHarness {
  /** Selector that finds kit skeletons. */
  static hostSelector = 'ave-skeleton';

  /** Gets a predicate that matches skeletons by the given filters. */
  static with(options: AveSkeletonHarnessFilters = {}): HarnessPredicate<AveSkeletonHarness> {
    return new HarnessPredicate(AveSkeletonHarness, options).addOption(
      'shape',
      options.shape,
      async (harness, shape) => (await harness.getShape()) === shape,
    );
  }

  /** Gets the shape. */
  async getShape(): Promise<AveSkeletonShape> {
    const value = await (await this.host()).getAttribute('data-shape');
    const shape = SHAPES.find((candidate) => candidate === value);
    if (shape === undefined) throw new Error(`AveSkeletonHarness: unexpected data-shape "${String(value)}".`);
    return shape;
  }

  /** Gets how many parts it draws: its lines of text, or 1 for a block. */
  async getParts(): Promise<number> {
    return (await this.locatorForAll('.part')()).length;
  }

  /** Whether it is hidden from assistive technology, as a skeleton always is. */
  async isHidden(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-hidden')) === 'true';
  }
}
