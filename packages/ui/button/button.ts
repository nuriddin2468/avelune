import { Component, ElementRef, booleanAttribute, computed, inject, input } from '@angular/core';
import { lucideLoaderCircle } from '@avelune/icons/lucide';
import { AveIcon, provideAveIcons } from '@avelune/ui/icon';
import { delayedSpinner } from './delayed-spinner';
import type { AveButtonSize, AveButtonVariant } from './types';

/**
 * The kit's button (brief §9.1, ADR 0037), on a native `<button>`, or on an `<a>` that navigates. The element keeps
 * its native role, keyboard and form behaviour; the kit adds the variant, the size and three states: `disabled`,
 * `disabledInteractive` (disabled but still focusable) and `loading`. A disabled or loading button does nothing when
 * pressed: no `(click)`, no form submission, no navigation.
 *
 * ```html
 * <button aveButton type="button">Cancel</button>
 * <button aveButton variant="primary" type="submit" [loading]="saving()">Save changes</button>
 * <a aveButton href="/documents/new">Create document</a>
 * ```
 *
 * Icons go inside, before or after the label: `<ave-icon name="download" decorative />`.
 *
 * @alpha
 */
@Component({
  selector: 'button[aveButton], a[aveButton]',
  imports: [AveIcon],
  providers: [provideAveIcons([lucideLoaderCircle])],
  host: {
    '[attr.data-variant]': 'variant()',
    '[attr.data-size]': 'size()',
    '[attr.data-state]': 'state()',
    '[attr.data-spinner]': 'spinner() ? "" : null',
    '[attr.disabled]': 'state() === "disabled" && !link && !disabledInteractive() ? "" : null',
    '[attr.aria-disabled]': 'state() === "disabled" && (link || disabledInteractive()) ? "true" : null',
    '[attr.tabindex]': 'state() === "disabled" && link && !disabledInteractive() ? "-1" : null',
    '[attr.aria-busy]': 'state() === "busy" ? "true" : null',
  },
  template: `
    <span class="content"><ng-content /></span>
    @if (spinner()) {
      <ave-icon class="spinner ave-motion-spin" name="loader-circle" decorative />
    }
  `,
  styleUrl: './button.css',
})
export class AveButton {
  /** The emphasis: `secondary` (default), `primary` for the one main action of a region, `ghost`, or `danger`. */
  readonly variant = input<AveButtonVariant>('secondary');

  /** The size: `sm` 32px, `md` 36px (default), `lg` 40px; one step smaller in compact density. */
  readonly size = input<AveButtonSize>('md');

  /**
   * Disables the button. A `<button>` leaves the tab order; a link is announced as unavailable and cannot be
   * followed. Add `disabledInteractive` to keep either focusable.
   */
  readonly disabled = input(false, { transform: booleanAttribute });

  /**
   * Keeps a disabled button focusable and announced as unavailable (`aria-disabled`), so a person can reach it and
   * read why; put the reason next to it and link it with `aria-describedby`. No effect unless `disabled` is set.
   */
  readonly disabledInteractive = input(false, { transform: booleanAttribute });

  /**
   * Marks the button busy (`aria-busy`) while its action runs: it does nothing when pressed, but keeps its focus and
   * its name. A spinner replaces the label after 300ms and stays at least 500ms.
   */
  readonly loading = input(false, { transform: booleanAttribute });

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  /** Whether the host is a link (`a[aveButton]`), which has no native `disabled`. */
  protected readonly link = this.host.localName === 'a';

  /** Whether the spinner shows: after the spinner delay, for at least its minimum time. */
  protected readonly spinner = delayedSpinner(computed(() => this.loading() && !this.disabled()));

  /** `disabled`, `busy` (loading, or its spinner still showing) or `enabled`; the CSS reads it as `data-state`. */
  protected readonly state = computed(() => {
    if (this.disabled()) return 'disabled';
    return this.loading() || this.spinner() ? 'busy' : 'enabled';
  });

  constructor() {
    // Added before any listener of the element, and in the capture phase, so it runs first and can stop the rest
    // (ADR 0037). aria-disabled and aria-busy do not stop activation by themselves.
    this.host.addEventListener(
      'click',
      (event) => {
        if (this.state() === 'enabled') return;
        event.preventDefault();
        event.stopImmediatePropagation();
      },
      { capture: true },
    );
  }
}
