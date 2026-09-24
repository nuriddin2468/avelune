import { ComponentHarness, HarnessPredicate, type BaseHarnessFilters } from '@angular/cdk/testing';
import type { AveInputSize } from '@avelune/ui/input';

const SIZES: readonly AveInputSize[] = ['sm', 'md', 'lg'];

/**
 * Filters for {@link AveInputHarness}.
 *
 * @alpha
 */
export interface AveInputHarnessFilters extends BaseHarnessFilters {
  /** Only match inputs whose value is this string, or matches this pattern. */
  value?: string | RegExp;
  /** Only match inputs whose placeholder is this string, or matches this pattern. */
  placeholder?: string | RegExp;
}

/**
 * Harness for `input[aveInput]` from `@avelune/ui/input`.
 *
 * @alpha
 */
export class AveInputHarness extends ComponentHarness {
  /** Selector that finds kit inputs. */
  static hostSelector = 'input[aveInput]';

  /** Gets a predicate that matches inputs by the given filters. */
  static with(options: AveInputHarnessFilters = {}): HarnessPredicate<AveInputHarness> {
    return new HarnessPredicate(AveInputHarness, options)
      .addOption('value', options.value, (harness, value) => HarnessPredicate.stringMatches(harness.getValue(), value))
      .addOption('placeholder', options.placeholder, (harness, placeholder) =>
        HarnessPredicate.stringMatches(harness.getPlaceholder(), placeholder),
      );
  }

  /** Gets the value. */
  async getValue(): Promise<string> {
    return (await this.host()).getProperty<string>('value');
  }

  /** Replaces the value, as typing does, and leaves the input as it was focused. */
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
  async getSize(): Promise<AveInputSize> {
    const value = await (await this.host()).getAttribute('data-size');
    const size = SIZES.find((candidate) => candidate === value);
    if (size === undefined) throw new Error(`AveInputHarness: unexpected data-size "${String(value)}".`);
    return size;
  }

  /** Whether the input is disabled. */
  async isDisabled(): Promise<boolean> {
    return (await this.host()).getProperty<boolean>('disabled');
  }

  /** Whether the input is readonly. */
  async isReadonly(): Promise<boolean> {
    return (await this.host()).getProperty<boolean>('readOnly');
  }

  /** Whether the input is required. */
  async isRequired(): Promise<boolean> {
    return (await this.host()).getProperty<boolean>('required');
  }

  /** Whether the input shows as invalid (`aria-invalid="true"`). */
  async isInvalid(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-invalid')) === 'true';
  }

  /** Gets the ids that describe the input (`aria-describedby`). */
  async getDescribedBy(): Promise<string[]> {
    return ((await (await this.host()).getAttribute('aria-describedby')) ?? '').split(/\s+/).filter((id) => id !== '');
  }

  /** Focuses the input. */
  async focus(): Promise<void> {
    await (await this.host()).focus();
  }

  /** Blurs the input, which marks a form control touched. */
  async blur(): Promise<void> {
    await (await this.host()).blur();
  }

  /** Whether the input has focus. */
  async isFocused(): Promise<boolean> {
    return (await this.host()).isFocused();
  }
}
