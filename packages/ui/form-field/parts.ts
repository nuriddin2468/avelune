import { Component, DestroyRef, ElementRef, InjectionToken, inject } from '@angular/core';

/** What a form field offers its hints and errors: each adds its id while it exists. */
export interface AveFieldParts {
  /** Adds a hint or an error by its id; returns the function that removes it. */
  add(kind: 'hint' | 'error', id: string): () => void;
}

/** Provided by `<ave-form-field>` for the hints and errors inside it. */
export const AVE_FIELD_PARTS = new InjectionToken<AveFieldParts>('AVE_FIELD_PARTS');

/** Unique ids for hints and errors without one. */
let nextPart = 0;

/** The element's own id, or a new one, added to the form field around it for as long as the part exists. */
function fieldPart(kind: 'hint' | 'error'): string {
  const element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  const id = element.id === '' ? `ave-${kind}-${String(nextPart++)}` : element.id;
  const remove = inject(AVE_FIELD_PARTS, { optional: true })?.add(kind, id);
  if (remove !== undefined) inject(DestroyRef).onDestroy(remove);
  return id;
}

/**
 * The hint of an `<ave-form-field>`: a short text under the control that helps fill it in. The control is described
 * by it (`aria-describedby`).
 *
 * ```html
 * <p aveHint>As written on the signed copy, for example ДК-2026/114.</p>
 * ```
 *
 * @alpha
 */
@Component({
  selector: '[aveHint]',
  host: { '[id]': 'id', '[attr.data-part]': '"hint"' },
  template: '<ng-content />',
  styleUrl: './parts.css',
})
export class AveHint {
  /** The id the control's `aria-describedby` names: the element's own, or a generated one. */
  readonly id = fieldPart('hint');
}

/**
 * The error of an `<ave-form-field>`: what is wrong and how to fix it. With a form binding, the field shows it once
 * the control is invalid and touched; without one, whenever it is in the template. The control is described by it
 * while it shows.
 *
 * ```html
 * <p aveError>Enter the contract number, for example ДК-2026/114.</p>
 * ```
 *
 * @alpha
 */
@Component({
  selector: '[aveError]',
  host: { '[id]': 'id', '[attr.data-part]': '"error"' },
  template: '<ng-content />',
  styleUrl: './parts.css',
})
export class AveError {
  /** The id the control's `aria-describedby` names while the error shows: the element's own, or a generated one. */
  readonly id = fieldPart('error');
}
