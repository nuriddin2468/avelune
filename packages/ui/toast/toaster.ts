import {
  ApplicationRef,
  DestroyRef,
  EnvironmentInjector,
  Injectable,
  PLATFORM_ID,
  createComponent,
  inject,
  type ComponentRef,
} from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { AveToastRegion } from './region';
import type { AveToastOptions, AveToastRef } from './types';

let nextToast = 0;

/**
 * The kit's toasts (brief §6.3, ADR 0068): a short confirmation of something the person just did ("Документ
 * сохранён"), at the bottom of the screen, for `timing.toast` (6 seconds). The clock stops while the pointer or focus is
 * on the notifications, and while the page is hidden. At most three show at once; the others wait their turn. Each is
 * announced when it shows, errors and warnings at once. F8 moves focus to them, Escape takes it back. A toast is never
 * the only place an error appears (GUIDELINES.md, "Toast, inline alert or banner").
 *
 * ```ts
 * private readonly toaster = inject(AveToaster);
 *
 * this.toaster.show({ message: 'Договор удалён', variant: 'success', action: { label: 'Отменить', run: () => this.restore() } });
 * ```
 *
 * @alpha
 */
@Injectable({ providedIn: 'root' })
export class AveToaster {
  private readonly application = inject(ApplicationRef);
  private readonly injector = inject(EnvironmentInjector);
  private readonly document = inject(DOCUMENT);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private region: ComponentRef<AveToastRegion> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.region?.destroy();
      this.region = undefined;
    });
  }

  /**
   * Shows a toast: a message, or the message with its variant (`info` by default, `success`, `warning`, `danger`) and
   * an action. On the server it does nothing.
   *
   * @returns A reference that removes the toast early.
   */
  show(toast: string | AveToastOptions): AveToastRef {
    const options = typeof toast === 'string' ? { message: toast } : toast;
    const id = nextToast++;
    if (!this.browser) return { dismiss: () => undefined };
    const region = this.attach().instance;
    region.add({ id, message: options.message, variant: options.variant ?? 'info', action: options.action });
    return {
      dismiss: () => {
        region.dismiss(id);
      },
    };
  }

  /** The region, drawn at the end of `<body>` the first time a toast shows. */
  private attach(): ComponentRef<AveToastRegion> {
    if (this.region !== undefined) return this.region;
    const region = createComponent(AveToastRegion, { environmentInjector: this.injector });
    this.application.attachView(region.hostView);
    this.document.body.append(region.location.nativeElement as HTMLElement);
    this.region = region;
    return region;
  }
}
