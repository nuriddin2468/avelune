import { ComponentHarness, HarnessPredicate, type BaseHarnessFilters } from '@angular/cdk/testing';

/**
 * Where a step stands: done, current or ahead, and whether it needs attention.
 *
 * @beta
 */
export interface AveStepState {
  /** The step's name. */
  readonly label: string;
  /** Before, at or after the current step. */
  readonly state: 'done' | 'current' | 'ahead';
  /** Whether the step needs attention. */
  readonly error: boolean;
}

/** A step's `data-state` as a state; a step without one is ahead. */
function stateOf(state: string | null | undefined): AveStepState['state'] {
  return state === 'done' || state === 'current' ? state : 'ahead';
}

/**
 * Filters for {@link AveStepperHarness}.
 *
 * @beta
 */
export interface AveStepperHarnessFilters extends BaseHarnessFilters {
  /** Only match steppers whose list is named by this string, or matches this pattern. */
  label?: string | RegExp;
}

/**
 * Harness for `<ave-stepper>` from `@avelune/ui/stepper`: its steps and where each stands.
 *
 * @beta
 */
export class AveStepperHarness extends ComponentHarness {
  /** Selector that finds kit steppers. */
  static hostSelector = 'ave-stepper';

  private readonly steps = this.locatorForAll('li');
  private readonly labels = this.locatorForAll('li .label');

  /** Gets a predicate that matches steppers by the given filters. */
  static with(options: AveStepperHarnessFilters = {}): HarnessPredicate<AveStepperHarness> {
    return new HarnessPredicate(AveStepperHarness, options).addOption('label', options.label, (harness, label) =>
      HarnessPredicate.stringMatches(harness.getLabel(), label),
    );
  }

  /** Gets the name of the list of steps. */
  async getLabel(): Promise<string | null> {
    return (await this.locatorFor('ol')()).getAttribute('aria-label');
  }

  /** Gets each step's name and where it stands, in order. */
  async getSteps(): Promise<AveStepState[]> {
    const [steps, labels] = await Promise.all([this.steps(), this.labels()]);
    const names = await Promise.all(labels.map(async (label) => (await label.text()).trim()));
    const states = await Promise.all(steps.map(async (step) => step.getAttribute('data-state')));
    const errors = await Promise.all(steps.map(async (step) => (await step.getAttribute('data-error')) !== null));
    return names.map((label, index) => ({ label, state: stateOf(states[index]), error: errors[index] === true }));
  }

  /** Gets the current step's name, or `null` when every step is done. */
  async getCurrent(): Promise<string | null> {
    for (const step of await this.getSteps()) if (step.state === 'current') return step.label;
    return null;
  }

  /** Goes back to a done step by its name, with its button; throws when it is not a way back. */
  async goTo(label: string | RegExp): Promise<void> {
    for (const name of await this.locatorForAll('li button .label')()) {
      if (await HarnessPredicate.stringMatches((await name.text()).trim(), label)) {
        await name.click();
        return;
      }
    }
    throw new Error(`AveStepperHarness: no done step to go back to matches ${String(label)}.`);
  }
}
