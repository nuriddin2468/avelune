import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { lucideChevronRight } from '@avelune/icons/lucide';
import { injectAveMessages } from '@avelune/ui/i18n';
import { AveIcon, provideAveIcons } from '@avelune/ui/icon';
import type { AveBreadcrumb } from './types';

/**
 * The kit's breadcrumbs (brief §9.4, ADR 0070): the path from the top of the product to the current page, as a named
 * navigation landmark with a link to each page above this one and the current page's name at the end. The links go
 * through Angular's router; the current page is text, marked `aria-current="page"`.
 *
 * ```html
 * <ave-breadcrumbs [items]="[{ label: 'Договоры', link: '/contracts' }]" current="ДК-2026/114" />
 * ```
 *
 * @beta
 */
@Component({
  selector: 'ave-breadcrumbs',
  imports: [AveIcon, RouterLink],
  providers: [provideAveIcons([lucideChevronRight])],
  template: `
    <nav [attr.aria-label]="label() ?? messages.breadcrumbs">
      <ol class="trail">
        @for (item of items(); track $index) {
          <li class="item">
            <a class="link" [routerLink]="item.link">{{ item.label }}</a>
            <ave-icon class="separator" name="chevron-right" decorative />
          </li>
        }
        <li class="item">
          <span class="current" aria-current="page">{{ current() }}</span>
        </li>
      </ol>
    </nav>
  `,
  styleUrl: './breadcrumbs.css',
})
export class AveBreadcrumbs {
  /** The pages above the current one, from the top of the product down: each a name and where it is. */
  readonly items = input.required<readonly AveBreadcrumb[]>();

  /** The current page's name, as its heading says it; shown last, not as a link. */
  readonly current = input.required<string>();

  /**
   * Names the landmark: the kit's words ("Навигационная цепочка") by default. A page with two trails names each, so
   * screen readers can tell the landmarks apart.
   */
  readonly label = input<string>();

  protected readonly messages = injectAveMessages();
}
