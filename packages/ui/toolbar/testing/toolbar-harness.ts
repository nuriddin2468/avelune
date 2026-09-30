import { ComponentHarness, HarnessPredicate, type BaseHarnessFilters, type TestElement } from '@angular/cdk/testing';

/**
 * Filters for {@link AveToolbarHarness}.
 *
 * @beta
 */
export interface AveToolbarHarnessFilters extends BaseHarnessFilters {
  /** Only match toolbars named by this string, or matching this pattern. */
  label?: string | RegExp;
}

/**
 * Harness for `[aveToolbar]` from `@avelune/ui/toolbar`: its items, in order, and the one the arrows reached.
 *
 * @beta
 */
export class AveToolbarHarness extends ComponentHarness {
  /** Selector that finds kit toolbars. */
  static hostSelector = '[aveToolbar]';

  /** The items: the marked ones and the menus' buttons that joined, in the order of the page. */
  private readonly items = this.locatorForAll('[aveToolbarItem], [ngToolbarWidget]');

  /** Gets a predicate that matches toolbars by the given filters. */
  static with(options: AveToolbarHarnessFilters = {}): HarnessPredicate<AveToolbarHarness> {
    return new HarnessPredicate(AveToolbarHarness, options).addOption('label', options.label, (harness, label) =>
      HarnessPredicate.stringMatches(harness.getLabel(), label),
    );
  }

  /** Gets the toolbar's name. */
  async getLabel(): Promise<string | null> {
    return (await this.host()).getAttribute('aria-label');
  }

  /** Gets each item's name: its `aria-label`, or its words. */
  async getItems(): Promise<string[]> {
    return Promise.all((await this.items()).map(async (item) => this.nameOf(item)));
  }

  /** Gets the names of the items that are unavailable. */
  async getDisabledItems(): Promise<string[]> {
    const disabled: string[] = [];
    for (const item of await this.items()) {
      if ((await item.getAttribute('aria-disabled')) === 'true') disabled.push(await this.nameOf(item));
    }
    return disabled;
  }

  /** Gets the name of the item that is the toolbar's Tab stop. */
  async getActiveItem(): Promise<string | null> {
    for (const item of await this.items()) {
      if ((await item.getAttribute('tabindex')) === '0') return this.nameOf(item);
    }
    return null;
  }

  /** Presses the item whose name is this string or matches this pattern. */
  async press(name: string | RegExp): Promise<void> {
    for (const item of await this.items()) {
      if (await HarnessPredicate.stringMatches(await this.nameOf(item), name)) {
        await item.click();
        return;
      }
    }
    throw new Error(`AveToolbarHarness: no item matches ${String(name)}.`);
  }

  private async nameOf(item: TestElement): Promise<string> {
    return (await item.getAttribute('aria-label')) ?? (await item.text()).trim();
  }
}
