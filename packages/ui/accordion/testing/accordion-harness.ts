import { ComponentHarness, HarnessPredicate, type BaseHarnessFilters, type TestElement } from '@angular/cdk/testing';

/**
 * Filters for {@link AveAccordionHarness}.
 *
 * @beta
 */
export interface AveAccordionHarnessFilters extends BaseHarnessFilters {
  /** Only match accordions that hold an item with this heading, or one that matches this pattern. */
  heading?: string | RegExp;
}

/**
 * Harness for `<ave-accordion>` from `@avelune/ui/accordion`: its headings, which are open, and their panels.
 *
 * @beta
 */
export class AveAccordionHarness extends ComponentHarness {
  /** Selector that finds kit accordions. */
  static hostSelector = 'ave-accordion';

  private readonly triggers = this.locatorForAll('.trigger');

  /** Gets a predicate that matches accordions by the given filters. */
  static with(options: AveAccordionHarnessFilters = {}): HarnessPredicate<AveAccordionHarness> {
    return new HarnessPredicate(AveAccordionHarness, options).addOption(
      'heading',
      options.heading,
      async (harness, heading) => {
        for (const words of await harness.getHeadings()) {
          if (await HarnessPredicate.stringMatches(words, heading)) return true;
        }
        return false;
      },
    );
  }

  /** Gets the items' headings, in order. */
  async getHeadings(): Promise<string[]> {
    return Promise.all((await this.triggers()).map(async (trigger) => (await trigger.text()).trim()));
  }

  /** Gets the headings of the open items, in order. */
  async getExpanded(): Promise<string[]> {
    const open: string[] = [];
    for (const trigger of await this.triggers()) {
      if ((await trigger.getAttribute('aria-expanded')) === 'true') open.push((await trigger.text()).trim());
    }
    return open;
  }

  /** Whether the item with this heading is open. */
  async isExpanded(heading: string | RegExp): Promise<boolean> {
    return (await (await this.trigger(heading)).getAttribute('aria-expanded')) === 'true';
  }

  /** Whether the item with this heading is disabled. */
  async isDisabled(heading: string | RegExp): Promise<boolean> {
    return (await (await this.trigger(heading)).getAttribute('aria-disabled')) === 'true';
  }

  /** Opens or closes the item with this heading, with a click on its heading. */
  async toggle(heading: string | RegExp): Promise<void> {
    await (await this.trigger(heading)).click();
  }

  /** Gets the text of the open item with this heading's panel, or an empty string while it is closed. */
  async getPanelText(heading: string | RegExp): Promise<string> {
    const trigger = await this.trigger(heading);
    if ((await trigger.getAttribute('aria-expanded')) !== 'true') return '';
    const id = await trigger.getAttribute('aria-controls');
    const panel = await this.locatorFor(`[id="${id ?? ''}"]`)();
    return (await panel.text()).replace(/\s+/g, ' ').trim();
  }

  private async trigger(heading: string | RegExp): Promise<TestElement> {
    for (const trigger of await this.triggers()) {
      if (await HarnessPredicate.stringMatches((await trigger.text()).trim(), heading)) return trigger;
    }
    throw new Error(`AveAccordionHarness: no item has the heading ${String(heading)}.`);
  }
}
