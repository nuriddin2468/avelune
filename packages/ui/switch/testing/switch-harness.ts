import { ComponentHarness, HarnessPredicate, type BaseHarnessFilters } from '@angular/cdk/testing';

/**
 * Filters for {@link AveSwitchHarness}.
 *
 * @beta
 */
export interface AveSwitchHarnessFilters extends BaseHarnessFilters {
  /** Only match switches whose label is this string, or matches this pattern. */
  label?: string | RegExp;
  /** Only match switches that are on, or off. */
  on?: boolean;
}

/**
 * Harness for `input[type=checkbox][aveSwitch]` from `@avelune/ui/switch`.
 *
 * @beta
 */
export class AveSwitchHarness extends ComponentHarness {
  /** Selector that finds kit switches. */
  static hostSelector = 'input[type=checkbox][aveSwitch]';

  /** Gets a predicate that matches switches by the given filters. */
  static with(options: AveSwitchHarnessFilters = {}): HarnessPredicate<AveSwitchHarness> {
    return new HarnessPredicate(AveSwitchHarness, options)
      .addOption('label', options.label, (harness, label) => HarnessPredicate.stringMatches(harness.getLabel(), label))
      .addOption('on', options.on, async (harness, on) => (await harness.isOn()) === on);
  }

  /**
   * Gets what names the switch: its `aria-label`, or the text of its first label (the `label[aveChoice]` around it).
   * Reads the element's native `labels`, which the unit-test environment passes through.
   */
  async getLabel(): Promise<string> {
    const host = await this.host();
    const ariaLabel = await host.getAttribute('aria-label');
    if (ariaLabel !== null) return ariaLabel;
    const labels = await host.getProperty<ArrayLike<{ readonly textContent: string | null }> | null>('labels');
    return (labels?.[0]?.textContent ?? '').replace(/\s+/g, ' ').trim();
  }

  /** Whether the switch is on. */
  async isOn(): Promise<boolean> {
    return (await this.host()).getProperty<boolean>('checked');
  }

  /** Whether the switch is disabled. */
  async isDisabled(): Promise<boolean> {
    return (await this.host()).getProperty<boolean>('disabled');
  }

  /** Whether the switch shows as invalid (`aria-invalid="true"`). */
  async isInvalid(): Promise<boolean> {
    return (await (await this.host()).getAttribute('aria-invalid')) === 'true';
  }

  /** Toggles the switch, as a click does. */
  async toggle(): Promise<void> {
    await (await this.host()).click();
  }

  /** Turns the switch on, unless it already is. */
  async turnOn(): Promise<void> {
    if (!(await this.isOn())) await this.toggle();
  }

  /** Turns the switch off, unless it already is. */
  async turnOff(): Promise<void> {
    if (await this.isOn()) await this.toggle();
  }

  /** Blurs the switch, which marks a form control touched. */
  async blur(): Promise<void> {
    await (await this.host()).blur();
  }
}
