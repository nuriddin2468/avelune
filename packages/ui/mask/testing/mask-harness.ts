import { ComponentHarness, HarnessPredicate, type BaseHarnessFilters } from '@angular/cdk/testing';

/**
 * Filters for {@link AveMaskHarness}.
 *
 * @beta
 */
export interface AveMaskHarnessFilters extends BaseHarnessFilters {
  /** Only match masked inputs that show this text, or text that matches this pattern. */
  shown?: string | RegExp;
}

/**
 * Harness for `input[aveInput][aveMask]` from `@avelune/ui/mask`. It reads what the input shows; the form's value is
 * the application's to read.
 *
 * @beta
 */
export class AveMaskHarness extends ComponentHarness {
  /** Selector that finds masked kit inputs, the mask bound or written. */
  static hostSelector = 'input[aveInput][data-ave-mask]';

  /** Gets a predicate that matches masked inputs by the given filters. */
  static with(options: AveMaskHarnessFilters = {}): HarnessPredicate<AveMaskHarness> {
    return new HarnessPredicate(AveMaskHarness, options).addOption('shown', options.shown, (harness, shown) =>
      HarnessPredicate.stringMatches(harness.getShown(), shown),
    );
  }

  /** Gets the text the input shows, grouped by its mask. */
  async getShown(): Promise<string> {
    return (await this.host()).getProperty<string>('value');
  }

  /** Gets what the input is masked by: a preset's name (`phone`), `pattern` or `regexp`. */
  async getMask(): Promise<string | null> {
    return (await this.host()).getAttribute('data-ave-mask');
  }

  /** Gets the keyboard the mask asks a phone for (`inputmode`). */
  async getInputMode(): Promise<string | null> {
    return (await this.host()).getAttribute('inputmode');
  }

  /** Focuses the input. */
  async focus(): Promise<void> {
    await (await this.host()).focus();
  }

  /** Blurs the input, which marks a form control touched. */
  async blur(): Promise<void> {
    await (await this.host()).blur();
  }

  /** Whether the input is disabled. */
  async isDisabled(): Promise<boolean> {
    return (await this.host()).getProperty<boolean>('disabled');
  }
}
