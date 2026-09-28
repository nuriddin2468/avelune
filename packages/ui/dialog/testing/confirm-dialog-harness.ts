import { ComponentHarness, HarnessPredicate, type BaseHarnessFilters } from '@angular/cdk/testing';

/**
 * Filters for {@link AveConfirmDialogHarness}.
 *
 * @alpha
 */
export interface AveConfirmDialogHarnessFilters extends BaseHarnessFilters {
  /** Only match confirmations whose question is this string, or matches this pattern. */
  heading?: string | RegExp;
}

/**
 * Harness for `dialog[aveConfirmDialog]` from `@avelune/ui/dialog`.
 *
 * @alpha
 */
export class AveConfirmDialogHarness extends ComponentHarness {
  /** Selector that finds kit confirmations. */
  static hostSelector = 'dialog[aveConfirmDialog]';

  private readonly cancelButton = this.locatorFor('.actions button:first-child');
  private readonly actionButton = this.locatorFor('.actions button:last-child');

  /** Gets a predicate that matches confirmations by the given filters. */
  static with(options: AveConfirmDialogHarnessFilters = {}): HarnessPredicate<AveConfirmDialogHarness> {
    return new HarnessPredicate(AveConfirmDialogHarness, options).addOption(
      'heading',
      options.heading,
      (harness, heading) => HarnessPredicate.stringMatches(harness.getHeading(), heading),
    );
  }

  /** Whether the confirmation is shown (and is not leaving). */
  async isOpen(): Promise<boolean> {
    const host = await this.host();
    return (await host.getProperty<boolean>('open')) && !(await host.hasClass('ave-motion-backdrop-exit'));
  }

  /** Gets the question. */
  async getHeading(): Promise<string> {
    return (await (await this.locatorFor('.heading')()).text()).trim();
  }

  /** Gets the message, as one line. */
  async getMessage(): Promise<string> {
    return (await (await this.locatorFor('.body')()).text()).replace(/\s+/g, ' ').trim();
  }

  /** Gets the words of the confirming button. */
  async getAction(): Promise<string> {
    return (await (await this.actionButton()).text()).trim();
  }

  /** Gets the words of the button that cancels. */
  async getCancel(): Promise<string> {
    return (await (await this.cancelButton()).text()).trim();
  }

  /** Confirms: presses the button that names the action. */
  async confirm(): Promise<void> {
    await (await this.actionButton()).click();
    await this.forceStabilize();
  }

  /** Cancels with its Cancel button. */
  async cancel(): Promise<void> {
    await (await this.cancelButton()).click();
    await this.forceStabilize();
  }

  /** Asks the confirmation to close as Escape does: the browser's `cancel` request. */
  async pressEscape(): Promise<void> {
    await (await this.host()).dispatchEvent('cancel');
    await this.forceStabilize();
  }
}
