import { HarnessPredicate, TestKey } from '@angular/cdk/testing';
import { AveTagHarness } from '@avelune/ui/tag/testing';
import { optionName } from './option-name';
import { AveSelectHarness, type AveSelectHarnessFilters } from './select-harness';

/**
 * Harness for `<ave-multiselect>` from `@avelune/ui/select`: a select whose options toggle, and whose list stays
 * open while they do.
 *
 * @beta
 */
export class AveMultiselectHarness extends AveSelectHarness {
  /** Selector that finds kit multiselects. */
  static override hostSelector = 'ave-multiselect';

  private readonly input = this.locatorForOptional('input.trigger');

  /** Gets a predicate that matches multiselects by the given filters. */
  static override with(options: AveSelectHarnessFilters = {}): HarnessPredicate<AveMultiselectHarness> {
    return new HarnessPredicate(AveMultiselectHarness, options).addOption('text', options.text, (harness, text) =>
      HarnessPredicate.stringMatches(harness.getText(), text),
    );
  }

  private readonly chips = this.locatorForAll(AveTagHarness);

  /**
   * Gets what the trigger says: the chosen labels or the placeholder (out of sight while tags show the labels); a
   * searchable one's input, the search it holds.
   */
  override async getText(): Promise<string> {
    const input = await this.input();
    return input === null ? super.getText() : input.getProperty<string>('value');
  }

  /** Gets the words of the tags that show the chosen values, in order (ADR 0081). */
  async getChips(): Promise<string[]> {
    return Promise.all((await this.chips()).map((chip) => chip.getText()));
  }

  /** Unchecks a chosen value with its tag's remove button, as a click does; throws when no tag has these words. */
  async removeChip(label: string | RegExp): Promise<void> {
    for (const chip of await this.chips()) {
      if (await HarnessPredicate.stringMatches(chip.getText(), label)) return chip.remove();
    }
    throw new Error(`AveMultiselectHarness: no tag matches ${String(label)}.`);
  }

  /** Whether the trigger is an input that searches the options (ADR 0057). */
  async isSearchable(): Promise<boolean> {
    return (await this.input()) !== null;
  }

  /** Types a search into a searchable multiselect's input, as a person does; the list opens on its matches. */
  async search(text: string): Promise<void> {
    const input = await this.input();
    if (input === null) throw new Error('AveMultiselectHarness: the multiselect has no search.');
    await input.clear();
    if (text !== '') await input.sendKeys(text);
  }

  /** Opens the list, as a click on the button does, or Down in a searchable one's input, unless it is open. */
  override async open(): Promise<void> {
    const input = await this.input();
    if (input === null) return super.open();
    if (!(await this.isOpen())) {
      await input.focus();
      await input.sendKeys(TestKey.DOWN_ARROW);
    }
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
