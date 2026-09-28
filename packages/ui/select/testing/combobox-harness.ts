import { optionName } from './option-name';
import { ComponentHarness, HarnessPredicate, TestKey, type BaseHarnessFilters } from '@angular/cdk/testing';

/**
 * Filters for {@link AveComboboxHarness}.
 *
 * @alpha
 */
export interface AveComboboxHarnessFilters extends BaseHarnessFilters {
  /** Only match comboboxes whose input says this, or matches this pattern. */
  text?: string | RegExp;
}

/**
 * Harness for `<ave-combobox>` from `@avelune/ui/select`. Its list opens in the overlay at the end of the document,
 * so the options are found from the document root, through the input's `aria-controls`.
 *
 * @alpha
 */
export class AveComboboxHarness extends ComponentHarness {
  /** Selector that finds kit comboboxes. */
  static hostSelector = 'ave-combobox';

  private readonly input = this.locatorFor('.trigger');
  private readonly clearButton = this.locatorForOptional('.clear');

  /** Gets a predicate that matches comboboxes by the given filters. */
  static with(options: AveComboboxHarnessFilters = {}): HarnessPredicate<AveComboboxHarness> {
    return new HarnessPredicate(AveComboboxHarness, options).addOption('text', options.text, (harness, text) =>
      HarnessPredicate.stringMatches(harness.getText(), text),
    );
  }

  /** Gets what the input says: the chosen option's label, or what was typed. */
  async getText(): Promise<string> {
    return (await this.input()).getProperty<string>('value');
  }

  /** Replaces what the input says, as typing does, which opens the list of matches. */
  async type(text: string): Promise<void> {
    const input = await this.input();
    await input.clear();
    if (text !== '') await input.sendKeys(text);
  }

  /** Whether the list is open. */
  async isOpen(): Promise<boolean> {
    return (await (await this.input()).getAttribute('aria-expanded')) === 'true';
  }

  /** Presses a key in the input, which the list follows while it is open. */
  async press(key: 'down' | 'up' | 'enter' | 'escape'): Promise<void> {
    const keys = {
      down: TestKey.DOWN_ARROW,
      up: TestKey.UP_ARROW,
      enter: TestKey.ENTER,
      escape: TestKey.ESCAPE,
    } as const;
    await (await this.input()).sendKeys(keys[key]);
  }

  /** Gets the labels of the options the list shows. */
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

  /** Gets the message the list shows when nothing matches, or null. */
  async getEmptyMessage(): Promise<string | null> {
    const id = (await (await this.input()).getAttribute('aria-controls')) ?? '';
    const message = await this.documentRootLocatorFactory().locatorForOptional(`[id="${id}"] + .empty`)();
    return message === null ? null : (await message.text()).trim();
  }

  /**
   * Gets what the end of a server's list says (ADR 0056): `loading` while its spinner shows, `failed` after a request
   * failed, `empty` when nothing matched, or null.
   */
  async getListState(): Promise<'loading' | 'failed' | 'empty' | null> {
    const id = (await (await this.input()).getAttribute('aria-controls')) ?? '';
    const root = this.documentRootLocatorFactory();
    const popup = `.popup:has([id="${id}"])`;
    if ((await root.locatorForOptional(`${popup} .state.failed`)()) !== null) return 'failed';
    if ((await root.locatorForOptional(`${popup} .state`)()) !== null) return 'loading';
    if ((await root.locatorForOptional(`${popup} .empty`)()) !== null) return 'empty';
    return null;
  }

  /** Presses the list's Try again button, after a request failed. */
  async retry(): Promise<void> {
    const id = (await (await this.input()).getAttribute('aria-controls')) ?? '';
    const button = await this.documentRootLocatorFactory().locatorForOptional(
      `.popup:has([id="${id}"]) .failed button`,
    )();
    if (button === null) throw new Error('AveComboboxHarness: the list offers no retry.');
    await button.click();
  }

  /**
   * Moves to the list's last option with End, which scrolls it to its end, as a person scrolling does; a server's list
   * then asks for its next page.
   */
  async scrollToEnd(): Promise<void> {
    await (await this.input()).sendKeys(TestKey.END);
  }

  /** Chooses the shown option with this label, as a click does. */
  async choose(label: string | RegExp): Promise<void> {
    for (const option of await this.optionElements()) {
      if (await HarnessPredicate.stringMatches(await optionName(option), label)) {
        await option.click();
        return;
      }
    }
    throw new Error(`AveComboboxHarness: no shown option matches ${String(label)}.`);
  }

  /** Whether the clear button shows: a value that can be changed and is not required (ADR 0052). */
  async canClear(): Promise<boolean> {
    return (await this.clearButton()) !== null;
  }

  /** Takes the value away with the clear button, as a click does. */
  async clear(): Promise<void> {
    const button = await this.clearButton();
    if (button === null) throw new Error('AveComboboxHarness: the combobox shows no clear button.');
    await button.click();
  }

  /** Whether the combobox is disabled. */
  async isDisabled(): Promise<boolean> {
    return (await this.input()).getProperty<boolean>('disabled');
  }

  /** Whether the value can be read but not changed. */
  async isReadonly(): Promise<boolean> {
    return (await this.input()).getProperty<boolean>('readOnly');
  }

  /** Whether a choice is required (`aria-required`). */
  async isRequired(): Promise<boolean> {
    return (await (await this.input()).getAttribute('aria-required')) === 'true';
  }

  /** Whether the combobox shows as invalid (`aria-invalid="true"`). */
  async isInvalid(): Promise<boolean> {
    return (await (await this.input()).getAttribute('aria-invalid')) === 'true';
  }

  /** Focuses the input. */
  async focus(): Promise<void> {
    await (await this.input()).focus();
  }

  /** Blurs the input, which marks a form control touched and puts back text that matches no option. */
  async blur(): Promise<void> {
    await (await this.input()).blur();
  }

  /** The options of the open list, found from the document root by the id the input controls. */
  private async optionElements() {
    const id = (await (await this.input()).getAttribute('aria-controls')) ?? '';
    return this.documentRootLocatorFactory().locatorForAll(`[id="${id}"] [role="option"]`)();
  }
}
