import { optionName } from './option-name';
import { ComponentHarness, HarnessPredicate, TestKey, type BaseHarnessFilters } from '@angular/cdk/testing';

/**
 * Filters for {@link AveSelectHarness}.
 *
 * @alpha
 */
export interface AveSelectHarnessFilters extends BaseHarnessFilters {
  /** Only match selects whose trigger says this (the chosen option, or the placeholder), or matches this pattern. */
  text?: string | RegExp;
}

/**
 * Harness for `<ave-select>` from `@avelune/ui/select`. Its list opens in the overlay at the end of the document,
 * so the options are found from the document root, through the trigger's `aria-controls`.
 *
 * @alpha
 */
export class AveSelectHarness extends ComponentHarness {
  /** Selector that finds kit selects. */
  static hostSelector = 'ave-select';

  private readonly trigger = this.locatorFor('.trigger');
  private readonly clearButton = this.locatorForOptional('.clear');

  /** Gets a predicate that matches selects by the given filters. */
  static with(options: AveSelectHarnessFilters = {}): HarnessPredicate<AveSelectHarness> {
    return new HarnessPredicate(AveSelectHarness, options).addOption('text', options.text, (harness, text) =>
      HarnessPredicate.stringMatches(harness.getText(), text),
    );
  }

  /** Gets what the trigger says: the chosen option's label, or the placeholder. */
  async getText(): Promise<string> {
    return (await (await this.trigger()).text()).trim();
  }

  /** Whether nothing is chosen, so the trigger shows the placeholder. */
  async isEmpty(): Promise<boolean> {
    return (await (await this.trigger()).getAttribute('data-empty')) !== null;
  }

  /** Whether the list is open. */
  async isOpen(): Promise<boolean> {
    return (await (await this.trigger()).getAttribute('aria-expanded')) === 'true';
  }

  /** Opens the list, as a click on the trigger does, unless it is open. */
  async open(): Promise<void> {
    if (!(await this.isOpen())) await (await this.trigger()).click();
  }

  /** Closes the list with Escape, unless it is closed. */
  async close(): Promise<void> {
    if (await this.isOpen()) await (await this.trigger()).sendKeys(TestKey.ESCAPE);
  }

  /**
   * Presses a key on the trigger, which the list follows while it is open; Delete and Backspace clear a select that
   * may be empty.
   */
  async press(key: 'down' | 'up' | 'home' | 'end' | 'enter' | 'escape' | 'delete' | 'backspace'): Promise<void> {
    const keys = {
      down: TestKey.DOWN_ARROW,
      up: TestKey.UP_ARROW,
      home: TestKey.HOME,
      end: TestKey.END,
      enter: TestKey.ENTER,
      escape: TestKey.ESCAPE,
      delete: TestKey.DELETE,
      backspace: TestKey.BACKSPACE,
    } as const;
    await (await this.trigger()).sendKeys(keys[key]);
  }

  /** Gets the labels of the options, opening the list if needed. */
  async getOptions(): Promise<string[]> {
    const options = await this.optionElements();
    return Promise.all(options.map((option) => optionName(option)));
  }

  /**
   * Gets what describes each option, in the order of the list: its description and its meta, joined by a space, or
   * null (ADR 0055).
   */
  async getOptionDescriptions(): Promise<(string | null)[]> {
    const root = this.documentRootLocatorFactory();
    return Promise.all(
      (await this.optionElements()).map(async (option) => {
        const ids = ((await option.getAttribute('aria-describedby')) ?? '').split(' ').filter((id) => id !== '');
        if (ids.length === 0) return null;
        const texts = await Promise.all(
          ids.map(async (id) => (await (await root.locatorFor(`[id="${id}"]`)()).text()).trim()),
        );
        return texts.join(' ');
      }),
    );
  }

  /** Gets the label of the option the keyboard is on, or null. */
  async getActiveOption(): Promise<string | null> {
    for (const option of await this.optionElements()) {
      if ((await option.getAttribute('data-active')) === 'true') return optionName(option);
    }
    return null;
  }

  /** Chooses the option with this label, as a click does, opening the list if needed. */
  async choose(label: string | RegExp): Promise<void> {
    for (const option of await this.optionElements()) {
      if (await HarnessPredicate.stringMatches(await optionName(option), label)) {
        await option.click();
        return;
      }
    }
    throw new Error(`AveSelectHarness: no option matches ${String(label)}.`);
  }

  /** Whether the clear button shows: a value that can be changed and is not required (ADR 0052). */
  async canClear(): Promise<boolean> {
    return (await this.clearButton()) !== null;
  }

  /** Takes the value away with the clear button, as a click does. */
  async clear(): Promise<void> {
    const button = await this.clearButton();
    if (button === null) throw new Error('AveSelectHarness: the select shows no clear button.');
    await button.click();
  }

  /** Whether the select is disabled. */
  async isDisabled(): Promise<boolean> {
    return (await this.trigger()).getProperty<boolean>('disabled');
  }

  /** Whether the value can be read but not changed. */
  async isReadonly(): Promise<boolean> {
    return (await (await this.trigger()).getAttribute('aria-readonly')) === 'true';
  }

  /** Whether a choice is required (`aria-required`). */
  async isRequired(): Promise<boolean> {
    return (await (await this.trigger()).getAttribute('aria-required')) === 'true';
  }

  /** Whether the select shows as invalid (`aria-invalid="true"`). */
  async isInvalid(): Promise<boolean> {
    return (await (await this.trigger()).getAttribute('aria-invalid')) === 'true';
  }

  /** Gets the ids that describe the select (`aria-describedby`). */
  async getDescribedBy(): Promise<string[]> {
    return ((await (await this.trigger()).getAttribute('aria-describedby')) ?? '')
      .split(/\s+/)
      .filter((id) => id !== '');
  }

  /** Focuses the trigger. */
  async focus(): Promise<void> {
    await (await this.trigger()).focus();
  }

  /** Blurs the trigger, which marks a form control touched. */
  async blur(): Promise<void> {
    await (await this.trigger()).blur();
  }

  /** The options of the open list, found from the document root by the id the trigger controls. */
  protected async optionElements() {
    await this.open();
    const id = (await (await this.trigger()).getAttribute('aria-controls')) ?? '';
    return this.documentRootLocatorFactory().locatorForAll(`[id="${id}"] [role="option"]`)();
  }
}
