import { ComponentHarness, HarnessPredicate, TestKey, type BaseHarnessFilters } from '@angular/cdk/testing';

/**
 * Filters for {@link AveDatePickerHarness}.
 *
 * @alpha
 */
export interface AveDatePickerHarnessFilters extends BaseHarnessFilters {
  /** Only match date fields whose input says this, or matches this pattern. */
  text?: string | RegExp;
}

/**
 * A key a calendar follows.
 *
 * @alpha
 */
export type AveCalendarKey =
  'left' | 'right' | 'up' | 'down' | 'home' | 'end' | 'pageUp' | 'pageDown' | 'enter' | 'escape';

const keys: Readonly<Record<AveCalendarKey, TestKey>> = {
  left: TestKey.LEFT_ARROW,
  right: TestKey.RIGHT_ARROW,
  up: TestKey.UP_ARROW,
  down: TestKey.DOWN_ARROW,
  home: TestKey.HOME,
  end: TestKey.END,
  pageUp: TestKey.PAGE_UP,
  pageDown: TestKey.PAGE_DOWN,
  enter: TestKey.ENTER,
  escape: TestKey.ESCAPE,
};

/**
 * Harness for `<ave-date-picker>` from `@avelune/ui/date-picker`: its input, its button and the calendar it opens
 * (in the page, inside the field, while it is open).
 *
 * @alpha
 */
export class AveDatePickerHarness extends ComponentHarness {
  /** Selector that finds kit date fields. */
  static hostSelector = 'ave-date-picker';

  protected readonly input = this.locatorFor('.trigger');
  protected readonly opener = this.locatorFor('.open');
  private readonly title = this.locatorForOptional('.popup .title');
  private readonly days = this.locatorForAll('.popup [data-date]');
  private readonly previous = this.locatorFor('.popup .header button:first-child');
  private readonly next = this.locatorFor('.popup .header button:last-child');

  /** Gets a predicate that matches date fields by the given filters. */
  static with(options: AveDatePickerHarnessFilters = {}): HarnessPredicate<AveDatePickerHarness> {
    return new HarnessPredicate(AveDatePickerHarness, options).addOption('text', options.text, (harness, text) =>
      HarnessPredicate.stringMatches(harness.getText(), text),
    );
  }

  /** Gets what the input says: the date in the locale's order, or what was typed. */
  async getText(): Promise<string> {
    return (await this.input()).getProperty<string>('value');
  }

  /** Types a date and leaves the field, as a person does; the field reads it then. */
  async type(text: string): Promise<void> {
    const input = await this.input();
    await input.clear();
    if (text !== '') await input.sendKeys(text);
    await input.blur();
  }

  /** Gets the placeholder, the locale's order of day, month and year. */
  async getPlaceholder(): Promise<string> {
    return (await this.input()).getProperty<string>('placeholder');
  }

  /** Whether the calendar is open. */
  async isOpen(): Promise<boolean> {
    return (await (await this.opener()).getAttribute('aria-expanded')) === 'true';
  }

  /** Opens the calendar with its button, unless it is open. */
  async open(): Promise<void> {
    if (!(await this.isOpen())) await (await this.opener()).click();
  }

  /** Gets the heading of the open calendar: the month and year shown. */
  async getMonth(): Promise<string | null> {
    const title = await this.title();
    return title === null ? null : (await title.text()).trim();
  }

  /** Shows the month before. */
  async previousMonth(): Promise<void> {
    await (await this.previous()).click();
  }

  /** Shows the month after. */
  async nextMonth(): Promise<void> {
    await (await this.next()).click();
  }

  /** Chooses a day of the month shown, as a click does. */
  async chooseDay(day: number): Promise<void> {
    for (const cell of await this.days()) {
      if ((await cell.text()).trim() === String(day)) {
        await cell.click();
        return;
      }
    }
    throw new Error(`AveDatePickerHarness: the calendar shows no day ${String(day)}.`);
  }

  /** Gets the ISO date of the day that has focus in the calendar, or null. */
  async getFocusedDate(): Promise<string | null> {
    for (const cell of await this.days()) {
      if (await cell.isFocused()) return cell.getAttribute('data-date');
    }
    return null;
  }

  /** Gets the ISO dates the calendar marks as chosen. */
  async getChosenDates(): Promise<string[]> {
    return this.datesWhere('aria-selected');
  }

  /** Gets the ISO dates the calendar will not let people choose. */
  async getDisabledDates(): Promise<string[]> {
    return this.datesWhere('aria-disabled');
  }

  /** Presses a key on the day that has focus in the calendar. */
  async press(key: AveCalendarKey): Promise<void> {
    for (const cell of await this.days()) {
      if (await cell.isFocused()) {
        await cell.sendKeys(keys[key]);
        return;
      }
    }
    throw new Error('AveDatePickerHarness: no day of the calendar has focus.');
  }

  /** Whether the field is disabled. */
  async isDisabled(): Promise<boolean> {
    return (await this.input()).getProperty<boolean>('disabled');
  }

  /** Whether the date can be read but not changed. */
  async isReadonly(): Promise<boolean> {
    return (await this.input()).getProperty<boolean>('readOnly');
  }

  /** Whether a date is required (`aria-required`). */
  async isRequired(): Promise<boolean> {
    return (await (await this.input()).getAttribute('aria-required')) === 'true';
  }

  /** Whether the field shows as invalid (`aria-invalid="true"`). */
  async isInvalid(): Promise<boolean> {
    return (await (await this.input()).getAttribute('aria-invalid')) === 'true';
  }

  /** Focuses the input. */
  async focus(): Promise<void> {
    await (await this.input()).focus();
  }

  /** The ISO dates of the days whose state attribute is `true`. */
  private async datesWhere(attribute: 'aria-selected' | 'aria-disabled'): Promise<string[]> {
    const days = await this.days();
    const marked = await Promise.all(days.map(async (day) => (await day.getAttribute(attribute)) === 'true'));
    const dates = await Promise.all(days.map((day) => day.getAttribute('data-date')));
    return dates.filter((date, index): date is string => date !== null && marked[index] === true);
  }

  /** Blurs the input, which reads what was typed and marks a form control touched. */
  async blur(): Promise<void> {
    await (await this.input()).blur();
  }
}
