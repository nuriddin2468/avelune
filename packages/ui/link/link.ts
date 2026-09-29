import { Component, HostAttributeToken, inject } from '@angular/core';
import { lucideExternalLink } from '@avelune/icons/lucide';
import { injectAveMessages } from '@avelune/ui/i18n';
import { AveIcon, provideAveIcons } from '@avelune/ui/icon';

/**
 * The kit's link (brief §9.4, ADR 0073), on a native `<a>`: always underlined, in the link colour, its underline
 * thicker under the pointer. It keeps its native role and keyboard, and works with `href` and `routerLink`. A link
 * with `target="_blank"` shows an icon after its words that says it opens a new tab.
 *
 * ```html
 * Продлите <a aveLink routerLink="/contracts/109">договор ДК-2025/109</a> или закройте его.
 * <a aveLink href="https://lex.uz/docs/1234" target="_blank">Регламент согласования</a>
 * ```
 *
 * For a link that looks like a button, use `a[aveButton]`.
 *
 * @alpha
 */
@Component({
  selector: 'a[aveLink]',
  imports: [AveIcon],
  providers: [provideAveIcons([lucideExternalLink])],
  template: `
    <ng-content />
    @if (newTab) {
      <ave-icon class="new-tab" name="external-link" [label]="messages.opensInNewTab" />
    }
  `,
  styleUrl: './link.css',
})
export class AveLink {
  protected readonly messages = injectAveMessages();

  /** Whether the link opens a new tab: its static `target` attribute. */
  protected readonly newTab = inject(new HostAttributeToken('target'), { optional: true }) === '_blank';
}
