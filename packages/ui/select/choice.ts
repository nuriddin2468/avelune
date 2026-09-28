import type { AveOption } from './types';

/**
 * Whether a listbox's new selection only drops values that no option in the list has. Angular Aria's listbox cuts
 * its selection to its options whenever they change (an effect in `ngListbox`), so a combobox's search that hides the
 * chosen option would unchoose it; that is not the person's choice, and the family ignores it.
 */
export function pruned<V>(before: readonly V[], after: readonly V[], listed: readonly AveOption<V>[]): boolean {
  const has = (values: readonly V[], value: V) => values.some((other) => Object.is(other, value));
  const dropped = before.filter((value) => !has(after, value));
  return (
    dropped.length > 0 &&
    after.every((value) => has(before, value)) &&
    dropped.every((value) => !listed.some((option) => Object.is(option.value, value)))
  );
}
