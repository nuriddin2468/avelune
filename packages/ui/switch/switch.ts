import { Component, ElementRef, Renderer2, inject } from '@angular/core';
import { connectToField, injectControlState } from '@avelune/ui/forms';

/**
 * The kit's switch (brief §9.1, ADR 0045), on a native `<input type="checkbox">` with the `switch` role, inside its
 * label (`label[aveChoice]` from `@avelune/ui/checkbox`): for a setting that takes effect at once. Signal Forms
 * (`[formField]` on a boolean) and Reactive Forms (`formControl`) bind it through their native checkbox accessors;
 * Space toggles it. The thumb slides on `timing.slide` with the spring easing once the person has toggled it; a state
 * that arrives from the form or the server, and every state under reduced motion, is shown at once.
 *
 * ```html
 * <label aveChoice><input type="checkbox" aveSwitch [formField]="settings.emailNotices" /> Email notices</label>
 * ```
 *
 * @beta
 */
@Component({
  selector: 'input[type=checkbox][aveSwitch]',
  host: { role: 'switch', '(change)': 'toggled()' },
  // A native input has no content.
  template: '',
  styleUrl: './switch.css',
})
export class AveSwitch {
  private readonly element = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;
  private readonly renderer = inject(Renderer2);

  constructor() {
    connectToField(injectControlState());
  }

  /**
   * The person toggled it: from now on the thumb slides. Written at once, not through change detection, so the style
   * change that moves the thumb already has its transition (ADR 0045).
   */
  protected toggled(): void {
    this.renderer.setAttribute(this.element, 'data-toggled', '');
  }
}
