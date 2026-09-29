import { Component, input } from '@angular/core';
import { AveIcon, type AveIconName } from '@avelune/ui/icon';

/**
 * A row of the sidebar navigation (ADR 0072): a page's link or a group's button, drawn alike, its words projected.
 * Internal to `<ave-sidebar-nav>`, which registers the chevrons.
 */
@Component({
  selector: 'a[aveSidebarItem], button[aveSidebarItem]',
  imports: [AveIcon],
  host: { '[attr.aria-expanded]': 'expanded()' },
  template: `
    @if (icon(); as name) {
      <ave-icon class="icon" [name]="name" decorative />
    }
    <span class="label"><ng-content /></span>
    @if (expanded() !== null) {
      <ave-icon class="chevron" [name]="expanded() ? 'chevron-down' : 'chevron-right'" decorative />
    }
  `,
  styleUrl: './item.css',
})
export class AveSidebarItem {
  /** An icon before the words; decorative. */
  readonly icon = input<AveIconName>();

  /** For a group's button, whether its pages show, which its chevron draws; `null` for a link. */
  readonly expanded = input<boolean | null>(null);
}
