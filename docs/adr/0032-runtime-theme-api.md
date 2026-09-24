# 0032. Runtime API: provideAvelune() and AveTheme in @avelune/ui/theme

- Status: Accepted (2026-09-24, technical decision within Phase 4)
- Date: 2026-09-24
- Related: 0001, 0017, 0030, 0031; brief §6.6

## Context

Brief §6.6 asks for `provideUi({ theme, density, motion })` at bootstrap (here `provideAvelune`), and a service with signals for the theme (`light | dark | system`), the density and the motion preference. The service writes the `data-*` attributes on `<html>` and keeps the user's choice. Facts:

- `tokens.css` (ADR 0017) reads three attributes:
  - `data-theme`: `light` and `dark` force a theme; without it, `prefers-color-scheme` decides;
  - `data-density`: `compact`;
  - `data-motion`: `reduced` forces reduced motion; without it, `prefers-reduced-motion` decides.
  No attribute forces full motion over a system that asks for less.
- `localStorage` may be missing, may throw on access (sandboxed frames, blocked storage) and may throw on write (quota). A `storage` event reaches the other tabs of the origin.
- Angular 22: `makeEnvironmentProviders` and `provideEnvironmentInitializer` create a service at bootstrap. `DOCUMENT` works on the server too.

## Decision

1. **Entry point `@avelune/ui/theme`**, layer `foundations`. A service has no harness, so there is no `testing` entry point.
2. **Types:** `AveThemePreference = 'light' | 'dark' | 'system'`, `AveDensity = 'comfortable' | 'compact'` and `AveMotionPreference = 'system' | 'reduced'`. There is no `full`, since it could not override the system.
3. **`AveTheme`** (`providedIn: 'root'`) exposes read-only signals `theme`, `density` and `motion`, and the methods `setTheme`, `setDensity` and `setMotion`. A method writes the signal, the attribute and the stored choice at once, so no effect has to run first. `system`, and the default density, remove their attribute.
4. **Persistence:** one JSON value under `avelune:preferences`. When read, unknown values are dropped. Every storage failure is caught; a choice then lasts for the visit. A `storage` event with that key, or a cleared storage, updates the signals and the attributes. The listener goes with the application (`DestroyRef`).
5. **`provideAvelune(options)`** takes the defaults for a first visit (`theme`, `density`, `motion`) and `persist` (default `true`). A stored choice wins over a default. It creates `AveTheme` in an environment initializer, so the attributes are written before the first render.
6. **Server rendering:** the attributes are written to the server document, so the HTML arrives with them. Storage is read and written only in the browser.
7. **Tests** (`ui:test`, Chromium): the defaults, bootstrap, restore, invalid stored values, each setter, `persist: false`, other tabs, destruction, throwing storage and the server platform. Real `localStorage` and `StorageEvent` are used.

## Alternatives considered

- **Writable signals with an effect** that writes the attributes: the effect runs later than the change, and a test would have to flush it.
- **Always writing every attribute** (`data-theme="system"`): tokens.css has no block for it, and a missing attribute already means "follow the system".
- **A cookie instead of `localStorage`:** only server rendering would need it; revisit when a consumer does.

## Consequences

- A stored choice takes effect only once the application's script runs. Until then the page follows the system, so a user who chose dark on a light system sees a light canvas first. The fix is a small inline script in `index.html` that applies the stored choice before the stylesheet paints. `ng add` (Phase 6) adds it, after checking the consumer's CSP.
- Storybook's toolbar keeps writing the attributes itself, since stories run outside an application with `provideAvelune`.
