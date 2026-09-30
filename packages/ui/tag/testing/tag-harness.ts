import { ComponentHarness, HarnessPredicate, type BaseHarnessFilters } from '@angular/cdk/testing';

/**
 * Filters for {@link AveTagHarness}.
 *
 * @beta
 */
export interface AveTagHarnessFilters extends BaseHarnessFilters {
  /** Only match tags whose words are this string, or match this pattern. */
  text?: string | RegExp;
}

/**
 * Harness for `<ave-tag>` from `@avelune/ui/tag`.
 *
 * @beta
 */
export class AveTagHarness extends ComponentHarness {
  /** Selector that finds kit tags. */
  static hostSelector = 'ave-tag';

  private readonly words = this.locatorFor('.words');
  private readonly button = this.locatorForOptional('.remove');

  /** Gets a predicate that matches tags by the given filters. */
  static with(options: AveTagHarnessFilters = {}): HarnessPredicate<AveTagHarness> {
    return new HarnessPredicate(AveTagHarness, options).addOption('text', options.text, (harness, text) =>
      HarnessPredicate.stringMatches(harness.getText(), text),
    );
  }

  /** Gets the tag's words, on one line. */
  async getText(): Promise<string> {
    return (await (await this.words()).text()).replace(/\s+/g, ' ').trim();
  }

  /** Whether the tag has a remove button. */
  async isRemovable(): Promise<boolean> {
    return (await this.button()) !== null;
  }

  /** Gets the remove button's name as screen readers hear it ("Убрать Ташкент"), or `null` without one. */
  async getRemoveLabel(): Promise<string | null> {
    const button = await this.button();
    if (button === null) return null;
    return `${(await button.text()).trim()} ${await this.getText()}`;
  }

  /** Presses the remove button; throws when the tag has none. */
  async remove(): Promise<void> {
    const button = await this.button();
    if (button === null) throw new Error('AveTagHarness: the tag has no remove button.');
    await button.click();
  }

  /** Whether the remove button has focus. */
  async isRemoveFocused(): Promise<boolean> {
    return (await (await this.button())?.isFocused()) ?? false;
  }
}
