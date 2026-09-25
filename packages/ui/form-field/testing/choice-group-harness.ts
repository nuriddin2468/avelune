import { ContentContainerComponentHarness, HarnessPredicate, type BaseHarnessFilters } from '@angular/cdk/testing';

/**
 * Filters for {@link AveChoiceGroupHarness}.
 *
 * @alpha
 */
export interface AveChoiceGroupHarnessFilters extends BaseHarnessFilters {
  /** Only match groups whose legend is this string, or matches this pattern. */
  legend?: string | RegExp;
}

/**
 * Harness for `fieldset[aveChoiceGroup]` from `@avelune/ui/form-field`. Get its radios or checkboxes with their own
 * harnesses, loaded from this one: `group.getAllHarnesses(AveRadioHarness)`.
 *
 * @alpha
 */
export class AveChoiceGroupHarness extends ContentContainerComponentHarness {
  /** Selector that finds groups of choices. */
  static hostSelector = 'fieldset[aveChoiceGroup]';

  private readonly legendElement = this.locatorFor('.legend');
  private readonly marker = this.locatorFor('.legend .required');
  private readonly hint = this.locatorForOptional('[aveHint]');
  private readonly error = this.locatorForOptional('.error [aveError]');

  /** Gets a predicate that matches groups by the given filters. */
  static with(options: AveChoiceGroupHarnessFilters = {}): HarnessPredicate<AveChoiceGroupHarness> {
    return new HarnessPredicate(AveChoiceGroupHarness, options).addOption('legend', options.legend, (harness, legend) =>
      HarnessPredicate.stringMatches(harness.getLegend(), legend),
    );
  }

  /** Gets the legend, without the required marker. */
  async getLegend(): Promise<string> {
    const text = await (await this.legendElement()).text();
    return text.replace(/\s*\*\s*$/, '').trim();
  }

  /** Whether the legend shows the required marker (always in the page, hidden while no choice is required). */
  async isRequired(): Promise<boolean> {
    return !(await (await this.marker()).getProperty<boolean>('hidden'));
  }

  /** Gets the group's role: `radiogroup` for radios, `null` (the fieldset's own `group`) for checkboxes. */
  async getRole(): Promise<string | null> {
    return (await this.host()).getAttribute('role');
  }

  /** Gets the ids that describe the group (`aria-describedby`). */
  async getDescribedBy(): Promise<string[]> {
    return ((await (await this.host()).getAttribute('aria-describedby')) ?? '').split(/\s+/).filter((id) => id !== '');
  }

  /** Gets the hint, or null without one. */
  async getHint(): Promise<string | null> {
    const hint = await this.hint();
    return hint === null ? null : (await hint.text()).trim();
  }

  /** Gets the error the group shows, or null while it shows none. */
  async getError(): Promise<string | null> {
    const error = await this.error();
    return error === null ? null : (await error.text()).trim();
  }
}
