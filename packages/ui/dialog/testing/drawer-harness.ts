import { HarnessPredicate } from '@angular/cdk/testing';
import type { AveDrawerSide } from '@avelune/ui/dialog';
import { AveDialogHarness, type AveDialogHarnessFilters } from './dialog-harness';

/**
 * Filters for {@link AveDrawerHarness}.
 *
 * @alpha
 */
export type AveDrawerHarnessFilters = AveDialogHarnessFilters;

/**
 * Harness for `dialog[aveDrawer]` from `@avelune/ui/dialog`: the dialog's harness, and the edge it slides in from.
 *
 * @alpha
 */
export class AveDrawerHarness extends AveDialogHarness {
  /** Selector that finds kit drawers. */
  static override hostSelector = 'dialog[aveDrawer]';

  /** Gets a predicate that matches drawers by the given filters. */
  static override with(options: AveDrawerHarnessFilters = {}): HarnessPredicate<AveDrawerHarness> {
    return new HarnessPredicate(AveDrawerHarness, options).addOption('heading', options.heading, (harness, heading) =>
      HarnessPredicate.stringMatches(harness.getHeading(), heading),
    );
  }

  /** Gets the edge it slides in from. */
  async getSide(): Promise<AveDrawerSide> {
    return (await (await this.host()).getAttribute('data-side')) === 'start' ? 'start' : 'end';
  }
}
