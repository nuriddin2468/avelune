import { Component, input } from '@angular/core';
import { AccordionGroup } from '@angular/aria/accordion';
import { lucideChevronDown } from '@avelune/icons/lucide';
import { provideAveIcons } from '@avelune/ui/icon';
import { AVE_ACCORDION, type AveAccordionLevel } from './types';

/**
 * The kit's accordion (brief §9.4, ADR 0084): headings one under another that show and hide their sections, on
 * Angular Aria's accordion (the WAI-ARIA accordion pattern). Each `<ave-accordion-item>` is a heading and its panel;
 * the arrows move between headings, Enter and Space open and close. Several items may be open at once; with
 * `multiple="false"`, opening one closes the others.
 *
 * ```html
 * <ave-accordion [level]="3">
 *   <ave-accordion-item heading="Штрафы и пени"><p>Пеня 0,1% за каждый день просрочки.</p></ave-accordion-item>
 *   <ave-accordion-item heading="Форс-мажор"><p>Стороны освобождаются от ответственности.</p></ave-accordion-item>
 * </ave-accordion>
 * ```
 *
 * @beta
 */
@Component({
  selector: 'ave-accordion',
  // `multiple` is Aria's `multiExpandable`: true by default.
  hostDirectives: [{ directive: AccordionGroup, inputs: ['multiExpandable: multiple'] }],
  providers: [provideAveIcons([lucideChevronDown]), { provide: AVE_ACCORDION, useExisting: AveAccordion }],
  template: '<ng-content />',
  styleUrl: './accordion.css',
})
export class AveAccordion {
  /**
   * The heading level of the items: the page's next level under the heading above the accordion. `2`, `3` (default), `4`, `5`
   * or `6`.
   */
  readonly level = input<AveAccordionLevel>(3);
}
