# 0070. Breadcrumbs: a trail from data, links through Angular's router, the current page as text

- Status: Accepted (2026-09-29; the look chosen by the product owner, the rest a technical decision within Wave 4)
- Date: 2026-09-29
- Related: 0002, 0033, 0036, 0047; brief §9.1, §9.4; WAI-ARIA APG "Breadcrumb"

## Context

Brief §9.4 lists Breadcrumbs in Wave 4. Facts, verified on 2026-09-29 (Angular 22.2.0, `@angular/router` 22.2.0, Chromium 153):

- The APG breadcrumb is a `nav` landmark with a name, an ordered list of links, and `aria-current="page"` on the current page. It needs no keyboard behaviour of its own: links are native.
- Projected content keeps the styles of the view that declared it (ADR 0062): a trail of the application's own `<li>` and `<a>` elements could not take the kit's look without a kit directive on each of them.
- Every work system on the kit routes with `@angular/router`; its `RouterLink` takes a path or the router's commands (`readonly any[] | string | UrlTree`). `@avelune/ui` did not peer the router yet.
- WCAG 2.5.8 asks 24px targets or 24px of room around smaller ones; a 14/20 link is 20px tall.

## Decision

1. **`@avelune/ui/breadcrumbs`** (layer components), `AveBreadcrumbs` (`<ave-breadcrumbs>`): `items` (required), the pages above this one as `AveBreadcrumb` (`label`, `link`: a path or the router's commands), and `current` (required), the current page's name. The kit draws the `nav`, named `breadcrumbs` from the kit's messages ("Навигационная цепочка"), an `ol`, a `RouterLink` per item, a `chevron-right` after it, and the current page as text with `aria-current="page"`.
2. **`@avelune/ui` peers `@angular/router` `^22.2.0`**, for this and the navigation components after it; `@angular/router` is already every consumer's.
3. **Look (product owner, 2026-09-29):** links in `fg.muted`, not underlined, underlined and in `fg.default` under the pointer, on `duration.instant`; the chevron in `fg.subtle`, 16px, 4px from the words on each side; the current page in `fg.default`. `font.body-md` on 24px lines, and each link padded to a 24px target; a long trail wraps between items, a long name inside itself, its words flowing as text so the chevron follows the last word.
4. **Harness:** `AveBreadcrumbsHarness` (`@avelune/ui/breadcrumbs/testing`): the name, the links' words and addresses, the current page, following a link.

## Alternatives considered

- **Projected links (`<a aveBreadcrumb routerLink>`):** the kit could draw neither the list items nor the separators around the application's links without a directive on each, and the last item's `aria-current` would be the application's to remember.
- **A router-free `href`:** every click would load the whole application again.
- **The current page as a link to itself** (the APG example): a link that goes nowhere; the text with `aria-current` names the page the same way.
- **Collapsing a long trail into a menu:** no screen has more than three levels yet; wrapping keeps every level readable.

## Consequences

- Stories and specs that draw the trail provide a router (`provideRouter`); the stories use hash locations, so a click stays inside Storybook's frame.
- The showcase's contract page (`/contracts/:id`) shows the trail; the register links each contract's number to it.

## Addendum: a name of the page's own (2026-09-29)

The docs page, which draws the stories together, broke axe's `landmark-unique` with three landmarks named "Навигационная цепочка", as a page with a second trail would (the first visual run of Wave 4). `label` (optional) names the landmark; the kit's words stay the default.
