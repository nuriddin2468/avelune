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
  private readonly clearButton = this.locatorForOptional('.clear');
  private readonly title = this.locatorForOptional('.popup .title');
  private readonly days = this.locatorForAll('.popup [data-date]');
  private readonly months = this.locatorForAll('.popup [data-month]');
  private readonly years = this.locatorForAll('.popup [data-year]');
  private readonly cells = this.locatorForAll('.popup [data-date], .popup [data-month], .popup [data-year]');
  private readonly calendar = this.locatorForOptional('.popup ave-calendar');
  private readonly headingButton = this.locatorForOptional('.popup button.title');
  private readonly previous = this.locatorFor('.popup .header > button:first-child');
  private readonly next = this.locatorFor('.popup .header > button:last-child');

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

  /** Gets the heading of the open calendar: the month and year among the days, the year among the months, the years among the years. */
  async getMonth(): Promise<string | null> {
    const title = await this.title();
    return title === null ? null : (await title.text()).trim();
  }

  /** Gets what the open calendar shows: the days of a month, the months of a year, or twelve years; null when closed. */
  async getView(): Promise<'days' | 'months' | 'years' | null> {
    const calendar = await this.calendar();
    if (calendar === null) return null;
    const view = await calendar.getAttribute('data-view');
    return view === 'months' || view === 'years' ? view : 'days';
  }

  /** Presses the calendar's heading: the days show the months of their year, the months twelve years (ADR 0053). */
  async clickHeading(): Promise<void> {
    const heading = await this.headingButton();
    if (heading === null) throw new Error('AveDatePickerHarness: the calendar has no heading to press.');
    await heading.click();
  }

  /** Gets the names of the months shown. */
  async getMonths(): Promise<string[]> {
    return Promise.all((await this.months()).map(async (month) => (await month.text()).trim()));
  }

  /** Gets the years shown. */
  async getYears(): Promise<number[]> {
    return Promise.all((await this.years()).map(async (year) => Number((await year.text()).trim())));
  }

  /** Chooses a month by its name, as a click does: the calendar shows its days. */
  async chooseMonth(name: string | RegExp): Promise<void> {
    for (const month of await this.months()) {
      if (await HarnessPredicate.stringMatches((await month.text()).trim(), name)) {
        await month.click();
        return;
      }
    }
    throw new Error(`AveDatePickerHarness: the calendar shows no month ${String(name)}.`);
  }

  /** Chooses a year, as a click does: the calendar shows its months. */
  async chooseYear(year: number): Promise<void> {
    for (const cell of await this.years()) {
      if ((await cell.text()).trim() === String(year)) {
        await cell.click();
        return;
      }
    }
    throw new Error(`AveDatePickerHarness: the calendar shows no year ${String(year)}.`);
  }

  /** Gets the month that has focus among the months (`2026-09`), or null. */
  async getFocusedMonth(): Promise<string | null> {
    for (const month of await this.months()) {
      if (await month.isFocused()) return month.getAttribute('data-month');
    }
    return null;
  }

  /** Gets the year that has focus among the years, or null. */
  async getFocusedYear(): Promise<number | null> {
    for (const year of await this.years()) {
      if (await year.isFocused()) return Number(await year.getAttribute('data-year'));
    }
    return null;
  }

  /** Gets the months (`2026-09`) and years (`2026`) shown that cannot be chosen: outside the bounds. */
  async getDisabledPeriods(): Promise<string[]> {
    const periods: string[] = [];
    for (const cell of [...(await this.months()), ...(await this.years())]) {
      if ((await cell.getAttribute('aria-disabled')) !== 'true') continue;
      periods.push((await cell.getAttribute('data-month')) ?? (await cell.getAttribute('data-year')) ?? '');
    }
    return periods;
  }

  /** Presses the button before the heading: the month, the year or the twelve years before. */
  async previousMonth(): Promise<void> {
    await (await this.previous()).click();
  }

  /** Presses the button after the heading: the month, the year or the twelve years after. */
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

  /** Presses a key on the day, month or year that has focus in the calendar. */
  async press(key: AveCalendarKey): Promise<void> {
    for (const cell of await this.cells()) {
      if (await cell.isFocused()) {
        await cell.sendKeys(keys[key]);
        return;
      }
    }
    throw new Error('AveDatePickerHarness: no day, month or year of the calendar has focus.');
  }

  /** Whether the clear button shows: a date that can be changed and is not required (ADR 0052). */
  async canClear(): Promise<boolean> {
    return (await this.clearButton()) !== null;
  }

  /** Takes the value away with the clear button, as a click does. */
  async clear(): Promise<void> {
    const button = await this.clearButton();
    if (button === null) throw new Error('AveDatePickerHarness: the field shows no clear button.');
    await button.click();
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
