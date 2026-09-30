import { ComponentHarness, HarnessPredicate, type BaseHarnessFilters, type TestElement } from '@angular/cdk/testing';

/**
 * Filters for {@link AveTooltipHarness}.
 *
 * @beta
 */
export interface AveTooltipHarnessFilters extends BaseHarnessFilters {
  /** Only match elements whose tooltip shows, or does not. */
  open?: boolean;
}

/**
 * Harness for an element with `aveTooltip` from `@avelune/ui/tooltip`. Its tooltip shows after the pointer rests on
 * it for `timing.tooltip-delay`; set that token to `0ms` in unit tests, and the harness waits for the rest.
 *
 * @beta
 */
export class AveTooltipHarness extends ComponentHarness {
  /** Selector that finds elements with a kit tooltip. */
  static hostSelector = '[data-ave-tooltip]';

  private readonly root = this.documentRootLocatorFactory();

  /** Gets a predicate that matches elements with a tooltip by the given filters. */
  static with(options: AveTooltipHarnessFilters = {}): HarnessPredicate<AveTooltipHarness> {
    return new HarnessPredicate(AveTooltipHarness, options).addOption(
      'open',
      options.open,
      async (harness, open) => (await harness.isOpen()) === open,
    );
  }

  /** Rests the pointer on the element, and waits until its tooltip shows. */
  async show(): Promise<void> {
    await (await this.host()).hover();
    await this.forceStabilize();
  }

  /** Moves the pointer away from the element, and waits until its tooltip has gone. */
  async hide(): Promise<void> {
    await (await this.host()).mouseAway();
    await this.forceStabilize();
  }

  /** Whether the tooltip shows (and is not leaving). */
  async isOpen(): Promise<boolean> {
    const panel = await this.panel();
    return panel !== null && (await panel.getAttribute('data-state')) === 'open';
  }

  /** Gets the text the tooltip shows, or an empty string while it does not show. */
  async getText(): Promise<string> {
    const panel = await this.panel();
    return panel === null ? '' : (await panel.text()).trim();
  }

  /** Gets the side it shows on, after any flip, or `null` while it does not show. */
  async getSide(): Promise<string | null> {
    const panel = await this.panel();
    return panel === null ? null : panel.getAttribute('data-side');
  }

  private async panel(): Promise<TestElement | null> {
    const key = String(await (await this.host()).getAttribute('data-ave-tooltip'));
    return this.root.locatorForOptional(`[data-ave-tooltip-of="${key}"]`)();
  }
}
