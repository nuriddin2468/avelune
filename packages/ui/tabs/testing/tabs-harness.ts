import { ComponentHarness, HarnessPredicate, type BaseHarnessFilters, type TestElement } from '@angular/cdk/testing';

/**
 * Filters for {@link AveTabsHarness}.
 *
 * @alpha
 */
export interface AveTabsHarnessFilters extends BaseHarnessFilters {
  /** Only match tabs whose list is named by this string, or matches this pattern. */
  label?: string | RegExp;
}

/**
 * Harness for `<ave-tabs>` from `@avelune/ui/tabs`: its tabs, the chosen one, and the panel it shows.
 *
 * @alpha
 */
export class AveTabsHarness extends ComponentHarness {
  /** Selector that finds kit tabs. */
  static hostSelector = 'ave-tabs';

  private readonly list = this.locatorFor('[role="tablist"]');
  private readonly tabs = this.locatorForAll('[role="tab"]');

  /** Gets a predicate that matches tabs by the given filters. */
  static with(options: AveTabsHarnessFilters = {}): HarnessPredicate<AveTabsHarness> {
    return new HarnessPredicate(AveTabsHarness, options).addOption('label', options.label, (harness, label) =>
      HarnessPredicate.stringMatches(harness.getLabel(), label),
    );
  }

  /** Gets the name of the list of tabs. */
  async getLabel(): Promise<string | null> {
    return (await this.list()).getAttribute('aria-label');
  }

  /** Gets the words of every tab, in order. */
  async getTabs(): Promise<string[]> {
    return Promise.all((await this.tabs()).map(async (tab) => (await tab.text()).trim()));
  }

  /** Gets the words of the chosen tab, or `null` when none is chosen. */
  async getSelected(): Promise<string | null> {
    for (const tab of await this.tabs()) {
      if ((await tab.getAttribute('aria-selected')) === 'true') return (await tab.text()).trim();
    }
    return null;
  }

  /** Gets the words of the tabs that cannot be chosen. */
  async getDisabled(): Promise<string[]> {
    const disabled: string[] = [];
    for (const tab of await this.tabs()) {
      if ((await tab.getAttribute('aria-disabled')) === 'true') disabled.push((await tab.text()).trim());
    }
    return disabled;
  }

  /** Chooses the first tab whose words are this string or match this pattern, with a click. */
  async select(label: string | RegExp): Promise<void> {
    await (await this.tab(label)).click();
  }

  /** Gets the text of the panel the chosen tab shows, as one line. */
  async getPanelText(): Promise<string> {
    const panel = await this.locatorFor('[role="tabpanel"]:not([inert])')();
    return (await panel.text()).replace(/\s+/g, ' ').trim();
  }

  private async tab(label: string | RegExp): Promise<TestElement> {
    for (const tab of await this.tabs()) {
      if (await HarnessPredicate.stringMatches((await tab.text()).trim(), label)) return tab;
    }
    throw new Error(`AveTabsHarness: no tab matches ${String(label)}.`);
  }
}
