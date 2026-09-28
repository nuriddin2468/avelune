import { Component, booleanAttribute, computed, input } from '@angular/core';
import { lucideLoaderCircle } from '@avelune/icons/lucide';
import { injectAveMessages } from '@avelune/ui/i18n';
import { AveIcon, provideAveIcons } from '@avelune/ui/icon';
import { aveDelayedSpinner } from '@avelune/ui/theme';
import type { AveSpinnerSize } from './types';

/**
 * The kit's spinner (brief §6.3, ADR 0058): a turning `loader-circle` for an action or a part of the page that is
 * being waited for. It appears only once the wait has lasted `timing.spinner-delay` (300ms), so a quick answer never
 * flashes it, and then stays at least `timing.spinner-min-visible` (500ms). Bind `loading` to the wait, or leave it
 * `true` and remove the spinner when the wait ends. While shown it is a `progressbar` named "Loading…" in the
 * application's locale, or by `label`; before and after, it keeps its box and is hidden from assistive technology.
 *
 * ```html
 * <ave-spinner [loading]="documents.isLoading()" label="Загрузка договоров" />
 * ```
 *
 * @alpha
 */
@Component({
  selector: 'ave-spinner',
  imports: [AveIcon],
  providers: [provideAveIcons([lucideLoaderCircle])],
  host: {
    '[attr.data-size]': 'size()',
    '[attr.data-shown]': 'shown() ? "" : null',
    '[attr.role]': 'shown() ? "progressbar" : null',
    '[attr.aria-label]': 'shown() ? name() : null',
    '[attr.aria-hidden]': 'shown() ? null : "true"',
  },
  template: `
    @if (shown()) {
      <ave-icon class="ave-motion-spin" name="loader-circle" decorative [size]="size()" />
    }
  `,
  styleUrl: './spinner.css',
})
export class AveSpinner {
  /**
   * Whether the wait goes on. The spinner shows once it has lasted 300ms and, once shown, stays at least 500ms after
   * it ends. `true` by default, for a spinner that is removed when the wait ends.
   */
  readonly loading = input(true, { transform: booleanAttribute });

  /** The size: `sm` 16px, `md` 20px (default), `lg` 24px, the icon sizes. */
  readonly size = input<AveSpinnerSize>('md');

  /** What is being waited for ("Загрузка договоров"), as the accessible name; "Loading…" in the locale by default. */
  readonly label = input('');

  private readonly messages = injectAveMessages();

  /** The accessible name while the spinner shows. */
  protected readonly name = computed(() => this.label().trim() || this.messages.loading);

  /** Whether the spinner shows: after the spinner delay, for at least its minimum time. */
  protected readonly shown = aveDelayedSpinner(this.loading);
}
