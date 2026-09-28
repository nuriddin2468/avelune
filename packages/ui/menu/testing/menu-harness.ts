import {
  ComponentHarness,
  HarnessPredicate,
  TestKey,
  type BaseHarnessFilters,
  type TestElement,
} from '@angular/cdk/testing';

/**
 * Filters for {@link AveMenuHarness}.
 *
 * @alpha
 */
export interface AveMenuHarnessFilters extends BaseHarnessFilters {
  /** Only match menus whose button is named by this string, or matches this pattern. */
  label?: string | RegExp;
}

/**
 * Harness for `<ave-menu>` from `@avelune/ui/menu`: its button, and the items of its menu while it is open.
 *
 * @alpha
 */
export class AveMenuHarness extends ComponentHarness {
  /** Selector that finds kit menus. */
  static hostSelector = 'ave-menu';

  private readonly root = this.documentRootLocatorFactory();
  private readonly button = this.locatorFor('button');

  /** Gets a predicate that matches menus by the given filters. */
  static with(options: AveMenuHarnessFilters = {}): HarnessPredicate<AveMenuHarness> {
    return new HarnessPredicate(AveMenuHarness, options).addOption('label', options.label, (harness, label) =>
      HarnessPredicate.stringMatches(harness.getLabel(), label),
    );
  }

  /** Gets the button's name: its `aria-label` for an icon alone, or its words. */
  async getLabel(): Promise<string> {
    const button = await this.button();
    return (await button.getAttribute('aria-label')) ?? (await button.text()).trim();
  }

  /** Whether the menu is open. */
  async isOpen(): Promise<boolean> {
    return (await (await this.button()).getAttribute('aria-expanded')) === 'true';
  }

  /** Whether the button is disabled. */
  async isDisabled(): Promise<boolean> {
    return (await this.button()).getProperty<boolean>('disabled');
  }

  /** Opens the menu with a click on its button, unless it is open. */
  async open(): Promise<void> {
    if (!(await this.isOpen())) await (await this.button()).click();
  }

  /** Closes the menu with Escape, unless it is closed. */
  async close(): Promise<void> {
    if (!(await this.isOpen())) return;
    await (await this.menu()).sendKeys(TestKey.ESCAPE);
  }

  /** Gets the words of every item, in order, opening the menu first. */
  async getItems(): Promise<string[]> {
    return Promise.all((await this.items()).map(async (item) => (await item.text()).trim()));
  }

  /** Gets the words of the items that cannot be chosen, opening the menu first. */
  async getDisabledItems(): Promise<string[]> {
    const disabled: string[] = [];
    for (const item of await this.items()) {
      if ((await item.getAttribute('aria-disabled')) === 'true') disabled.push((await item.text()).trim());
    }
    return disabled;
  }

  /** Chooses the first item whose words are this string or match this pattern, opening the menu first. */
  async selectItem(label: string | RegExp): Promise<void> {
    for (const item of await this.items()) {
      if (await HarnessPredicate.stringMatches((await item.text()).trim(), label)) {
        await item.click();
        return;
      }
    }
    throw new Error(`AveMenuHarness: no item matches ${String(label)}.`);
  }

  private async menu(): Promise<TestElement> {
    await this.open();
    const id = String(await (await this.button()).getAttribute('aria-controls'));
    return this.root.locatorFor(`[id="${id}"]`)();
  }

  private async items(): Promise<TestElement[]> {
    const id = String(await (await this.menu()).getAttribute('id'));
    return this.root.locatorForAll(`[id="${id}"] [role="menuitem"]`)();
  }
}
