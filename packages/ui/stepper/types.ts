/**
 * One step of a stepper (ADR 0077): its words, and whether it needs attention.
 *
 * @beta
 */
export interface AveStep {
  /** The step's name, a noun or what the step does: "Стороны договора", "Юридический отдел". */
  readonly label: string;
  /** A line under the name: what the step holds, or where it stands ("Согласовано 18.09.2026"). */
  readonly description?: string;
  /** The step needs attention (an error in its fields, a refusal): marked in the danger colour, in words too. */
  readonly error?: boolean;
}

/**
 * How a stepper lays out its steps: in a row, or in a column.
 *
 * @beta
 */
export type AveStepperOrientation = 'horizontal' | 'vertical';
