import { HarnessPredicate } from '@angular/cdk/testing';
import { optionName } from './option-name';
import { AveSelectHarness, type AveSelectHarnessFilters } from './select-harness';

/**
 * Harness for `<ave-multiselect>` from `@avelune/ui/select`: a select whose options toggle, and whose list stays
 * open while they do.
 *
 * @alpha
 */
export class AveMultiselectHarness extends AveSelectHarness {
  /** Selector that finds kit multiselects. */
  static override hostSelector = 'ave-multiselect';

  /** Gets a predicate that matches multiselects by the given filters. */
  static override with(options: AveSelectHarnessFilters = {}): HarnessPredicate<AveMultiselectHarness> {
    return new HarnessPredicate(AveMultiselectHarness, options).addOption('text', options.text, (harness, text) =>
      HarnessPredicate.stringMatches(harness.getText(), text),
    );
  }

  /** Gets the labels of the chosen options, opening the list if needed. */
  async getChosen(): Promise<string[]> {
    const chosen: string[] = [];
    for (const option of await this.optionElements()) {
      if ((await option.getAttribute('aria-selected')) === 'true') chosen.push(await optionName(option));
    }
    return chosen;
  }

  /** Checks or unchecks the option with this label, as a click does; the list stays open. */
  async toggle(label: string | RegExp): Promise<void> {
    await this.choose(label);
  }
}
