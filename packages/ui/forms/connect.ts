import { ElementRef, Renderer2, effect, inject, type Signal } from '@angular/core';
import type { AveControlState } from './control-state';
import { AVE_FIELD } from './field';

/**
 * Whether ARIA allows `aria-required` on a control: not on a radio, whose group says it (ADR 0044), and not on a plain
 * button, such as a file upload's (ADR 0050); a select's trigger is a button with the combobox role, which takes it.
 */
function takesRequired(element: HTMLElement): boolean {
  if (element instanceof HTMLInputElement) return element.type !== 'radio';
  const role = element.getAttribute('role');
  return element.localName !== 'button' || (role !== null && role !== 'button');
}

/**
 * Connects the caller's control element to the form field around it, if any, and reflects its state in ARIA
 * (ADR 0039):
 * - without an id, the element takes the field's, so the field's label names it; it registers its id and state. In a
 *   group of controls (a field without a default id) it keeps its id, or none;
 * - `aria-describedby` lists the element's own ids, as written in the template, then `describedBy` (the ids a
 *   component adds, ADR 0050), then the field's hint and error;
 * - `aria-invalid="true"` while a form binding shows an error, and `aria-required="true"` when the binding requires a
 *   value the element's `required` attribute does not say; never on a radio or a plain button, where ARIA does not
 *   allow it (a radio's group says it, ADR 0044; a file upload describes it, ADR 0050). Without a binding the
 *   application sets both.
 *
 * Call it in the injection context of a directive or component on the control's element.
 *
 * @beta
 */
export function connectToField(state: AveControlState, describedBy?: Signal<readonly string[]>): void {
  const element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  const renderer = inject(Renderer2);
  const field = inject(AVE_FIELD, { optional: true });
  if (field !== null) {
    if (element.id === '' && field.defaultId !== null) renderer.setAttribute(element, 'id', field.defaultId);
    field.register(element, state);
  }
  const own = (element.getAttribute('aria-describedby') ?? '').split(/\s+/).filter((id) => id !== '');
  effect(() => {
    const ids = [...own, ...(describedBy?.() ?? []), ...(field?.describedBy() ?? [])];
    if (ids.length === 0) renderer.removeAttribute(element, 'aria-describedby');
    else renderer.setAttribute(element, 'aria-describedby', ids.join(' '));
    if (!state.bound) return;
    if (state.showError()) renderer.setAttribute(element, 'aria-invalid', 'true');
    else renderer.removeAttribute(element, 'aria-invalid');
    // Reactive Forms' Validators.required sets no native attribute; assistive technology still needs to know.
    const input = element as HTMLInputElement;
    if (state.required() && !input.required && takesRequired(element))
      renderer.setAttribute(element, 'aria-required', 'true');
    else renderer.removeAttribute(element, 'aria-required');
  });
}
