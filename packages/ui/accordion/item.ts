import { Component, booleanAttribute, inject, input, model, signal } from '@angular/core';
import { AccordionContent, AccordionPanel, AccordionTrigger } from '@angular/aria/accordion';
import { AveIcon } from '@avelune/ui/icon';
import { AVE_ACCORDION } from './types';

/**
 * One item of `<ave-accordion>` (ADR 0084): a heading that opens and closes the panel under it, and the panel's
 * content. The panel is Angular Aria's: its content enters the page when it first opens and stays, and the closed
 * panel is inert.
 *
 * ```html
 * <ave-accordion-item heading="Форс-мажор" [(expanded)]="forceMajeure">…</ave-accordion-item>
 * ```
 *
 * @alpha
 */
@Component({
  selector: 'ave-accordion-item',
  imports: [AccordionContent, AccordionPanel, AccordionTrigger, AveIcon],
  host: {
    // Once the person uses the item, its panel opens and closes on timing.expand; as the page opens it is as it is.
    '(pointerdown)': 'used.set(true)',
    '(keydown)': 'used.set(true)',
  },
  template: `
    <div class="heading" role="heading" [attr.aria-level]="level()">
      <button
        ngAccordionTrigger
        type="button"
        class="trigger"
        data-focus-ring="inset"
        [panel]="panel"
        [disabled]="disabled()"
        [(expanded)]="expanded"
      >
        <span class="words">{{ heading() }}</span>
        <ave-icon class="chevron" name="chevron-down" decorative />
      </button>
    </div>
    <div
      ngAccordionPanel
      #panel="ngAccordionPanel"
      class="panel"
      [preserveContent]="true"
      [attr.data-used]="used() ? '' : null"
    >
      <div class="content">
        <ng-template ngAccordionContent
          ><div class="inner"><ng-content /></div
        ></ng-template>
      </div>
    </div>
  `,
  styleUrl: './item.css',
})
export class AveAccordionItem {
  /** The heading's words: what the section holds ("Форс-мажор"). */
  readonly heading = input.required<string>();

  /** Whether the panel is open. */
  readonly expanded = model(false);

  /** Shows the heading but keeps it from opening; focus still reaches it, and screen readers say it is unavailable. */
  readonly disabled = input(false, { transform: booleanAttribute });

  /** The heading level, from the accordion. */
  protected readonly level = inject(AVE_ACCORDION).level;

  /** Whether the person has used the item: its panel opens and closes on its timing only then. */
  protected readonly used = signal(false);
}
