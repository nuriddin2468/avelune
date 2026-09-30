import {
  ComponentHarness,
  HarnessPredicate,
  TestKey,
  type BaseHarnessFilters,
  type TestElement,
} from '@angular/cdk/testing';

/**
 * Filters for {@link AveMenubarHarness}.
 *
 * @beta
 */
export interface AveMenubarHarnessFilters extends BaseHarnessFilters {
  /** Only match menubars named by this string, or matching this pattern. */
  label?: string | RegExp;
}

/**
 * Harness for `<ave-menubar>` from `@avelune/ui/menu`: its menus, and the items of the one that is open.
 *
 * @beta
 */
export class AveMenubarHarness extends ComponentHarness {
  /** Selector that finds kit menubars. */
  static hostSelector = 'ave-menubar';

  private readonly root = this.documentRootLocatorFactory();
  private readonly tops = this.locatorForAll('[role="menubar"] > [role="menuitem"]');

  /** Gets a predicate that matches menubars by the given filters. */
  static with(options: AveMenubarHarnessFilters = {}): HarnessPredicate<AveMenubarHarness> {
    return new HarnessPredicate(AveMenubarHarness, options).addOption('label', options.label, (harness, label) =>
      HarnessPredicate.stringMatches(harness.getLabel(), label),
    );
  }

  /** Gets the bar's name. */
  async getLabel(): Promise<string | null> {
    return (await this.locatorFor('[role="menubar"]')()).getAttribute('aria-label');
  }

  /** Gets the words of the bar's menus, in order. */
  async getMenus(): Promise<string[]> {
    return Promise.all((await this.tops()).map(async (top) => (await top.text()).trim()));
  }

  /** Whether the menu with these words is open. */
  async isOpen(menu: string | RegExp): Promise<boolean> {
    return (await (await this.top(menu)).getAttribute('aria-expanded')) === 'true';
  }

  /**
   * Opens the menu with these words with a click on its item, unless it is open. Another open menu closes first: a
   * click on its neighbour's item, without the pointer moving over it, would close both.
   */
  async open(menu: string | RegExp): Promise<void> {
    if (await this.isOpen(menu)) return;
    for (const top of await this.tops()) {
      if ((await top.getAttribute('aria-expanded')) === 'true') await this.close((await top.text()).trim());
    }
    await (await this.top(menu)).click();
  }

  /** Closes the menu with these words with Escape, unless it is closed. */
  async close(menu: string | RegExp): Promise<void> {
    if (!(await this.isOpen(menu))) return;
    await (await this.panel(menu)).sendKeys(TestKey.ESCAPE);
  }

  /** Gets the words of a menu's items, in order, opening it first. */
  async getItems(menu: string | RegExp): Promise<string[]> {
    return Promise.all((await this.items(menu)).map(async (item) => (await item.text()).trim()));
  }

  /** Chooses the first item of a menu whose words are this string or match this pattern, opening the menu first. */
  async selectItem(menu: string | RegExp, label: string | RegExp): Promise<void> {
    for (const item of await this.items(menu)) {
      if (await HarnessPredicate.stringMatches((await item.text()).trim(), label)) {
        await item.click();
        return;
      }
    }
    throw new Error(`AveMenubarHarness: no item of ${String(menu)} matches ${String(label)}.`);
  }

  private async top(menu: string | RegExp): Promise<TestElement> {
    for (const top of await this.tops()) {
      if (await HarnessPredicate.stringMatches((await top.text()).trim(), menu)) return top;
    }
    throw new Error(`AveMenubarHarness: no menu matches ${String(menu)}.`);
  }

  private async panel(menu: string | RegExp): Promise<TestElement> {
    await this.open(menu);
    const id = String(await (await this.top(menu)).getAttribute('aria-controls'));
    return this.root.locatorFor(`[id="${id}"]`)();
  }

  private async items(menu: string | RegExp): Promise<TestElement[]> {
    const id = String(await (await this.panel(menu)).getAttribute('id'));
    return this.root.locatorForAll(`[id="${id}"] [role="menuitem"]`)();
  }
}
