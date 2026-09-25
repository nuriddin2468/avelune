import { ElementRef, Renderer2, effect, inject } from '@angular/core';
import type { AveControlState } from './control-state';
import { AVE_FIELD } from './field';

/**
 * Connects the caller's control element to the form field around it, if any, and reflects its state in ARIA
 * (ADR 0039):
 * - without an id, the element takes the field's, so the field's label names it; it registers its id and state;
 * - `aria-describedby` lists the element's own ids, as written in the template, then the field's hint and error;
 * - `aria-invalid="true"` while a form binding shows an error, and `aria-required="true"` when the binding requires a
 *   value the element's `required` attribute does not say. Without a binding the application sets both.
 *
 * Call it in the injection context of a directive or component on the control's element.
 *
 * @beta
 */
export function connectToField(state: AveControlState): void {
  const element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  const renderer = inject(Renderer2);
  const field = inject(AVE_FIELD, { optional: true });
  if (field !== null) {
    if (element.id === '') renderer.setAttribute(element, 'id', field.defaultId);
    field.register(element.id, state);
  }
  const own = (element.getAttribute('aria-describedby') ?? '').split(/\s+/).filter((id) => id !== '');
  effect(() => {
    const ids = [...own, ...(field?.describedBy() ?? [])];
    if (ids.length === 0) renderer.removeAttribute(element, 'aria-describedby');
    else renderer.setAttribute(element, 'aria-describedby', ids.join(' '));
    if (!state.bound) return;
    if (state.showError()) renderer.setAttribute(element, 'aria-invalid', 'true');
    else renderer.removeAttribute(element, 'aria-invalid');
    // Reactive Forms' Validators.required sets no native attribute; assistive technology still needs to know.
    if (state.required() && !(element as HTMLInputElement).required)
      renderer.setAttribute(element, 'aria-required', 'true');
    else renderer.removeAttribute(element, 'aria-required');
  });
}
