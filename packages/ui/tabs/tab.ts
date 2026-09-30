import { Component, booleanAttribute, input } from '@angular/core';
import { TabContent, TabPanel } from '@angular/aria/tabs';
import type { AveIconName } from '@avelune/ui/icon';

/**
 * One tab of `<ave-tabs>` and its panel (ADR 0071): the tab's words, and the content its panel shows while it is
 * chosen. The panel is Angular Aria's: its content enters the page when the tab is first chosen, and is hidden and
 * inert while another tab is chosen.
 *
 * ```html
 * <ave-tab value="files" label="Файлы">…</ave-tab>
 * ```
 *
 * @beta
 */
@Component({
  selector: 'ave-tab',
  imports: [TabContent, TabPanel],
  // Aria draws a panel's content once its tab is first chosen, and keeps it (preserveContent) so what people typed
  // and scrolled stays.
  template: `
    <div ngTabPanel class="panel" [value]="value()" [preserveContent]="true">
      <ng-template ngTabContent><ng-content /></ng-template>
    </div>
  `,
  styleUrl: './tab.css',
})
export class AveTab {
  /** Names the tab among its siblings; `selected` of `<ave-tabs>` holds it while the tab is chosen. */
  readonly value = input.required<string>();

  /** The tab's words, a noun for its content: "Файлы", "История". */
  readonly label = input.required<string>();

  /** An icon before the words, registered with `provideAveIcons`; decorative. */
  readonly icon = input<AveIconName>();

  /** Shows the tab but keeps it from being chosen; focus still reaches it, and screen readers say it is unavailable. */
  readonly disabled = input(false, { transform: booleanAttribute });
}
