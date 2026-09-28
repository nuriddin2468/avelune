import {
  ComponentHarness,
  HarnessPredicate,
  TestKey,
  type BaseHarnessFilters,
  type HarnessLoader,
  type TestElement,
} from '@angular/cdk/testing';

/**
 * Filters for {@link AvePopoverHarness}.
 *
 * @alpha
 */
export interface AvePopoverHarnessFilters extends BaseHarnessFilters {
  /** Only match popovers whose button is named by this string, or matches this pattern. */
  label?: string | RegExp;
}

/**
 * Harness for `<ave-popover>` from `@avelune/ui/popover`: its button, and its panel while it is open.
 *
 * @alpha
 */
export class AvePopoverHarness extends ComponentHarness {
  /** Selector that finds kit popovers. */
  static hostSelector = 'ave-popover';

  private readonly root = this.documentRootLocatorFactory();
  private readonly button = this.locatorFor('button');

  /** Gets a predicate that matches popovers by the given filters. */
  static with(options: AvePopoverHarnessFilters = {}): HarnessPredicate<AvePopoverHarness> {
    return new HarnessPredicate(AvePopoverHarness, options).addOption('label', options.label, (harness, label) =>
      HarnessPredicate.stringMatches(harness.getLabel(), label),
    );
  }

  /** Gets the button's name: its `aria-label` for an icon alone, or its words. */
  async getLabel(): Promise<string> {
    const button = await this.button();
    return (await button.getAttribute('aria-label')) ?? (await button.text()).trim();
  }

  /** Whether the panel is open. */
  async isOpen(): Promise<boolean> {
    return (await (await this.button()).getAttribute('aria-expanded')) === 'true';
  }

  /** Whether the button is disabled. */
  async isDisabled(): Promise<boolean> {
    return (await this.button()).getProperty<boolean>('disabled');
  }

  /** Opens the panel with a click on its button, unless it is open. */
  async open(): Promise<void> {
    if (!(await this.isOpen())) await (await this.button()).click();
  }

  /** Closes the panel with Escape, unless it is closed. */
  async close(): Promise<void> {
    if (await this.isOpen()) await (await this.panel()).sendKeys(TestKey.ESCAPE);
  }

  /** Gets the panel's heading, opening it first; an empty string without one. */
  async getHeading(): Promise<string> {
    const panel = await this.panel();
    const id = String(await panel.getAttribute('id'));
    const heading = await this.root.locatorForOptional(`[id="${id}"] > .heading`)();
    return heading === null ? '' : (await heading.text()).trim();
  }

  /** Gets the panel's text, opening it first. */
  async getText(): Promise<string> {
    return (await (await this.panel()).text()).replace(/\s+/g, ' ').trim();
  }

  /** Gets a loader for the harnesses of the panel's content (its fields and buttons), opening it first. */
  async getPanelLoader(): Promise<HarnessLoader> {
    const id = String(await (await this.panel()).getAttribute('id'));
    return this.root.harnessLoaderFor(`[id="${id}"]`);
  }

  private async panel(): Promise<TestElement> {
    await this.open();
    const id = String(await (await this.button()).getAttribute('aria-controls'));
    return this.root.locatorFor(`[id="${id}"]`)();
  }
}
