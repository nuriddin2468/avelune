import { afterRenderEffect, computed, effect, signal, type Signal } from '@angular/core';

/**
 * Keeps the overlay of a list open until the list has played its exit (brief §6.3, ADR 0046). The list takes the
 * catalog's classes itself, `ave-motion-popover-enter` when it is created and `ave-motion-popover-exit` while it
 * closes, instead of `animate.enter` and `animate.leave`: either of those inside a CDK overlay throws NG0205 when the
 * application is destroyed with the list open, because it reaches for the destroyed environment injector. The combobox
 * preserves its popup's content (`preserveContent`), so Angular Aria does not remove the list the moment it collapses.
 * Call it in an injection context, with the expanded state and the popup element.
 */
export function listPresence(
  expanded: Signal<boolean>,
  popup: Signal<HTMLElement | undefined>,
): {
  /** Whether the overlay is open: while the list is expanded, and while it plays its exit. */
  readonly open: Signal<boolean>;
  /** Whether the list plays its exit, `ave-motion-popover-exit`. */
  readonly closing: Signal<boolean>;
} {
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
