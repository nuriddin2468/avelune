import { ComponentHarness, HarnessPredicate, type BaseHarnessFilters } from '@angular/cdk/testing';
import { AveSidebarNavHarness } from '@avelune/ui/sidebar-nav/testing';

/**
 * Filters for {@link AveSettingsPageHarness}.
 *
 * @beta
 */
export interface AveSettingsPageHarnessFilters extends BaseHarnessFilters {
  /** Only match settings pages whose heading is this string, or matches this pattern. */
  heading?: string | RegExp;
}

/**
 * Harness for `<ave-settings-page>` from `@avelune/ui/settings-page`.
 *
 * @beta
 */
export class AveSettingsPageHarness extends ComponentHarness {
  /** Selector that finds kit settings pages. */
  static hostSelector = 'ave-settings-page';

  private readonly heading = this.locatorFor(':scope > .header > h1');
  private readonly description = this.locatorForOptional(':scope > .header > p');
  private readonly list = this.locatorFor(':scope > .body > .sections');
  private readonly section = this.locatorFor(':scope > .body > .section');
  private readonly back = this.locatorFor(':scope > .body > .section > a');
  private readonly navigation = this.locatorFor(AveSidebarNavHarness);

  /** Gets a predicate that matches settings pages by the given filters. */
  static with(options: AveSettingsPageHarnessFilters = {}): HarnessPredicate<AveSettingsPageHarness> {
    return new HarnessPredicate(AveSettingsPageHarness, options).addOption(
      'heading',
      options.heading,
      (harness, heading) => HarnessPredicate.stringMatches(harness.getHeading(), heading),
    );
  }

  /** Gets the page's heading. */
  async getHeading(): Promise<string> {
    return (await (await this.heading()).text()).trim();
  }

  /** Gets the words under the heading, or an empty string. */
  async getDescription(): Promise<string> {
    const description = await this.description();
    return description === null ? '' : (await description.text()).trim();
  }

  /** Gets the name of the sections' navigation. */
  async getSectionsLabel(): Promise<string | null> {
    return (await this.navigation()).getLabel();
  }

  /** Gets the sections' names, in order. */
  async getSections(): Promise<string[]> {
    return (await this.navigation()).getLinks();
  }

  /** Gets the name of the section the address names, or `null` at the settings' own address. */
  async getCurrentSection(): Promise<string | null> {
    return (await this.navigation()).getCurrent();
  }

  /** Follows a section's link in the list. */
  async openSection(label: string | RegExp): Promise<void> {
    await (await this.navigation()).follow(label);
  }

  /** Whether the list of sections shows: always from `container.md`, and below it at the settings' own address. */
  async isListShown(): Promise<boolean> {
    return (await (await this.list()).getCssValue('display')) !== 'none';
  }

  /** Whether a section shows: always from `container.md`, and below it at a section's address. */
  async isSectionShown(): Promise<boolean> {
    return (await (await this.section()).getCssValue('display')) !== 'none';
  }

  /** Whether the link back to the list shows: below `container.md`, over a section. */
  async hasBackLink(): Promise<boolean> {
    return (await (await this.back()).getCssValue('display')) !== 'none';
  }

  /** Gets the words of the link back to the list. */
  async getBackLabel(): Promise<string> {
    return (await (await this.back()).text()).trim();
  }

  /** Follows the link back to the list. */
  async goBack(): Promise<void> {
    await (await this.back()).click();
  }
}
