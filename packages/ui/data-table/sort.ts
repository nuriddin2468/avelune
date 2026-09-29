import type { AveCellValue, AveColumn, AveSort } from './types';

/**
 * The rows in the order of `sort` (ADR 0087): numbers as numbers, text by the locale's collation with the numbers
 * inside it in order, empty values last in both orders, equal rows in their own order. Without a sort, a column that
 * cannot be sorted, or a value to compare, the rows stay as they are.
 */
export function sortRows<R>(
  rows: readonly R[],
  columns: readonly AveColumn<R>[],
  sort: AveSort | null,
  locale: string,
): readonly R[] {
  const column = sort === null ? undefined : columns.find((one) => one.key === sort.column);
  const value = column?.sortable === true ? column.value : undefined;
  if (sort === null || value === undefined) return rows;
  const collator = new Intl.Collator(locale, { numeric: true });
  const sign = sort.direction === 'ascending' ? 1 : -1;
  const compare = (a: AveCellValue, b: AveCellValue): number => {
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    return collator.compare(String(a), String(b));
  };
  return rows
    .map((row, index) => ({ row, index, value: value(row) }))
    .sort((a, b) => {
      if (a.value === null || b.value === null) {
        if (a.value === b.value) return a.index - b.index;
        return a.value === null ? 1 : -1;
      }
      return sign * compare(a.value, b.value) || a.index - b.index;
    })
    .map((entry) => entry.row);
}
