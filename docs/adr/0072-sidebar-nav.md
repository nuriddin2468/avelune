# 0072. SidebarNav: the product's navigation from data, current pages from the router, groups that disclose

- Status: Accepted (2026-09-29; the current page's look chosen by the product owner, the rest a technical decision within Wave 4)
- Date: 2026-09-29
- Related: 0002, 0033, 0067, 0070, 0071; brief §9.1, §9.4; WAI-ARIA APG "Disclosure Navigation Menu"

## Context

Brief §9.4 lists sidebar navigation in Wave 4. Facts, verified on 2026-09-29 (Angular 22.2.0, `@angular/router` 22.2.0, Chromium 153):

- The APG's pattern for a site's navigation is a `nav` landmark of lists of links, with `aria-current="page"` on the current page and disclosure buttons (`aria-expanded`, `aria-controls`) for groups; its keyboard is the native Tab, Enter and Space. The menu and tree roles are for applications, not for a product's pages.
- `@angular/router` 22.2 has `isActive(url, router, matchOptions)`, a signal of whether a URL is active, exact or as a prefix. `RouterLinkActive` sets one `aria-current` value for either match.
- `@avelune/ui` peers the router since Breadcrumbs (ADR 0070); projected links could not take the kit's look (ADR 0062, 0070).
- The kit's selected bar is `border-width.selected` (2px): the tabs indicator (ADR 0071).
- A work system's navigation holds pages, groups of pages one level deep, and headed sections; on a phone it lives in a drawer (ADR 0067).

## Decision

1. **`@avelune/ui/sidebar-nav`** (layer composites), `AveSidebarNav` (`<ave-sidebar-nav>`): `label` (required, names the landmark) and `items` (required), `AveSidebarEntry`s: an `AveSidebarLink` (`label`, `link`: a path or the router's commands, `icon?`, `exact?`), an `AveSidebarGroup` (`label`, `icon?`, `items`: links) or an `AveSidebarSection` (`heading`, `items`: links and groups).
2. **Current pages from the router:** each link's address against the router's last successful navigation (`containsTree`, which `isActive` computes), in a signal, with query parameters ignored. The page itself is `aria-current="page"`; a link whose page is above the current one (`/contracts` on `/contracts/114`) is `aria-current="true"`; `exact` keeps a link from matching its sub-pages (the home page). Both look current.
3. **Groups disclose:** a native button with `aria-expanded` and `aria-controls` over its list, hidden when collapsed. A group opens by itself when navigation reaches one of its pages, and otherwise keeps what the person chose; a collapsed group that holds the current page looks current. No keyboard of the kit's own: Tab, Enter and Space are native.
4. **Look:** items of `control.height.md`, `control.padding-inline.sm` and `radius.md`, the icon 16px and 8px before the words in `font.body-md`, words wrapping; the hover fill for hover and `bg.active` while pressed. The current item (product owner, 2026-09-29) takes the neutral `bg.active` fill and a 2px accent bar at its inline start, 8px short of its top and bottom (the kit's selected width, `border-width.selected`, not 3px), its words in the text colour. A group's chevron points right when collapsed and down when open; its links are indented to its words. A section's heading is `font.label-sm` in `fg.muted`, 16px over its items, and names its list. Forced colours: the bar in `Highlight`.
5. **Harness:** `AveSidebarNavHarness` (`@avelune/ui/sidebar-nav/testing`): the name, the links shown, the current one, the groups, opening and closing a group, following a link.

## Alternatives considered

- **`RouterLinkActive`:** one `aria-current` value for the page and its section alike, and no signal to open a group with.
- **A tree (Angular Aria's) or a menu:** their roles and arrow keys tell screen readers the navigation is an application widget; the APG advises links in lists.
- **`<details>` for groups:** its content cannot be hidden and shown on the kit's own condition (the current page) without fighting its toggle, and `::details-content` is later than the browser floor.
- **Projected links:** see ADR 0070.
- **A collapsed rail of icons:** a layout of the page (Wave 6); the navigation's words are its point.

## Consequences

- The showcase's shell holds the navigation at the inline start from `breakpoint.md`, and in a drawer from the start edge below it, opened by a button in the application bar.
- A group holds links only: one level of nesting.
