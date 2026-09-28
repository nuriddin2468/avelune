import { Component, computed, input } from '@angular/core';
import { injectAveMessages } from '@avelune/ui/i18n';
import { AveIcon, provideAveIcons } from '@avelune/ui/icon';
import { statusIcon, statusIcons, statusLabel, statusRole } from './status';
import type { AveAlertVariant } from './types';

/**
 * The kit's inline alert (GUIDELINES.md, "Toast, inline alert or banner"; ADR 0061): a notice about one part of the
 * screen, next to that part. A tinted box with the variant's icon, an optional heading and the message, which may hold
 * a link or a button. A warning or an error is an `alert` and information or a success a `status`, so an alert that
 * appears is announced; the icon is named by its kind in the application's locale.
 *
 * ```html
 * <ave-alert variant="warning" heading="Контрагент не прошёл проверку">
 *   Налоговый номер не найден в реестре. Проверьте ИНН или выберите другого контрагента.
 * </ave-alert>
 * ```
 *
 * @alpha
 */
@Component({
  selector: 'ave-alert',
  imports: [AveIcon],
  providers: [provideAveIcons(statusIcons)],
  host: {
    '[attr.role]': 'role()',
    '[attr.data-variant]': 'variant()',
  },
  template: `
    <ave-icon class="icon" size="md" [name]="icon()" [label]="kind()" />
    <div class="content">
      @if (heading()) {
        <p class="heading">{{ heading() }}</p>
      }
      <div class="message"><ng-content /></div>
    </div>
  `,
  styleUrl: './alert.css',
})
export class AveAlert {
  /** What the alert is about: `info` (default), `success`, `warning` or `danger`. */
  readonly variant = input<AveAlertVariant>('info');

  /** A short first line in bold that says what happened ("Контрагент не прошёл проверку"); the message follows. */
  readonly heading = input('');

  private readonly messages = injectAveMessages();

  protected readonly icon = computed(() => statusIcon[this.variant()]);
  protected readonly kind = computed(() => this.messages[statusLabel[this.variant()]]);
  protected readonly role = computed(() => statusRole(this.variant()));
}
