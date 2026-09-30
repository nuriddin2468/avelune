import { ComponentHarness, HarnessPredicate, type BaseHarnessFilters, type TestElement } from '@angular/cdk/testing';

/**
 * Filters for {@link AveSliderHarness}.
 *
 * @beta
 */
export interface AveSliderHarnessFilters extends BaseHarnessFilters {
  /** Only match sliders whose value is written like this (`aria-valuetext`), or matches this pattern. */
  valueText?: string | RegExp;
}

/**
 * Harness for `<ave-slider>` from `@avelune/ui/slider`: its native range input and the bounds it writes. The value
 * the field's label row shows is the field's.
 *
 * @beta
 */
export class AveSliderHarness extends ComponentHarness {
  /** Selector that finds kit sliders. */
  static hostSelector = 'ave-slider';

  /** The native range inputs: a slider's one, or a range's lower and upper. */
  private readonly lower = this.locatorFor('input[type=range]:nth-of-type(1)');
  private readonly upper = this.locatorFor('input[type=range]:nth-of-type(2)');
  private readonly bounds = this.locatorForAll('.scale span');

  /** Gets a predicate that matches sliders by the given filters. */
  static with(options: AveSliderHarnessFilters = {}): HarnessPredicate<AveSliderHarness> {
    return new HarnessPredicate(AveSliderHarness, options).addOption('valueText', options.valueText, (harness, text) =>
      HarnessPredicate.stringMatches(harness.getValueText(), text),
    );
  }

  /** Gets the value. */
  async getValue(): Promise<number> {
    return Number(await (await this.thumb(0)).getProperty<string>('value'));
  }

  /** Sets the value as a drag does: the input takes it, within its bounds and on its step, and says so. */
  async setValue(value: number): Promise<void> {
    await this.move(0, value);
  }

  /** Gets the value as the slider writes it for screen readers (`aria-valuetext`). */
  async getValueText(): Promise<string | null> {
    return (await this.thumb(0)).getAttribute('aria-valuetext');
  }

  /** Gets the bounds as the slider writes them under the track's ends. */
  async getBounds(): Promise<string[]> {
    return Promise.all((await this.bounds()).map(async (bound) => (await bound.text()).trim()));
  }

  /** Whether the slider is disabled. */
  async isDisabled(): Promise<boolean> {
    return (await this.thumb(0)).getProperty<boolean>('disabled');
  }

  /** Whether the slider shows as invalid (`aria-invalid="true"`). */
  async isInvalid(): Promise<boolean> {
    return (await (await this.thumb(0)).getAttribute('aria-invalid')) === 'true';
  }

  /** Focuses the (lower) thumb. */
  async focus(): Promise<void> {
    await (await this.thumb(0)).focus();
  }

  /** Blurs the (lower) thumb, which marks a form control touched. */
  async blur(): Promise<void> {
    await (await this.thumb(0)).blur();
  }

  /** The input of a thumb, 0 the lower. */
  protected async thumb(index: 0 | 1): Promise<TestElement> {
    return index === 0 ? this.lower() : this.upper();
  }

  /** Moves a thumb to a value: its input takes it as the browser does, then says so. */
  protected async move(index: 0 | 1, value: number): Promise<void> {
    const input = await this.thumb(index);
    await input.setInputValue(String(value));
    await input.dispatchEvent('input');
  }
}
