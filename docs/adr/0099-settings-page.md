# 0099. SettingsPage: sections as pages in a column at the start, or the list and then a section on a phone

- Status: Accepted (2026-09-30; the column, the addresses and the phone's order are the product owner's, "Wave 6 looks" in ROADMAP.md; the rest is the agent's, for the product owner's taste at the wave's review)
- Date: 2026-09-30
- Related: 0072, 0089, 0091, 0096; brief §9.4; WCAG 2.2 SC 2.4.3

## Context

- The product owner chose (2026-09-30): the sections in a column at the start (Profile, Appearance, Brand, Notifications…), each a page with its own address; on a phone the list of sections, then a section. The tenant's brand screen is one of them (ADR 0089).
- A section's address is the application's route (`/settings/brand`). Its content comes through the application's `<router-outlet>`. SidebarNav already draws pages from data with the current one from the router (ADR 0072).
- On a phone the settings' own address (`/settings`) shows the list. From `container.md` it shows the column and a section beside it, so it has to open one.
- Choosing a section on a phone hides the list, the focused link with it, as ListDetail's record does (ADR 0096).

## Decision

1. **`<ave-settings-page heading description [sections] sectionsLabel home backLabel>` in `@avelune/ui/settings-page`** (layer `patterns`):
   - It draws the page's `h1` and `description`, then the sections and the section the address names, the application's `<router-outlet>` as its content.
   - `sections` are `{ label, link, icon }`, drawn by SidebarNav in a navigation named by `sectionsLabel` (the new `settingsSections` message, "Разделы настроек").
   - `home` is the settings' own address, `/settings` by default.
2. **From `container.md`** the sections stand in a 256px column at the start, the section beside it, 24px apart. At `home` itself the page opens the first section, replacing the address, so the column never stands beside nothing.
3. **Below `container.md`** one shows.
   - At `home`, the list of sections.
   - At a section's address, the section under a ghost link back to `home`: "Все настройки", the new `allSettings` message, or `backLabel`.
   - CSS hides the other part by a container query and `data-view`, which follows the router.
4. **Focus follows the part that shows,** as in ListDetail. It moves to the link back when the list hides with focus in it, and returns to the section's link in the list on the way back.
5. **The width in TypeScript** is only for opening the first section. It is measured on the page (`ResizeObserver`) against `container.md`, read from the token (ADR 0091).
6. **Checks:** `AveSettingsPageHarness`, unit tests in Chromium with a router on both sides of `container.md`, stories, and the showcase's settings. Its sections are Profile, Appearance (theme, density, motion through `AveTheme`), the organisation's brand, and Notifications. The brand section chooses a preset or a `#rrggbb` colour, uploads the light and dark logos, previews both themes, and says what the generator adapted (ADR 0089).

## Alternatives considered

- **ListDetail with the router's outlet as its record:** its panes are 2 : 3, where settings need a narrow column of names. Its `detail` is the application's state, where a section is the address.
- **Tabs for the sections:** tabs never change the address (ADR 0071), and the product owner gave each section its own.
- **A redirect from `/settings` to the first section in the routes:** on a phone the list would never show.

## Consequences

- The kit's messages gain `settingsSections` and `allSettings`.
- The showcase's settings become a parent route with four children. The shell's logo follows the brand section's uploads.
