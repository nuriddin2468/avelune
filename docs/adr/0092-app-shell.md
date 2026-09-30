# 0092. App shell: the application bar with the logo, the navigation as a column or a drawer, one main

- Status: Accepted (2026-09-30, technical decision within Wave 6; the logo in the application bar is the product owner's, 2026-09-30; the rest is the agent's, for the product owner's taste at the wave's review)
- Date: 2026-09-30
- Related: 0032, 0061, 0063, 0066, 0067, 0072, 0089, 0091; brief §9.4; WCAG 2.2 SC 2.4.1

## Context

- The showcase's shell (`apps/showcase/src/app/app.ts`) is the layout every product needs: a bar with the product's name and the view's switches, a maintenance banner, the SidebarNav as a column from `breakpoint.md` and in a drawer from the start below it (Wave 4), and the screen beside it. Its drawer stays open when the window widens past 840px, over a page that now shows the column.
- A tenant sets a logo in the running system (ADR 0089). The kit's theme can differ from the system's (`data-theme`), so `<picture>` with `prefers-color-scheme` would show the light logo on a dark bar. `AveTheme` has the preference (`light`, `dark`, `system`), not the theme the page shows, and writes its preference to `<html>` when it is created (ADR 0032).
- WCAG 2.4.1 is met by landmarks, but a keyboard user without a screen reader Tabs through the bar and every navigation link on every page. A fragment link (`href="#main"`) changes the address the router reads, and with hash routing it is the route.

## Decision

1. **`<ave-app-shell>` in `@avelune/ui/app-shell`** (layer `patterns`, ADR 0091). It draws, in order: a skip link, the bar (`header`, the banner landmark), the application's banners (`[aveAppShellBanner]`), and the body with the navigation and `main`, which holds the shell's content.
2. **The bar,** on `bg.surface` over a `border.subtle` line. Its row is as tall as a medium control plus 8px above and 8px to the line: 52px, 48px compact.
   - The navigation's button, a ghost IconButton (`menu`) named by `navigationLabel` with its tooltip and `aria-haspopup="dialog"`, shows below `breakpoint.md` only.
   - The home link (`home`, `/` by default) holds the logo and the product's name (`product`, in `font.label-md`). It is underlined under the pointer only, as Breadcrumbs' links are (ADR 0070).
   - `[aveAppShellActions]` sits at the inline end, the application's items 8px apart.
   - The name wraps, and then the logo shrinks, so the bar never scrolls at 320px.
3. **The logo** is `logo: { src, darkSrc?, alt }`, the application's image with no token (ADR 0089).
   - It is 32px tall (`size.control.sm`) and at most five times as wide, drawn whole at the start.
   - The dark bar takes `darkSrc` when there is one. `aveColorScheme()` in `@avelune/ui/theme` gives the theme the page shows (`light` or `dark`): `<html>`'s `data-theme`, or `prefers-color-scheme` while it has none, both followed and never written. Reading the page, not `AveTheme`, keeps it right wherever the attribute comes from; creating `AveTheme` would write its own preference over Storybook's toolbar. A `[data-theme]` island does not change it, so a preview of both logos draws each image itself.
   - `alt` is required. It names the organisation the logo stands for, or is empty when the product's name beside it says the same.
   - It is a plain `<img>`, so it takes its width from its own aspect ratio. `NgOptimizedImage` refuses data URLs (NG02952), which a tenant's upload often is, and needs a size that only the image knows; that one line disables `prefer-ngsrc` with this reason. Avatar's background (ADR 0082) fits a square, not a logo of unknown proportions.
4. **The navigation** is `navigation: AveSidebarEntry[]`, drawn by SidebarNav (ADR 0072), since the shell draws it in two places.
   - From `breakpoint.md` it is a sticky column 256px wide (`space.16` × 4), which scrolls on its own. Below it, it sits in a start drawer of the small size (ADR 0067), headed by `navigationLabel`.
   - CSS decides which one shows. The drawer (`navigationOpen`, a model) closes on navigation and when the window reaches `breakpoint.md`, read from the token's custom property and matched with `matchMedia` (ADR 0091).
   - Without `navigation` there is no column, no button and no drawer.
5. **Main** is `main`, 24px from the bar and 16px from the window's sides, and 24px from `breakpoint.md`. It is `tabindex="-1"` with an inset ring (`data-focus-ring="inset"`).
6. **Skip link.** The first Tab stop is a secondary Button link, "Перейти к содержимому" (the new `skipToContent` message). It is clipped out of sight until it has keyboard focus, then shows over the bar's start. Pressing it moves focus to `main` by script and leaves the address alone. `navigation` names the navigation when `navigationLabel` is not set (a new message).
7. **Checks:** the harness (`AveAppShellHarness`), unit tests in Chromium at both sides of `breakpoint.md` (`page.viewport`), stories, and the showcase's shell. Stylelint's `@layer patterns` and `avelune/pattern-layout-only` are proven by fixtures that lint as `app-shell.css` (ADR 0091).

## Alternatives considered

- **An application bar alone, the rest left to the application:** every product would rebuild the column, the drawer and their switch, which the showcase got wrong once.
- **A projected navigation (`<ave-sidebar-nav aveAppShellNav>`):** content cannot be projected into two places, and moving one instance between the column and a modal dialog would destroy its state anyway.
- **Choosing the logo in CSS** (`:host-context([data-theme='dark'])`): it cannot tell the nearest theme from an outer one, and with the system theme it would need the media query and the attribute together.
- **No skip link, landmarks only:** meets 2.4.1, but leaves keyboard users without a screen reader to Tab through every page's navigation.

## Consequences

- The showcase's `app.ts` keeps its switches and banner as content; its layout CSS goes.
- `aveColorScheme()` and `AveColorScheme` are new public API in `@avelune/ui/theme` (alpha).
- The skip link's and the navigation's names join the kit's messages in the four locales.
