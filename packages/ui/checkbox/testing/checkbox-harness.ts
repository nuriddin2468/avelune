import { ComponentHarness, HarnessPredicate, type BaseHarnessFilters } from '@angular/cdk/testing';

/**
 * Filters for {@link AveCheckboxHarness}.
 *
 * @beta
 */
export interface AveCheckboxHarnessFilters extends BaseHarnessFilters {
  /** Only match checkboxes whose label is this string, or matches this pattern. */
  label?: string | RegExp;
  /** Only match checked, or unchecked, checkboxes. */
  checked?: boolean;
}

/**
 * Harness for `input[type=checkbox][aveCheckbox]` from `@avelune/ui/checkbox`.
 *
 * @beta
 */
export class AveCheckboxHarness extends ComponentHarness {
  /** Selector that finds kit checkboxes. */
  static hostSelector = 'input[type=checkbox][aveCheckbox]';

  /** Gets a predicate that matches checkboxes by the given filters. */
  static with(options: AveCheckboxHarnessFilters = {}): HarnessPredicate<AveCheckboxHarness> {
    return new HarnessPredicate(AveCheckboxHarness, options)
      .addOption('label', options.label, (harness, label) => HarnessPredicate.stringMatches(harness.getLabel(), label))
      .addOption('checked', options.checked, async (harness, checked) => (await harness.isChecked()) === checked);
  }

  /**
   * Gets what names the checkbox: its `aria-label`, or the text of its first label (the `label[aveChoice]` around it).
   * Reads the element's native `labels`, which the unit-test environment passes through.
   */
  async getLabel(): Promise<string> {
    const host = await this.host();
    const ariaLabel = await host.getAttribute('aria-label');
    if (ariaLabel !== null) return ariaLabel;
    const labels = await host.getProperty<ArrayLike<{ readonly textContent: string | null }> | null>('labels');
    return (labels?.[0]?.textContent ?? '').replace(/\s+/g, ' ').trim();
  }

  /** Whether the checkbox is checked. */
  async isChecked(): Promise<boolean> {
    return (await this.host()).getProperty<boolean>('checked');
  }

  /** Whether the checkbox shows the mixed state. */
  async isIndeterminate(): Promise<boolean> {
    return (await this.host()).getProperty<boolean>('indeterminate');
  }

  /** Whether the checkbox is disabled. */
  async isDisabled(): Promise<boolean> {
    return (await this.host()).getProperty<boolean>('disabled');
  }

  /** Whether the checkbox must be checked, natively or through `aria-required`. */
  async isRequired(): Promise<boolean> {
    const host = await this.host();
    return (await host.getProperty<boolean>('required')) || (await host.getAttribute('aria-required')) === 'true';
  }

  /** Whether the checkbox shows as invalid (`aria-invalid="true"`). */
  async isInvalid(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-invalid')) === 'true';
  }

  /** Toggles the checkbox, as a click does. */
  async toggle(): Promise<void> {
    await (await this.host()).click();
  }

  /** Checks the checkbox, unless it already is. */
  async check(): Promise<void> {
    if (!(await this.isChecked())) await this.toggle();
  }

  /** Unchecks the checkbox, unless it already is. */
  async uncheck(): Promise<void> {
    if (await this.isChecked()) await this.toggle();
  }

  /** Blurs the checkbox, which marks a form control touched. */
  async blur(): Promise<void> {
    await (await this.host()).blur();
  }
}
