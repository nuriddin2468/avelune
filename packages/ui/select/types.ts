/**
 * One option of a select, a combobox or a multiselect: the value it stands for, the words it shows, and whether it
 * can be chosen.
 *
 * @alpha
 */
export interface AveOption<V> {
  /** The value the option stands for; the form gets this. */
  readonly value: V;
  /** What the option says, and its accessible name. */
  readonly label: string;
  /** Whether the option is shown but cannot be chosen. */
  readonly disabled?: boolean;
}

/**
 * The sizes of a select, a combobox and a multiselect: the control sizes shared with every control
 * (`control.height.*`): `sm` 32px, `md` 36px, `lg` 40px, one step smaller in compact density.
 *
 * @alpha
 */
export type AveSelectSize = 'sm' | 'md' | 'lg';
