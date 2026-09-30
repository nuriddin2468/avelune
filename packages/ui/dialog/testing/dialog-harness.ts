import { ComponentHarness, HarnessPredicate, type BaseHarnessFilters, type HarnessLoader } from '@angular/cdk/testing';

/**
 * Filters for {@link AveDialogHarness}.
 *
 * @beta
 */
export interface AveDialogHarnessFilters extends BaseHarnessFilters {
  /** Only match dialogs whose heading is this string, or matches this pattern. */
  heading?: string | RegExp;
}

/**
 * Harness for `dialog[aveDialog]` from `@avelune/ui/dialog`.
 *
 * @beta
 */
export class AveDialogHarness extends ComponentHarness {
  /** Selector that finds kit dialogs. */
  static hostSelector = 'dialog[aveDialog]';

  /** Gets a predicate that matches dialogs by the given filters. */
  static with(options: AveDialogHarnessFilters = {}): HarnessPredicate<AveDialogHarness> {
    return new HarnessPredicate(AveDialogHarness, options).addOption('heading', options.heading, (harness, heading) =>
      HarnessPredicate.stringMatches(harness.getHeading(), heading),
    );
  }

  /** Whether the dialog is shown (and is not leaving). */
  async isOpen(): Promise<boolean> {
    const host = await this.host();
    return (await host.getProperty<boolean>('open')) && !(await host.hasClass('ave-motion-backdrop-exit'));
  }

  /** Whether the dialog is shown modally: the page behind it is inert. */
  async isModal(): Promise<boolean> {
    return (await this.host()).matchesSelector(':modal');
  }

  /** Gets the heading. */
  async getHeading(): Promise<string> {
    return (await (await this.locatorFor('.heading')()).text()).trim();
  }

  /** Gets the text of the content, as one line. */
  async getText(): Promise<string> {
    return (await (await this.locatorFor('.body')()).text()).replace(/\s+/g, ' ').trim();
  }

  /** Closes the dialog with its close button. */
  async close(): Promise<void> {
    await (await this.locatorFor('button.close')()).click();
    await this.forceStabilize();
  }

  /** Asks the dialog to close as Escape does: the browser's `cancel` request. */
  async pressEscape(): Promise<void> {
    await (await this.host()).dispatchEvent('cancel');
    await this.forceStabilize();
  }

  /** Clicks the backdrop, outside the panel. */
  async clickBackdrop(): Promise<void> {
    await (await this.host()).click(0, 0);
    await this.forceStabilize();
  }

  /** Gets a loader for the harnesses of the dialog's content and actions. */
  async getContentLoader(): Promise<HarnessLoader> {
    return this.locatorFactory.rootHarnessLoader();
  }
}
