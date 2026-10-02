# Audit

Date: 2026-09-23. Phase 0.

## 1. Consumer repositories

`EXISTING_REPOS: none`. There is no consumer code to audit yet, so there are no counts of raw colours, spacings, radii or duplicated components. When a consumer repo becomes available, run `tools/adoption-metrics` against it (Phase 6) and append the results here.

### 1.1 e-archive `apps/web`, baseline (2026-10-02)

The product owner's document archive (`~/Desktop/archive project`, read only), whose UI the pilot rebuilds on the kit in a new repository. It is an Angular 22 application on `@ijro-devs/ui-kit` and Tailwind. Scanned with `tools/adoption-metrics` (ADR 0105), `node tools/adoption-metrics/src/cli.ts "<archive>/apps/web"`, with no file written in the archive:

| Metric | Count |
|---|---:|
| Raw colours | 36 |
| Raw pixel values | 72 |
| Raw interactive elements | 495 |
| Local keyframes | 9 |
| `::ng-deep` | 0 |
| `--ave-*` declared or unknown | 0 |
| Inline styles in templates | 12 |
| Banned or deep imports | 0 |

- The scan covered 3 stylesheets, 10 component styles, 163 templates (one HTML file, the rest inline) and 257 scripts. `@avelune/ui` is not installed.
- Not counted: Tailwind's utility classes, which the tool does not scan, and `public/`, which holds the vendored PDF viewer. Counted with it, the viewer added 892 raw colours and 1815 raw pixel values.
- Where the counts are: `src/styles/app.css` holds 29 of the raw colours and 57 of the raw pixel values. The raw elements are mostly `<button>`s in the feature components, for example 16 in `bayonnoma-panel.ts` (checked against the source), 27 in `digitisation-workspace.ts`.
- What it means for the pilot: the pilot is a new repository on the kit, so its own baseline is zero (scanned on 2026-10-02, `adoption-baseline.json` in `~/Desktop/avelune-pilot`), and `--ratchet` against that zero keeps it there. Migrating the archive itself would replace about 500 native controls with the kit's directives and move the 36 colours and 72 lengths of its stylesheet onto tokens.

## 2. Design source

`DESIGN_SOURCE: none`. The stated direction is "inspired by Ubuntu". To keep that grounded in real values rather than memory, this section records what the Ubuntu desktop stack actually ships, read from source on 2026-09-23:

- **Yaru** (Ubuntu's theme): `github.com/ubuntu/yaru`, `gtk/src/default/gtk-4.0/_palette.scss`, `_colors.scss`, `_common.scss`
- **libadwaita** (GNOME's base style, which Yaru tracks): `gitlab.gnome.org/GNOME/libadwaita`, `src/stylesheet/_common.scss`, `_colors.scss`, `_palette.scss`, `widgets/*.scss`

Nothing is copied: we take ratios and principles, not assets or exact values.

### 2.1 Colour

| Role | Yaru | libadwaita | Note for Avelune |
|---|---|---|---|
| Brand accent | `#E95420` orange | `--accent-blue #3584e4` (user-selectable accents) | White on `#E95420` = 3.65:1, which **fails** 4.5:1 for text. The "nearest passing step" rule in ADR 0011 applies. |
| Primary ("suggested") action | **green** `#0e8420` lightened when the accent is orange | same as accent | Yaru separates "accent/selection" from "do it" actions. Worth a deliberate decision at the Foundations milestone. |
| Secondary brand | aubergine family `#77216F`, `#5E2750`, `#2C001E` | none | Candidate for a tinted neutral or for dark surfaces |
| Warm neutral | `#AEA79F` warm grey | neutral greys, slightly blue (`#fafafb`, `rgb(0 0 6 / 80%)`) | Both stacks tint their neutrals. This supports the brief's chroma 0.005–0.015 toward the brand hue. |
| Light window / view | `#FAFAFA` / `#FFFFFF` | `#fafafb` / `#ffffff` | Canvas slightly off-white, content surface white |
| Dark window / view | `#2C2C2C` / `#272727` | `#222226` / `#1d1d20`; popover and dialog `#36363a` | Higher surfaces are **lighter** in dark mode, matching the brief |
| Dark foreground | `#F7F7F7` | white at 100% | The brief asks for about L 0.93, softer than both |
| Muted text | opacity 0.55 (`$dim_label_opacity`) | `--dim-opacity: 55%` | We use solid colours, not opacity, so contrast is computable (ADR 0011) |
| Link | accent optimised to 6:1 (light) and 5.5:1 (dark) against bg | derived from accent in OKLab | Yaru computes link contrast programmatically, the same idea as `tools/tokens-check` |
| Error / warning / success | `#c7162b` / `#f99b11` / `#0e8420` | red_3, yellow_5, green_4 | Status hues for the status scales |

### 2.2 Shape and size

| Metric | Yaru | libadwaita |
|---|---|---|
| Button radius | 6px | **9px** |
| Menu / menu item radius | 8px | 9px |
| Card radius | none | 12px |
| Popover radius | 15px | `menu_radius + 6` = 15px |
| Dialog / window radius | 15px | `button_radius + 6` = 15px |
| Button height | 24 min-height + padding | 24 + 2 × 5 padding = **34px** |
| Entry height | none | **34px** |
| Menu item margin / padding | none | 6px / 12px |
| Switch | none | radius 14, thumb 20 × 20, padding 3 |

libadwaita applies the **concentric rule** explicitly: popover radius = menu-item radius + the 6px gap between them, and dialog radius = button radius + 6. Avelune adopts this rule (brief §4.2). Both stacks use odd values (5, 9, 15, 34) that don't sit on a 4px grid. Avelune keeps the proportions and snaps them to the 4px grid (for example, a 36px control for 14/20 text, see §3).

### 2.3 Motion

| | Yaru / libadwaita |
|---|---|
| Durations | almost everything is 200ms; 300ms in one place |
| Easing | `ease-out-quad` `cubic-bezier(0.25, 0.46, 0.45, 0.94)` |
| Pattern | `transition: all 200ms` on buttons (Yaru); libadwaita narrows it to `background` and `box-shadow` |
| Focus ring | animates `outline-width` / `outline-offset` over 200ms |

The GNOME feel is calm, short and uniform. Avelune's motion tokens (brief §6.2) are more differentiated. Two things deliberately differ from GNOME: the focus ring is **not** animated (brief §6.1), and `transition: all` is banned.

### 2.4 Typography

Yaru uses bold (700) button labels and `font-size` percentages (90%, 110%, 150%, 240%). Avelune uses role-based composite tokens with at most three weights. IBM Plex Sans, the selected font, was checked for coverage (see [compatibility.md](compatibility.md) §4).

## 3. Implications for token design (input to Phase 2)

1. Control height for `md` at 14/20 text: 36px (4px grid, close to libadwaita's 34). `sm` 32, `lg` 40. To be confirmed visually at the Foundations milestone.
2. Radius tiers follow the concentric rule: control `md` 6–8, menu item = control radius, popover/card = item radius + gap. Confirmed visually at the Foundations milestone.
3. Neutrals are tinted toward the brand hue. Dark surfaces get lighter with elevation.
4. Muted text is a solid colour, never opacity.
5. Decide explicitly whether the primary action uses the accent (libadwaita) or a separate "suggested" colour (Yaru). The default proposal is one accent (simpler, one primary per region), presented at the Foundations milestone.

## 4. Component duplication

Not applicable: there are no consumer repos. Component priority follows the waves in [ROADMAP.md](ROADMAP.md).
