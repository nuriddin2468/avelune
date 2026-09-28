import { HarnessPredicate } from '@angular/cdk/testing';
import { AveDatePickerHarness, type AveDatePickerHarnessFilters } from './date-picker-harness';

/**
 * Harness for `<ave-date-range-picker>` from `@avelune/ui/date-picker`: its two inputs and the calendar it opens. The
 * calendar's methods are the date field's.
 *
 * @alpha
 */
export class AveDateRangePickerHarness extends AveDatePickerHarness {
  /** Selector that finds kit date range fields. */
  static override hostSelector = 'ave-date-range-picker';

  private readonly inputs = this.locatorForAll('.trigger');
  private readonly end = this.locatorFor('.end .trigger');
  private readonly marked = this.locatorForAll('.popup [data-range]');
  private readonly presetOptions = this.locatorForAll('.popup .presets [role="option"]');

  /** Gets a predicate that matches date range fields by the given filters (`text` is the start input's). */
  static override with(options: AveDatePickerHarnessFilters = {}): HarnessPredicate<AveDateRangePickerHarness> {
    return new HarnessPredicate(AveDateRangePickerHarness, options).addOption('text', options.text, (harness, text) =>
      HarnessPredicate.stringMatches(harness.getText(), text),
    );
  }

  /** Gets what the end input says. */
  async getEndText(): Promise<string> {
    return (await this.end()).getProperty<string>('value');
  }

  /** Types into the end input and leaves the field. */
  async typeEnd(text: string): Promise<void> {
    const end = await this.end();
    await end.clear();
    if (text !== '') await end.sendKeys(text);
    await end.blur();
  }

  /** Gets the ISO dates the open calendar marks as the range: its start, the days between, its end. */
  async getRangeDates(): Promise<string[]> {
    const dates = await Promise.all((await this.marked()).map((day) => day.getAttribute('data-date')));
    return dates.filter((date): date is string => date !== null);
  }

  /** Gets the labels of the presets in the open calendar's panel (ADR 0054). */
  async getPresets(): Promise<string[]> {
    return Promise.all((await this.presetOptions()).map(async (option) => (await option.text()).trim()));
  }

  /** Gets the label of the preset whose period is the range chosen now, or null. */
  async getCheckedPreset(): Promise<string | null> {
    for (const option of await this.presetOptions()) {
      if ((await option.getAttribute('aria-selected')) === 'true') return (await option.text()).trim();
    }
    return null;
  }

  /** Gets the labels of the presets with no day within the bounds. */
  async getDisabledPresets(): Promise<string[]> {
    const disabled: string[] = [];
    for (const option of await this.presetOptions()) {
      if ((await option.getAttribute('aria-disabled')) === 'true') disabled.push((await option.text()).trim());
    }
    return disabled;
  }

  /** Chooses a preset by its label, as a click does: the range becomes its period and the calendar closes. */
  async choosePreset(label: string | RegExp): Promise<void> {
    for (const option of await this.presetOptions()) {
      if (await HarnessPredicate.stringMatches((await option.text()).trim(), label)) {
        await option.click();
        return;
      }
    }
    throw new Error(`AveDateRangePickerHarness: the calendar shows no preset ${String(label)}.`);
  }

  /** Gets the ids that name each input (`aria-labelledby`), the start input's first. */
  async getInputNames(): Promise<string[]> {
    const names = await Promise.all((await this.inputs()).map((input) => input.getAttribute('aria-labelledby')));
    return names.filter((name): name is string => name !== null);
  }
}
