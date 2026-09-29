import {
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { lucideX } from '@avelune/icons/lucide';
import { aveStatusIcon, aveStatusIcons, aveStatusLabel, aveStatusRole } from '@avelune/ui/alert';
import { AveButton, AveIconButton } from '@avelune/ui/button';
import { injectAveMessages } from '@avelune/ui/i18n';
import { AveIcon, provideAveIcons } from '@avelune/ui/icon';
import { aveHostAnnouncer } from '@avelune/ui/overlay';
import { aveDurationToken } from '@avelune/ui/theme';
import { AveTooltip } from '@avelune/ui/tooltip';
import type { AveToastAction, Toast } from './types';

/** How many toasts show at once; the others wait their turn. */
const visibleAtOnce = 3;

/** The time a shown toast has left on screen, and its timer while it runs. */
interface Clock {
  remaining: number;
  started: number;
  timer: ReturnType<typeof setTimeout> | undefined;
}

/**
 * The region the toasts show in, drawn by `AveToaster` at the end of `<body>`; never used on its own (ADR 0068). A
 * manual popover in the top layer, at the bottom of the viewport, at its inline end from a small window up; a landmark
 * named "Notifications (F8)" that F8 moves focus to. While a modal dialog is open it moves into the topmost one, where it
 * is not inert, and back when that closes. It announces each toast through a live element of its own, which moves with
 * it.
 */
@Component({
  selector: 'ave-toast-region',
  imports: [AveButton, AveIcon, AveIconButton, AveTooltip],
  providers: [provideAveIcons([...aveStatusIcons, lucideX]), ...aveHostAnnouncer],
  host: {
    popover: 'manual',
    role: 'region',
    tabindex: '-1',
    '[attr.aria-label]': 'label',
    '(pointerenter)': 'hovered.set(true)',
    '(pointerleave)': 'hovered.set(false)',
    '(focusin)': 'focused($event)',
    '(focusout)': 'blurred($event)',
    '(keydown.escape)': 'escape($event)',
    '(document:keydown.f8)': 'jump($event)',
    '(document:visibilitychange)': 'visibility()',
  },
  template: `
    <ol class="list">
      @for (toast of shown(); track toast.id) {
        <li
          class="toast"
          [attr.data-ave-toast]="toast.id"
          [attr.data-variant]="toast.variant"
          animate.enter="ave-motion-toast-enter"
          animate.leave="ave-motion-toast-exit"
        >
          <ave-icon class="icon" size="md" [name]="icon[toast.variant]" [label]="messages[kind[toast.variant]]" />
          <div class="body">
            <p class="message">{{ toast.message }}</p>
            @if (toast.action; as action) {
              <button aveButton class="action" type="button" size="sm" (click)="act(toast.id, action)">
                {{ action.label }}
              </button>
            }
          </div>
          <button
            aveIconButton
            class="close"
            type="button"
            variant="ghost"
            size="sm"
            icon="x"
            [label]="messages.close"
            [aveTooltip]="messages.close"
            (click)="dismiss(toast.id)"
          ></button>
        </li>
      }
    </ol>
  `,
  styleUrl: './region.css',
})
export class AveToastRegion {
  protected readonly messages = injectAveMessages();
  protected readonly label = `${this.messages.notifications} (F8)`;
  protected readonly icon = aveStatusIcon;
  protected readonly kind = aveStatusLabel;

  /** The toasts on screen, oldest first; the newest is nearest the edge. */
  protected readonly shown = signal<readonly Toast[]>([]);
  protected readonly hovered = signal(false);
  protected readonly away = signal(false);
  private readonly focusWithin = signal(false);
  /** The clocks stop while the pointer or focus is on the notifications, or the page is hidden (WCAG 2.2.1). */
  private readonly paused = computed(() => this.hovered() || this.focusWithin() || this.away());

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);
  private readonly announcer = inject(LiveAnnouncer);
  private readonly waiting: Toast[] = [];
  private readonly clocks = new Map<number, Clock>();
  /** The open modal dialogs, the topmost last. */
  private modals: HTMLDialogElement[] = [];
  private watcher: MutationObserver | undefined;
  /** Where focus was before it came to the notifications, to go back to. */
  private returnTo: HTMLElement | undefined;

  constructor() {
    effect(() => {
      const paused = this.paused();
      untracked(() => {
        for (const [id, clock] of this.clocks) {
          if (paused) this.stop(clock);
          else this.run(id, clock);
        }
      });
    });
    inject(DestroyRef).onDestroy(() => {
      for (const clock of this.clocks.values()) clearTimeout(clock.timer);
      this.watcher?.disconnect();
    });
  }

  /** Shows a toast, or queues it while three show. */
  add(toast: Toast): void {
    if (this.shown().length < visibleAtOnce) this.reveal(toast);
    else this.waiting.push(toast);
  }

  /** Removes a toast from the screen or from the queue; the next one waiting shows. */
  dismiss(id: number): void {
    const queued = this.waiting.findIndex((toast) => toast.id === id);
    if (queued !== -1) {
      this.waiting.splice(queued, 1);
      return;
    }
    if (!this.shown().some((toast) => toast.id === id)) return;
    this.release(id);
    clearTimeout(this.clocks.get(id)?.timer);
    this.clocks.delete(id);
    this.shown.update((toasts) => toasts.filter((toast) => toast.id !== id));
    const next = this.waiting.shift();
    if (next !== undefined) this.reveal(next);
    else if (this.shown().length === 0) this.hideWhenGone();
  }

  protected act(id: number, action: AveToastAction): void {
    action.run();
    this.dismiss(id);
  }

  protected focused(event: FocusEvent): void {
    this.focusWithin.set(true);
    const from = event.relatedTarget;
    if (from instanceof HTMLElement && !this.host.contains(from)) this.returnTo = from;
  }

  protected blurred(event: FocusEvent): void {
    const to = event.relatedTarget;
    if (!(to instanceof Node) || !this.host.contains(to)) this.focusWithin.set(false);
  }

  /** Escape in the notifications takes focus back to where it was, before a dialog around them hears it. */
  protected escape(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.goBack();
  }

  protected visibility(): void {
    this.away.set(this.document.hidden);
  }

  /** F8 moves focus to the notifications while there are any. */
  protected jump(event: Event): void {
    if (this.shown().length === 0) return;
    event.preventDefault();
    this.host.focus();
  }

  private reveal(toast: Toast): void {
    this.shown.update((toasts) => [...toasts, toast]);
    const clock: Clock = {
      remaining: aveDurationToken(this.host, '--ave-timing-toast'),
      started: 0,
      timer: undefined,
    };
    this.clocks.set(toast.id, clock);
    if (!this.paused()) this.run(toast.id, clock);
    this.show();
    // The action's words follow the message as a sentence of their own.
    const text =
      toast.action === undefined
        ? toast.message
        : `${toast.message}${/[.!?…]$/u.test(toast.message) ? '' : '.'} ${toast.action.label}`;
    void this.announcer.announce(text, aveStatusRole(toast.variant) === 'alert' ? 'assertive' : 'polite');
  }

  private run(id: number, clock: Clock): void {
    if (clock.timer !== undefined) return;
    clock.started = Date.now();
    clock.timer = setTimeout(() => {
      clock.timer = undefined;
      this.dismiss(id);
    }, clock.remaining);
  }

  private stop(clock: Clock): void {
    if (clock.timer === undefined) return;
    clearTimeout(clock.timer);
    clock.timer = undefined;
    clock.remaining -= Date.now() - clock.started;
  }

  /** Before a toast that holds focus goes: focus stays in the notifications while others show, else goes back. */
  private release(id: number): void {
    const toast = this.host.querySelector(`[data-ave-toast="${String(id)}"]`);
    if (toast === null || !toast.contains(this.document.activeElement)) return;
    if (this.shown().length > 1) this.host.focus();
    else this.goBack();
  }

  /** Focus goes back to where it came from, or leaves the notifications when that is gone; it is in them now. */
  private goBack(): void {
    const target = this.returnTo;
    this.returnTo = undefined;
    if (target?.isConnected === true && target.closest('[inert]') === null) target.focus();
    else (this.document.activeElement as HTMLElement).blur();
  }

  /** Shows the region in the top layer, inside the topmost modal dialog while one is open, and follows them. */
  private show(): void {
    if (this.watcher === undefined) {
      this.modals = [...this.document.querySelectorAll<HTMLDialogElement>('dialog:modal')];
      this.watcher = new MutationObserver((records) => {
        this.track(records);
        this.place();
      });
      this.watcher.observe(this.document.documentElement, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ['open'],
      });
    }
    this.place();
  }

  private track(records: readonly MutationRecord[]): void {
    for (const record of records) {
      const dialog = record.target;
      if (record.type !== 'attributes' || !(dialog instanceof HTMLDialogElement)) continue;
      this.modals = this.modals.filter((modal) => modal !== dialog);
      if (dialog.matches(':modal')) this.modals.push(dialog);
    }
    this.modals = this.modals.filter((modal) => modal.isConnected && modal.matches(':modal'));
  }

  /** Moving the region hides it (it leaves the top layer), so it shows again where it lands. */
  private place(): void {
    const parent = this.modals.at(-1) ?? this.document.body;
    if (this.host.parentElement !== parent) parent.append(this.host);
    if (!this.host.matches(':popover-open')) this.host.showPopover();
  }

  /** Once the last toast has played its exit, the region leaves the top layer and stops following the dialogs. */
  private hideWhenGone(): void {
    afterNextRender(
      () => {
        const animations = this.host.getAnimations({ subtree: true });
        void Promise.allSettled(animations.map((animation) => animation.finished)).then(() => {
          if (this.shown().length > 0) return;
          this.watcher?.disconnect();
          this.watcher = undefined;
          this.modals = [];
          this.hovered.set(false);
          if (this.host.matches(':popover-open')) this.host.hidePopover();
          if (this.host.parentElement !== this.document.body) this.document.body.append(this.host);
        });
      },
      { injector: this.injector },
    );
  }
}
