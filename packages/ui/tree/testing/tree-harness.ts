import { ComponentHarness, HarnessPredicate, type BaseHarnessFilters, type TestElement } from '@angular/cdk/testing';

/**
 * Filters for {@link AveTreeHarness}.
 *
 * @alpha
 */
export interface AveTreeHarnessFilters extends BaseHarnessFilters {
  /** Only match trees named by this string, or by a name that matches this pattern. */
  label?: string | RegExp;
}

/**
 * A row of a tree as the harness reads it: its words and its level, 1 at the top.
 *
 * @alpha
 */
export interface AveTreeRow {
  /** The row's words. */
  readonly label: string;
  /** Its level: 1 at the top. */
  readonly level: number;
}

/**
 * Harness for `<ave-tree>` from `@avelune/ui/tree`: its shown rows, the chosen one, and opening and closing nodes.
 *
 * @alpha
 */
export class AveTreeHarness extends ComponentHarness {
  /** Selector that finds kit trees. */
  static hostSelector = 'ave-tree';

  private readonly rows = this.locatorForAll('[role="treeitem"]');

  /** Gets a predicate that matches trees by the given filters. */
  static with(options: AveTreeHarnessFilters = {}): HarnessPredicate<AveTreeHarness> {
    return new HarnessPredicate(AveTreeHarness, options).addOption('label', options.label, (harness, label) =>
      HarnessPredicate.stringMatches(harness.getLabel(), label),
    );
  }

  /** Gets the tree's name. */
  async getLabel(): Promise<string | null> {
    return (await this.locatorFor('[role="tree"]')()).getAttribute('aria-label');
  }

  /** Gets the rows on show, in order, with their levels; the rows of closed nodes are not drawn. */
  async getRows(): Promise<AveTreeRow[]> {
    return Promise.all(
      (await this.rows()).map(async (row) => ({
        label: (await row.text()).trim(),
        level: Number(await row.getAttribute('aria-level')),
      })),
    );
  }

  /** Gets the chosen row's words, or `null` while no row is chosen. */
  async getSelected(): Promise<string | null> {
    for (const row of await this.rows()) {
      if ((await row.getAttribute('aria-selected')) === 'true') return (await row.text()).trim();
    }
    return null;
  }

  /** Chooses the row with these words, with a click, which also opens or closes a node with children. */
  async select(label: string | RegExp): Promise<void> {
    await (await this.row(label)).click();
  }

  /** Whether the row with these words is open. */
  async isExpanded(label: string | RegExp): Promise<boolean> {
    return (await (await this.row(label)).getAttribute('aria-expanded')) === 'true';
  }

  /** Opens the row with these words from the keyboard, as a person does: the arrows to it, then Right. */
  async expand(label: string | RegExp): Promise<void> {
    if (!(await this.isExpanded(label))) await this.keyTo(label, 'ArrowRight');
  }

  /** Closes the row with these words from the keyboard: the arrows to it, then Left. */
  async collapse(label: string | RegExp): Promise<void> {
    if (await this.isExpanded(label)) await this.keyTo(label, 'ArrowLeft');
  }

  /**
   * Moves from the tree's active row to the row with these words with the arrows, then presses the key, as a person
   * does: key events on the tree, which handles the keys of its rows.
   */
  private async keyTo(label: string | RegExp, key: 'ArrowRight' | 'ArrowLeft'): Promise<void> {
    const rows = await this.rows();
    let target = -1;
    let active = 0;
    for (const [index, row] of rows.entries()) {
      if (target === -1 && (await HarnessPredicate.stringMatches((await row.text()).trim(), label))) target = index;
      if ((await row.getAttribute('tabindex')) === '0') active = index;
    }
    const tree = await this.locatorFor('[role="tree"]')();
    const arrow = target > active ? 'ArrowDown' : 'ArrowUp';
    for (let step = 0; step < Math.abs(target - active); step++) await tree.dispatchEvent('keydown', { key: arrow });
    await tree.dispatchEvent('keydown', { key });
  }

  private async row(label: string | RegExp): Promise<TestElement> {
    for (const row of await this.rows()) {
      if (await HarnessPredicate.stringMatches((await row.text()).trim(), label)) return row;
    }
    throw new Error(`AveTreeHarness: no row matches ${String(label)}.`);
  }
}
