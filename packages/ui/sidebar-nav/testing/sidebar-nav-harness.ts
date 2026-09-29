import { ComponentHarness, HarnessPredicate, type BaseHarnessFilters, type TestElement } from '@angular/cdk/testing';

/**
 * Filters for {@link AveSidebarNavHarness}.
 *
 * @alpha
 */
export interface AveSidebarNavHarnessFilters extends BaseHarnessFilters {
  /** Only match navigations whose landmark is named by this string, or matches this pattern. */
  label?: string | RegExp;
}

/**
 * Harness for `<ave-sidebar-nav>` from `@avelune/ui/sidebar-nav`: its links, the current page, and its groups.
 *
 * @alpha
 */
export class AveSidebarNavHarness extends ComponentHarness {
  /** Selector that finds kit sidebar navigations. */
  static hostSelector = 'ave-sidebar-nav';

  private readonly links = this.locatorForAll('a');
  private readonly groups = this.locatorForAll('button[aria-expanded]');

  /** Gets a predicate that matches navigations by the given filters. */
  static with(options: AveSidebarNavHarnessFilters = {}): HarnessPredicate<AveSidebarNavHarness> {
    return new HarnessPredicate(AveSidebarNavHarness, options).addOption('label', options.label, (harness, label) =>
      HarnessPredicate.stringMatches(harness.getLabel(), label),
    );
  }

  /** Gets the name of the navigation landmark. */
  async getLabel(): Promise<string | null> {
    return (await this.locatorFor('nav')()).getAttribute('aria-label');
  }

  /** Gets the words of every link on show, in order; the pages of closed groups are left out. */
  async getLinks(): Promise<string[]> {
    const shown: string[] = [];
    for (const link of await this.links()) {
      if ((await link.getProperty<number>('offsetHeight')) > 0) shown.push(await this.words(link));
    }
    return shown;
  }

  /** Gets the words of the current page's link, or `null` when no link is the current page. */
  async getCurrent(): Promise<string | null> {
    for (const link of await this.links()) {
      if ((await link.getAttribute('aria-current')) === 'page') return await this.words(link);
    }
    return null;
  }

  /** Gets the words of the links to pages above the current one. */
  async getAbove(): Promise<string[]> {
    const above: string[] = [];
    for (const link of await this.links()) {
      if ((await link.getAttribute('aria-current')) === 'true') above.push(await this.words(link));
    }
    return above;
  }

  /** Gets the count shown at the end of the page's link with this name ("12", "99+"), or an empty string without one. */
  async getCount(label: string | RegExp): Promise<string> {
    for (const link of await this.links()) {
      if (await HarnessPredicate.stringMatches(this.words(link), label)) {
        const count = await this.locatorForOptional(`a[href="${(await link.getAttribute('href')) ?? ''}"] ave-count`)();
        return count === null ? '' : (await count.text()).trim();
      }
    }
    throw new Error(`AveSidebarNavHarness: no link matches ${String(label)}.`);
  }

  /** Gets the names of the groups, in order. */
  async getGroups(): Promise<string[]> {
    return Promise.all((await this.groups()).map(async (group) => (await group.text()).trim()));
  }

  /** Whether the group with this name shows its pages. */
  async isGroupOpen(label: string | RegExp): Promise<boolean> {
    return (await (await this.group(label)).getAttribute('aria-expanded')) === 'true';
  }

  /** Opens or closes the group with this name, with a click on its button. */
  async toggleGroup(label: string | RegExp): Promise<void> {
    await (await this.group(label)).click();
  }

  /** Follows the first link whose words are this string or match this pattern. */
  async follow(label: string | RegExp): Promise<void> {
    for (const link of await this.links()) {
      if (await HarnessPredicate.stringMatches(await this.words(link), label)) {
        await link.click();
        return;
      }
    }
    throw new Error(`AveSidebarNavHarness: no link matches ${String(label)}.`);
  }

  /** A link's words, without its count. */
  private async words(link: TestElement): Promise<string> {
    return (await link.text({ exclude: 'ave-count' })).trim();
  }

  private async group(label: string | RegExp): Promise<TestElement> {
    for (const group of await this.groups()) {
      if (await HarnessPredicate.stringMatches((await group.text()).trim(), label)) return group;
    }
    throw new Error(`AveSidebarNavHarness: no group matches ${String(label)}.`);
  }
}
