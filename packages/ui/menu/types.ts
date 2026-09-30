import type { AveIconName } from '@avelune/ui/icon';

/**
 * One action of a menu (ADR 0064): the value the menu emits when it is chosen, its words, and optionally an icon (a
 * name registered with `provideAveIcons`), `danger` for a destructive action, and `disabled`.
 *
 * @beta
 */
export interface AveMenuItem<V> {
  /** What `itemSelected` emits when the item is chosen. */
  readonly value: V;
  /** The words: a verb and its object, as a button says it ("Дублировать договор"). */
  readonly label: string;
  /** An icon before the words; decorative. */
  readonly icon?: AveIconName;
  /** A destructive action, drawn in the danger colour; confirm it before it runs. */
  readonly danger?: boolean;
  /** Shown but not chosen; say why elsewhere. */
  readonly disabled?: boolean;
}

/**
 * A line between groups of items.
 *
 * @beta
 */
export interface AveMenuSeparator {
  /** Marks the entry as a separator. */
  readonly separator: true;
}

/**
 * An entry of a menu: an item, or a separator between groups.
 *
 * @beta
 */
export type AveMenuEntry<V> = AveMenuItem<V> | AveMenuSeparator;

/**
 * One menu of a menubar (ADR 0076): the words of its item in the bar, and its entries.
 *
 * @beta
 */
export interface AveMenubarMenu<V> {
  /** The menu's words in the bar, a noun: "Файл", "Правка", "Вставка". */
  readonly label: string;
  /** Its actions, in order, with separators between groups. */
  readonly items: readonly AveMenuEntry<V>[];
}
