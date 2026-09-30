/**
 * A filter applied to a list, as the applied filters above it show it (ADR 0094).
 *
 * @beta
 */
export interface AveAppliedFilter {
  /** What the application knows the filter by; `remove` emits it. */
  readonly key: string;
  /** The filter's field and value in words: "Статус: Подписан". */
  readonly label: string;
}
