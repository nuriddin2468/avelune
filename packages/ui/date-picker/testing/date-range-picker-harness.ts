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

  /** Gets the ids that name each input (`aria-labelledby`), the start input's first. */
  async getInputNames(): Promise<string[]> {
    const names = await Promise.all((await this.inputs()).map((input) => input.getAttribute('aria-labelledby')));
    return names.filter((name): name is string => name !== null);
  }
}
