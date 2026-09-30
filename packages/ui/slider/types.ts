/**
 * The value of a range slider: its lower and upper end, `start` never above `end`.
 *
 * @beta
 */
export interface AveNumberRange {
  /** The lower end. */
  readonly start: number;
  /** The upper end. */
  readonly end: number;
}
