import { ComponentHarness, HarnessPredicate, type BaseHarnessFilters } from '@angular/cdk/testing';

/**
 * Filters for {@link AveRadioHarness}.
 *
 * @alpha
 */
export interface AveRadioHarnessFilters extends BaseHarnessFilters {
  /** Only match radios whose label is this string, or matches this pattern. */
  label?: string | RegExp;
  /** Only match radios of this value. */
  value?: string;
  /** Only match checked, or unchecked, radios. */
  checked?: boolean;
}

/**
 * Harness for `input[type=radio][aveRadio]` from `@avelune/ui/radio`.
 *
 * @alpha
 */
export class AveRadioHarness extends ComponentHarness {
  /** Selector that finds kit radios. */
  static hostSelector = 'input[type=radio][aveRadio]';

  /** Gets a predicate that matches radios by the given filters. */
  static with(options: AveRadioHarnessFilters = {}): HarnessPredicate<AveRadioHarness> {
    return new HarnessPredicate(AveRadioHarness, options)
      .addOption('label', options.label, (harness, label) => HarnessPredicate.stringMatches(harness.getLabel(), label))
      .addOption('value', options.value, async (harness, value) => (await harness.getValue()) === value)
      .addOption('checked', options.checked, async (harness, checked) => (await harness.isChecked()) === checked);
  }

  /**
   * Gets what names the radio: its `aria-label`, or the text of its first label (the `label[aveChoice]` around it).
   * Reads the element's native `labels`, which the unit-test environment passes through.
   */
  async getLabel(): Promise<string> {
    const host = await this.host();
    const ariaLabel = await host.getAttribute('aria-label');
    if (ariaLabel !== null) return ariaLabel;
    const labels = await host.getProperty<ArrayLike<{ readonly textContent: string | null }> | null>('labels');
    return (labels?.[0]?.textContent ?? '').replace(/\s+/g, ' ').trim();
  }

  /** Gets the value the radio stands for. */
  async getValue(): Promise<string> {
    return (await this.host()).getProperty<string>('value');
  }

  /** Gets the name that makes radios one choice. */
  async getName(): Promise<string> {
    return (await this.host()).getProperty<string>('name');
  }

  /** Whether the radio is checked. */
  async isChecked(): Promise<boolean> {
    return (await this.host()).getProperty<boolean>('checked');
  }

  /** Whether the radio is disabled. */
  async isDisabled(): Promise<boolean> {
    return (await this.host()).getProperty<boolean>('disabled');
  }

  /** Whether a choice must be made, as the native `required` attribute says. */
  async isRequired(): Promise<boolean> {
    return (await this.host()).getProperty<boolean>('required');
  }

  /** Whether the radio shows as invalid (`aria-invalid="true"`). */
  async isInvalid(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-invalid')) === 'true';
  }

  /** Checks the radio, as a click does. */
  async check(): Promise<void> {
    await (await this.host()).click();
  }

  /** Focuses the radio. */
  async focus(): Promise<void> {
    await (await this.host()).focus();
  }

  /** Blurs the radio, which marks a form control touched. */
  async blur(): Promise<void> {
    await (await this.host()).blur();
  }
}
