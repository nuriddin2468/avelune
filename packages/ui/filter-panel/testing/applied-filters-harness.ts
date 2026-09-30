import { ComponentHarness } from '@angular/cdk/testing';
import { AveTagHarness } from '@avelune/ui/tag/testing';

/**
 * Harness for `<ave-applied-filters>` from `@avelune/ui/filter-panel`.
 *
 * @alpha
 */
export class AveAppliedFiltersHarness extends ComponentHarness {
  /** Selector that finds kit applied filters. */
  static hostSelector = 'ave-applied-filters';

  private readonly list = this.locatorForOptional('ul');
  private readonly tags = this.locatorForAll(AveTagHarness);
  private readonly clearButton = this.locatorForOptional('ul + button');

  /** Gets the name of the list of tags, or `null` while no filter is applied. */
  async getLabel(): Promise<string | null> {
    const list = await this.list();
    return list === null ? null : list.getAttribute('aria-label');
  }

  /** Gets the applied filters' words, in order. */
  async getFilters(): Promise<string[]> {
    return Promise.all((await this.tags()).map((tag) => tag.getText()));
  }

  /** Presses the remove button of the filter with these words. */
  async remove(label: string | RegExp): Promise<void> {
    for (const tag of await this.tags()) {
      const text = await tag.getText();
      if (typeof label === 'string' ? text === label : label.test(text)) {
        await tag.remove();
        return;
      }
    }
    throw new Error(`No applied filter "${String(label)}".`);
  }

  /** Presses "Сбросить фильтры". */
  async clear(): Promise<void> {
    const button = await this.clearButton();
    if (button === null) throw new Error('No filter is applied.');
    await button.click();
  }
}
