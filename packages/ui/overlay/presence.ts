import { afterRenderEffect, computed, effect, signal, type Signal } from '@angular/core';

/**
 * Whether a CDK overlay is open, and whether its content plays its exit.
 *
 * @alpha
 */
export interface AveOverlayPresence {
  /** Whether the overlay is open: while its content is shown, and while it plays its exit. */
  readonly open: Signal<boolean>;
  /** Whether the content plays its exit class (such as `ave-motion-popover-exit`). */
  readonly closing: Signal<boolean>;
}

/**
 * Keeps a CDK overlay open until its content has played its exit (brief §6.3, ADR 0046). The content takes the motion
 * catalog's classes itself, the enter class when it is created and the exit class while `closing` is true, instead of
 * `animate.enter` and `animate.leave`: either of those inside a CDK overlay throws NG0205 when the application is
 * destroyed with the overlay open, because it reaches for the destroyed environment injector. The overlay closes once
 * the content's animations have finished, or at once when it has none. Call it in an injection context, with whether
 * the content is shown and the content's element.
 *
 * ```html
 * <ng-template [cdkConnectedOverlay]="…" [cdkConnectedOverlayOpen]="presence.open()">
 *   <div #panel class="ave-motion-popover-enter" [class.ave-motion-popover-exit]="presence.closing()">…</div>
 * </ng-template>
 * ```
 *
 * @alpha
 */
export function aveOverlayPresence(
  expanded: Signal<boolean>,
  popup: Signal<HTMLElement | undefined>,
): AveOverlayPresence {
  const closing = signal(false);
  let wasExpanded = expanded();
  effect(() => {
    const now = expanded();
    if (wasExpanded && !now) closing.set(true);
    if (now) closing.set(false);
    wasExpanded = now;
  });
  afterRenderEffect(() => {
    if (!closing()) return;
    const animations = popup()?.getAnimations() ?? [];
    void Promise.allSettled(animations.map((animation) => animation.finished)).then(() => {
      if (!expanded()) closing.set(false);
    });
  });
  return { open: computed(() => expanded() || closing()), closing: closing.asReadonly() };
}
