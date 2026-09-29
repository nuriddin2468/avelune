import { Component, input } from '@angular/core';
import { AveCount } from '@avelune/ui/badge';
import { AveIcon, type AveIconName } from '@avelune/ui/icon';

/**
 * A row of the sidebar navigation (ADR 0072): a page's link or a group's button, drawn alike, its words projected.
 * Internal to `<ave-sidebar-nav>`, which registers the chevrons.
 */
@Component({
  selector: 'a[aveSidebarItem], button[aveSidebarItem]',
  imports: [AveCount, AveIcon],
  host: { '[attr.aria-expanded]': 'expanded()' },
  template: `
    @if (icon(); as name) {
      <ave-icon class="icon" [name]="name" decorative />
    }
    <span class="label"><ng-content /></span>
    @if (count(); as value) {
      <!-- A space, so the link's name reads "Входящие 12": a flex container does not draw it. -->
      &ngsp;<ave-count class="count" [value]="value" />
    }
    @if (expanded() !== null) {
      <ave-icon class="chevron" [name]="expanded() ? 'chevron-down' : 'chevron-right'" decorative />
    }
  `,
  styleUrl: './item.css',
})
export class AveSidebarItem {
  /** An icon before the words; decorative. */
  readonly icon = input<AveIconName>();

  /** For a page's link, how many items wait there, drawn as a count at the end; nothing at 0. */
  readonly count = input<number>();

  /** For a group's button, whether its pages show, which its chevron draws; `null` for a link. */
  readonly expanded = input<boolean | null>(null);
}
