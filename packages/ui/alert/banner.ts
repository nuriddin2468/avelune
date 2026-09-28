import { Component, booleanAttribute, computed, input, output } from '@angular/core';
import { lucideX } from '@avelune/icons/lucide';
import { AveIconButton } from '@avelune/ui/button';
import { injectAveMessages } from '@avelune/ui/i18n';
import { AveIcon, provideAveIcons } from '@avelune/ui/icon';
import { statusIcon, statusIcons, statusLabel, statusRole } from './status';
import type { AveAlertVariant } from './types';

/**
 * The kit's banner (GUIDELINES.md, "Toast, inline alert or banner"; ADR 0061): a state of the whole product or page,
 * such as planned maintenance or a licence that expires, in a tinted strip across the top of the page. The variant's
 * icon, the message, which may end with a link or a small button, and, when `dismissible`, a close button that emits
 * `dismiss`; the application removes the banner then and remembers the choice.
 *
 * ```html
 * <ave-banner variant="warning" dismissible (dismiss)="maintenanceSeen.set(true)">
 *   В субботу с 22:00 до 02:00 система будет недоступна.
 * </ave-banner>
 * ```
 *
 * @alpha
 */
@Component({
  selector: 'ave-banner',
  imports: [AveIcon, AveIconButton],
  providers: [provideAveIcons([...statusIcons, lucideX])],
  host: {
    '[attr.role]': 'role()',
    '[attr.data-variant]': 'variant()',
  },
  template: `
    <ave-icon class="icon" size="md" [name]="icon()" [label]="kind()" />
    <div class="message"><ng-content /></div>
    @if (dismissible()) {
      <button
        aveIconButton
        class="close"
        type="button"
        variant="ghost"
        size="sm"
        icon="x"
        [label]="messages.close"
        (click)="dismiss.emit()"
      ></button>
    }
  `,
  styleUrl: './banner.css',
})
export class AveBanner {
  /** What the banner is about: `info` (default), `success`, `warning` or `danger`. */
  readonly variant = input<AveAlertVariant>('info');

  /** Shows a close button at the end; the banner emits `dismiss` when it is pressed. */
  readonly dismissible = input(false, { transform: booleanAttribute });

  /** Emits when the person closes the banner. Remove it then, and remember the choice. */
  readonly dismiss = output();

  protected readonly messages = injectAveMessages();

  protected readonly icon = computed(() => statusIcon[this.variant()]);
  protected readonly kind = computed(() => this.messages[statusLabel[this.variant()]]);
  protected readonly role = computed(() => statusRole(this.variant()));
}
