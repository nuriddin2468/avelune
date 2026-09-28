import {
  DestroyRef,
  ElementRef,
  Injector,
  PLATFORM_ID,
  afterNextRender,
  effect,
  inject,
  signal,
  untracked,
  type ModelSignal,
  type Provider,
  type Signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { LIVE_ANNOUNCER_ELEMENT_TOKEN, LiveAnnouncer } from '@angular/cdk/a11y';
import { _CdkPrivateStyleLoader, _VisuallyHiddenLoader } from '@angular/cdk/private';

let nextAnnouncer = 0;

/**
 * A `LiveAnnouncer` of the dialog's own, for the content inside it (ADR 0066). A modal `<dialog>` makes everything
 * outside it inert, CDK's live element in `<body>` included, so a control inside the dialog that announces (a file
 * upload, a searched list) would say nothing. The dialog provides an announcer whose live element is inside it.
 */
export const dialogAnnouncer: Provider[] = [
  LiveAnnouncer,
  {
    provide: LIVE_ANNOUNCER_ELEMENT_TOKEN,
    useFactory: (): HTMLElement => {
      const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
      // CDK hides its live element with this class but loads its styles only through its directives.
      inject(_CdkPrivateStyleLoader).load(_VisuallyHiddenLoader);
      const live = host.ownerDocument.createElement('div');
      live.classList.add('cdk-live-announcer-element', 'cdk-visually-hidden');
      live.setAttribute('aria-atomic', 'true');
      live.setAttribute('aria-live', 'polite');
      live.id = `ave-dialog-announcer-${String(nextAnnouncer++)}`;
      host.append(live);
      return live;
    },
  },
];

/** What a kit dialog's host binds: the exit, and the native events that close it. */
export interface AveModal {
  /** Whether the dialog plays its exit, before it closes. */
  readonly closing: Signal<boolean>;
  /** The native `cancel` (Escape): the dialog closes with its exit instead of at once. */
  cancel(event: Event): void;
  /** The native `close`: the browser closed the dialog itself; `open` follows. */
  closed(): void;
  /** A press starts on the backdrop, the dialog element around the panel. */
  pressed(event: PointerEvent): void;
  /** A click on the backdrop that also started there closes the dialog. */
  clicked(event: MouseEvent): void;
}

/**
 * The behaviour every kit dialog shares (ADR 0066), for a component on a native `<dialog>` whose element is the
 * backdrop and holds the panel: `open` shows it with `showModal()` (the browser moves focus in, makes the page inert,
 * and returns focus when it closes); `open` false plays the exit classes, then closes it. Escape and a click on the
 * backdrop set `open` to false. While open, the page does not scroll (`data-ave-scroll-lock`, base.css). Call it in
 * an injection context.
 */
export function aveModal(open: ModelSignal<boolean>): AveModal {
  const dialog = inject<ElementRef<HTMLDialogElement>>(ElementRef).nativeElement;
  const injector = inject(Injector);
  const closing = signal(false);
  let pressedOnBackdrop = false;

  const unlock = (): void => {
    dialog.removeAttribute('data-ave-scroll-lock');
  };

  if (isPlatformBrowser(inject(PLATFORM_ID))) {
    effect(() => {
      const shown = open();
      untracked(() => {
        if (shown) {
          closing.set(false);
          if (dialog.open) return;
          const root = dialog.ownerDocument.documentElement;
          dialog.setAttribute('data-ave-scroll-lock', root.scrollHeight > root.clientHeight ? 'gutter' : 'plain');
          dialog.showModal();
          return;
        }
        if (!dialog.open || closing()) return;
        closing.set(true);
        // The exit classes are on the elements after the next render; the dialog closes once their animations end.
        afterNextRender(
          () => {
            const animations = dialog.getAnimations({ subtree: true });
            void Promise.allSettled(animations.map((animation) => animation.finished)).then(() => {
              if (open() || !closing()) return;
              closing.set(false);
              dialog.close();
              unlock();
            });
          },
          { injector },
        );
      });
    });
  }

  return {
    closing: closing.asReadonly(),
    cancel(event) {
      event.preventDefault();
      open.set(false);
    },
    closed() {
      // A close event of the kit's own exit may arrive after the dialog was opened again; it is past.
      if (dialog.open) return;
      closing.set(false);
      unlock();
      if (open()) open.set(false);
    },
    pressed(event) {
      pressedOnBackdrop = event.target === dialog;
    },
    clicked(event) {
      if (pressedOnBackdrop && event.target === dialog) open.set(false);
      pressedOnBackdrop = false;
    },
  };
}

/**
 * Whether the content of a dialog's body overflows it, so that the body scrolls and must take keyboard focus to be
 * scrolled (axe `scrollable-region-focusable`): measured whenever the body or one of its children changes size, or
 * its children change. Call it in an injection context.
 */
export function aveOverflows(body: Signal<HTMLElement | undefined>): Signal<boolean> {
  const overflows = signal(false);
  if (!isPlatformBrowser(inject(PLATFORM_ID))) return overflows.asReadonly();
  const measure = (element: HTMLElement): void => {
    overflows.set(element.scrollHeight > element.clientHeight);
  };
  let stop = (): void => undefined;
  effect(() => {
    const element = body();
    stop();
    if (element === undefined) return;
    const sizes = new ResizeObserver(() => {
      measure(element);
    });
    const watch = (): void => {
      sizes.disconnect();
      sizes.observe(element);
      for (const child of element.children) sizes.observe(child);
      measure(element);
    };
    const children = new MutationObserver(watch);
    children.observe(element, { childList: true });
    watch();
    stop = () => {
      sizes.disconnect();
      children.disconnect();
    };
  });
  inject(DestroyRef).onDestroy(() => {
    stop();
  });
  return overflows.asReadonly();
}
