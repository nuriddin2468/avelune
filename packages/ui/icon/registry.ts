import { InjectionToken, inject, type Provider } from '@angular/core';
import type { AveIconDefinition, AveIconName } from './types';

/** The icons registered for an injector: its own, and every ancestor's (ADR 0036). */
const AVE_ICONS = new InjectionToken<ReadonlyMap<AveIconName, AveIconDefinition>>('AVE_ICONS', {
  providedIn: 'root',
  factory: () => new Map(),
});

/** Adds icons to the registry of an ancestor; one name keeps one drawing, which development checks. */
function withIcons(
  inherited: ReadonlyMap<AveIconName, AveIconDefinition> | null,
  icons: readonly AveIconDefinition[],
): ReadonlyMap<AveIconName, AveIconDefinition> {
  const registry = new Map(inherited ?? []);
  for (const icon of icons) {
    const registered = registry.get(icon.name);
    if ((typeof ngDevMode === 'undefined' || ngDevMode) && registered !== undefined && registered !== icon) {
      throw new Error(
        `provideAveIcons: "${icon.name}" is already registered with another drawing; give one of the two another name.`,
      );
    }
    registry.set(icon.name, icon);
  }
  return registry;
}

/**
 * Registers icons for `<ave-icon>` (ADR 0036): Lucide's, from `@avelune/icons/lucide`, and an application's own,
 * from `defineAveIcon`. Only the icons registered reach the bundle. Use it in the application's providers, a
 * route's or a component's: every `<ave-icon>` below sees the icons of its own injector and of every ancestor.
 *
 * ```ts
 * import { lucideCalendar, lucideDownload } from '@avelune/icons/lucide';
 *
 * providers: [provideAveIcons([lucideCalendar, lucideDownload])];
 * ```
 *
 * The whole Lucide set at once, about 75 kB brotli: `provideAveIcons(lucideIcons)`, with `lucideIcons` from
 * `@avelune/icons/lucide/all`. In development, one name registered with two different drawings throws.
 *
 * @alpha
 */
export function provideAveIcons(icons: readonly AveIconDefinition[]): Provider {
  return {
    provide: AVE_ICONS,
    useFactory: () => withIcons(inject(AVE_ICONS, { skipSelf: true, optional: true }), icons),
  };
}

/** The icons registered for the injector of the caller. */
export function injectAveIcons(): ReadonlyMap<AveIconName, AveIconDefinition> {
  return inject(AVE_ICONS);
}
