import { ComponentHarness, HarnessPredicate, type BaseHarnessFilters } from '@angular/cdk/testing';
import type { AveTextareaSize } from '@avelune/ui/textarea';

const SIZES: readonly AveTextareaSize[] = ['sm', 'md', 'lg'];

/**
 * Filters for {@link AveTextareaHarness}.
 *
 * @alpha
 */
export interface AveTextareaHarnessFilters extends BaseHarnessFilters {
  /** Only match textareas whose value is this string, or matches this pattern. */
  value?: string | RegExp;
  /** Only match textareas whose placeholder is this string, or matches this pattern. */
  placeholder?: string | RegExp;
}

/**
 * Harness for `textarea[aveTextarea]` from `@avelune/ui/textarea`.
 *
 * @alpha
 */
export class AveTextareaHarness extends ComponentHarness {
  /** Selector that finds kit textareas. */
  static hostSelector = 'textarea[aveTextarea]';

  /** Gets a predicate that matches textareas by the given filters. */
  static with(options: AveTextareaHarnessFilters = {}): HarnessPredicate<AveTextareaHarness> {
    return new HarnessPredicate(AveTextareaHarness, options)
      .addOption('value', options.value, (harness, value) => HarnessPredicate.stringMatches(harness.getValue(), value))
      .addOption('placeholder', options.placeholder, (harness, placeholder) =>
        HarnessPredicate.stringMatches(harness.getPlaceholder(), placeholder),
      );
  }

  /** Gets the value. */
  async getValue(): Promise<string> {
    return (await this.host()).getProperty<string>('value');
  }

  /** Replaces the value, as typing does; `\n` types a line break. */
  async setValue(value: string): Promise<void> {
    const host = await this.host();
    await host.clear();
    if (value !== '') await host.sendKeys(value);
    await host.dispatchEvent('change');
  }

  /** Gets the placeholder. */
  async getPlaceholder(): Promise<string> {
    return (await this.host()).getProperty<string>('placeholder');
  }

  /** Gets the size. */
  async getSize(): Promise<AveTextareaSize> {
    const value = await (await this.host()).getAttribute('data-size');
    const size = SIZES.find((candidate) => candidate === value);
    if (size === undefined) throw new Error(`AveTextareaHarness: unexpected data-size "${String(value)}".`);
    return size;
  }

  /** Gets the number of lines it shows before its text scrolls. */
  async getRows(): Promise<number> {
    return (await this.host()).getProperty<number>('rows');
  }

  /** Whether the textarea is disabled. */
  async isDisabled(): Promise<boolean> {
    return (await this.host()).getProperty<boolean>('disabled');
  }

  /** Whether the textarea is readonly. */
  async isReadonly(): Promise<boolean> {
    return (await this.host()).getProperty<boolean>('readOnly');
  }

  /** Whether the textarea is required. */
  async isRequired(): Promise<boolean> {
    return (await this.host()).getProperty<boolean>('required');
  }

  /** Whether the textarea shows as invalid (`aria-invalid="true"`). */
  async isInvalid(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-invalid')) === 'true';
  }

  /** Gets the ids that describe the textarea (`aria-describedby`). */
  async getDescribedBy(): Promise<string[]> {
    return ((await (await this.host()).getAttribute('aria-describedby')) ?? '').split(/\s+/).filter((id) => id !== '');
  }

  /** Focuses the textarea. */
  async focus(): Promise<void> {
    await (await this.host()).focus();
  }

  /** Blurs the textarea, which marks a form control touched. */
  async blur(): Promise<void> {
    await (await this.host()).blur();
  }

  /** Whether the textarea has focus. */
  async isFocused(): Promise<boolean> {
    return (await this.host()).isFocused();
  }
}
