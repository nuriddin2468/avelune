import type { AveIconName } from '@avelune/ui/icon';

/**
 * One option of a select, a combobox or a multiselect (ADR 0046, 0055): the value it stands for, the words it shows,
 * whether it can be chosen, and what else its row says: a second line, an icon or an image at the start (never
 * both), and a short text at the end.
 *
 * @alpha
 */
export type AveOption<V> = {
  /** The value the option stands for; the form gets this. */
  readonly value: V;
  /** What the option says: its accessible name, what typeahead and a combobox's search read, what a trigger shows. */
  readonly label: string;
  /** Whether the option is shown but cannot be chosen. */
  readonly disabled?: boolean;
  /** A second line under the label, in smaller, muted text ("Ташкент"); it describes the option. */
  readonly description?: string;
  /** A short text at the end of the row: a code, a count ("UZ", "12"); it describes the option. */
  readonly meta?: string;
} & (
  | {
      /** An icon at the start of the row, by the name of a registered icon (`provideAveIcons`). */
      readonly icon?: AveIconName;
      readonly image?: never;
    }
  | {
      /** An image at the start of the row, drawn whole in a 20px square: a flag, an avatar, a logo. Decorative. */
      readonly image?: string;
      readonly icon?: never;
    }
);

/**
 * The sizes of a select, a combobox and a multiselect: the control sizes shared with every control
 * (`control.height.*`): `sm` 32px, `md` 36px, `lg` 40px, one step smaller in compact density.
 *
 * @alpha
 */
export type AveSelectSize = 'sm' | 'md' | 'lg';
