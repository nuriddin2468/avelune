import { ContentContainerComponentHarness, HarnessPredicate, type BaseHarnessFilters } from '@angular/cdk/testing';

/**
 * Filters for {@link AveFormFieldHarness}.
 *
 * @alpha
 */
export interface AveFormFieldHarnessFilters extends BaseHarnessFilters {
  /** Only match fields whose label is this string, or matches this pattern. */
  label?: string | RegExp;
}

/**
 * Harness for `<ave-form-field>` from `@avelune/ui/form-field`. Get the control inside it with the control's own
 * harness, loaded from this one: `field.getHarness(AveInputHarness)`.
 *
 * @alpha
 */
export class AveFormFieldHarness extends ContentContainerComponentHarness {
  /** Selector that finds form fields. */
  static hostSelector = 'ave-form-field';

  private readonly labelElement = this.locatorFor('.label');
  private readonly marker = this.locatorForOptional('.required');
  private readonly hint = this.locatorForOptional('[aveHint]');
  private readonly error = this.locatorForOptional('.error [aveError]');

  /** Gets a predicate that matches fields by the given filters. */
  static with(options: AveFormFieldHarnessFilters = {}): HarnessPredicate<AveFormFieldHarness> {
    return new HarnessPredicate(AveFormFieldHarness, options).addOption('label', options.label, (harness, label) =>
      HarnessPredicate.stringMatches(harness.getLabel(), label),
    );
  }

  /** Gets the label, without the required marker. */
  async getLabel(): Promise<string> {
    const text = await (await this.labelElement()).text();
    return text.replace(/\s*\*\s*$/, '').trim();
  }

  /** Gets the id of the control the label names. */
  async getControlId(): Promise<string | null> {
    return (await this.labelElement()).getAttribute('for');
  }

  /** Whether the field shows the required marker. */
  async isRequired(): Promise<boolean> {
    return (await this.marker()) !== null;
  }

  /** Gets the hint, or null without one. */
  async getHint(): Promise<string | null> {
    const hint = await this.hint();
    return hint === null ? null : (await hint.text()).trim();
  }

  /** Gets the error the field shows, or null while it shows none. */
  async getError(): Promise<string | null> {
    const error = await this.error();
    return error === null ? null : (await error.text()).trim();
  }
}
