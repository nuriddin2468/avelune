import { DestroyRef, ElementRef, PLATFORM_ID, effect, inject, signal, untracked, type Signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * A duration token (`300ms` or `0.3s`) as the element computes it, in milliseconds; 0 when it is not set.
 *
 * @beta
 */
export function aveDurationToken(element: Element, name: `--ave-${string}`): number {
  const match = /^(\d+(?:\.\d+)?)(ms|s)$/.exec(getComputedStyle(element).getPropertyValue(name).trim());
  if (match === null) return 0;
  const amount = Number(match[1]);
  return match[2] === 's' ? amount * 1000 : amount;
}

/**
 * Whether the spinner of something that is `waiting` shows (brief §6.3, ADR 0037): only once it has waited for
 * `timing.spinner-delay`, so a quick action never flashes, and then for at least `timing.spinner-min-visible`, so a
 * spinner never blinks. The timings are read from the host's computed tokens when a wait starts or ends. On the server
 * the spinner never shows and nothing is scheduled. Call it in an injection context. Shared by Button and the select
 * family's lists (ADR 0056).
 *
 * @beta
 */
export function aveDelayedSpinner(waiting: Signal<boolean>): Signal<boolean> {
  const shown = signal(false);
  if (!isPlatformBrowser(inject(PLATFORM_ID))) return shown.asReadonly();
  const host = inject<ElementRef<Element>>(ElementRef).nativeElement;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let shownAt = 0;
  const cancel = () => {
    clearTimeout(timer);
    timer = undefined;
  };
  inject(DestroyRef).onDestroy(cancel);
  effect(() => {
    const active = waiting();
    untracked(() => {
      cancel();
      if (active && !shown()) {
        timer = setTimeout(
          () => {
            timer = undefined;
            shownAt = Date.now();
            shown.set(true);
          },
          aveDurationToken(host, '--ave-timing-spinner-delay'),
        );
      } else if (!active && shown()) {
        const remaining = aveDurationToken(host, '--ave-timing-spinner-min-visible') - (Date.now() - shownAt);
        if (remaining > 0) {
          timer = setTimeout(() => {
            timer = undefined;
            shown.set(false);
          }, remaining);
        } else {
          shown.set(false);
        }
      }
    });
  });
  return shown.asReadonly();
}
