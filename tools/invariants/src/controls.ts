// The same-size controls invariant of brief §8.2: Button, IconButton, Input (and later Select, Combobox, DatePicker)
// of one size have the same height, radius, border width and font size, and the ones with a text label the same
// horizontal padding. A Textarea shares all of it but the height, which its rows set (ADR 0043). The browser measures
// each control; this module compares them.

/** The kit's controls that carry a size. */
export const controlSelector = [
  'button[aveButton]',
  'a[aveButton]',
  'button[aveIconButton]',
  'a[aveIconButton]',
  'input[aveInput]',
  'textarea[aveTextarea]',
  // The triggers of the select family (ADR 0046); their size is on the component around them.
  'ave-select .trigger',
  'ave-combobox .trigger',
  'ave-multiselect .trigger',
].join(', ');

/** One control as the browser draws it. */
export interface ControlBox {
  /** A short description for the report: tag, kit attribute and text. */
  readonly control: string;
  readonly size: string;
  /** An icon button: a square, whose padding is not compared. */
  readonly square: boolean;
  /** A textarea: as tall as its rows, so its height is not compared. */
  readonly multiline: boolean;
  readonly height: number;
  readonly radius: string;
  readonly border: string;
  readonly fontSize: string;
  readonly padding: string;
}

/**
 * The controls that differ from the reference of their size, one line each: what differs, and from what. The reference
 * is the first single-line control of the size, or its first textarea when it has none. Heights may differ by rounding
 * only (0.01px), and a textarea's height is not compared.
 */
export function sameSizeViolations(boxes: readonly ControlBox[]): string[] {
  const violations: string[] = [];
  const references = new Map<string, ControlBox>();
  for (const box of boxes) {
    const current = references.get(box.size);
    if (current === undefined || (current.multiline && !box.multiline)) references.set(box.size, box);
  }
  const firstLabelled = new Map<string, ControlBox>();
  for (const box of boxes) {
    const reference = references.get(box.size);
    if (reference !== undefined && reference !== box) {
      const differ = (what: string, a: string | number, b: string | number) => {
        violations.push(
          `${box.control} (${box.size}): ${what} ${String(a)}, but ${reference.control} has ${String(b)}`,
        );
      };
      const compareHeight = !box.multiline && !reference.multiline;
      if (compareHeight && Math.abs(box.height - reference.height) > 0.01)
        differ('height', box.height, reference.height);
      if (box.radius !== reference.radius) differ('radius', box.radius, reference.radius);
      if (box.border !== reference.border) differ('border width', box.border, reference.border);
      if (box.fontSize !== reference.fontSize) differ('font size', box.fontSize, reference.fontSize);
    }
    if (box.square) continue;
    const labelled = firstLabelled.get(box.size);
    if (labelled === undefined) firstLabelled.set(box.size, box);
    else if (box.padding !== labelled.padding) {
      violations.push(
        `${box.control} (${box.size}): inline padding ${box.padding}, but ${labelled.control} has ${labelled.padding}`,
      );
    }
  }
  return violations;
}
