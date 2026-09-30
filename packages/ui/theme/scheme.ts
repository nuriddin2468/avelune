import { isPlatformBrowser } from '@angular/common';
import { DOCUMENT, DestroyRef, Injectable, PLATFORM_ID, computed, inject, signal, type Signal } from '@angular/core';

/**
 * The colour theme a page shows: `light` or `dark`.
 *
 * @alpha
 */
export type AveColorScheme = 'light' | 'dark';

/** One watcher per application: `<html>`'s `data-theme` and the system's preference, read and followed, never written. */
@Injectable({ providedIn: 'root' })
class ColorSchemeWatcher {
  readonly scheme: Signal<AveColorScheme>;

  constructor() {
    const document = inject(DOCUMENT);
    const root = document.documentElement;
    const view = document.defaultView;
    const attribute = signal(root.getAttribute('data-theme'));
    const systemDark = signal(false);
    this.scheme = computed(() => {
      const theme = attribute();
      if (theme === 'light' || theme === 'dark') return theme;
      return systemDark() ? 'dark' : 'light';
    });
    if (!isPlatformBrowser(inject(PLATFORM_ID)) || view === null) return;

    // The native query, not CDK's MediaMatcher, which adds a <style> element that a strict style-src blocks (ADR 0091).
    const system = view.matchMedia('(prefers-color-scheme: dark)');
    const follow = (event: MediaQueryListEvent) => {
      systemDark.set(event.matches);
    };
    systemDark.set(system.matches);
    system.addEventListener('change', follow);
    const changes = new MutationObserver(() => {
      attribute.set(root.getAttribute('data-theme'));
    });
    changes.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    inject(DestroyRef).onDestroy(() => {
      system.removeEventListener('change', follow);
      changes.disconnect();
    });
  }
}

/**
 * The theme the page shows (ADR 0092): `data-theme` on `<html>`, which `AveTheme` writes, or the system's
 * `prefers-color-scheme` while it has none; followed as either changes, and never written, so it agrees with whatever
 * set the attribute. A `[data-theme]` island inside the page does not change it. `light` on the server. Call it in an
 * injection context.
 *
 * ```ts
 * protected readonly dark = computed(() => this.scheme() === 'dark');
 * private readonly scheme = aveColorScheme();
 * ```
 *
 * @alpha
 */
export function aveColorScheme(): Signal<AveColorScheme> {
  return inject(ColorSchemeWatcher).scheme;
}
