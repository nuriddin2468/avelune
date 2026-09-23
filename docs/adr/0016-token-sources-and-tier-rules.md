# 0016. Token sources: files, tier rules, literal values

- Status: Accepted (2026-09-23, technical decision within Phase 2)
- Date: 2026-09-23
- Related: 0003, 0005, 0011

## Context

ADR 0003 lists six DTCG source files and the rule component → semantic → primitive. Writing the full token set (brief §4.2, §6.2) raised four questions ADR 0003 does not answer:

1. Theme-independent semantic tokens (spacing, sizes, radii, typography, z-index) would have to be duplicated in both theme files for the light/dark parity check to hold.
2. Reduced motion (brief §6.5) is a set of token overrides, like density, but has no source file.
3. Some semantic values come from no scale: durations, easings, z-index, `motion.scale.enter`, and DTCG's typography `lineHeight`, which is a unitless ratio. A primitive per value would only rename it.
4. DTCG 2025.10 cannot express the `linear()` spring easing of §6.2.

## Decision

- **Source files and tiers** (`packages/tokens/src`):

  | File | Tier | Holds |
  |---|---|---|
  | `primitives.color.tokens.json` (generated, ADR 0011) | primitive | colour scales, white, alpha series |
  | `primitives.tokens.json` | primitive | `dimension` (px), `font-family`, `font-weight` |
  | `semantic.tokens.json` | semantic | theme-independent: space, size, radius, border-width, focus-ring, font, z-index, breakpoint, container |
  | `semantic.light.tokens.json`, `semantic.dark.tokens.json` | semantic | colour roles and elevation, per theme |
  | `motion.tokens.json` | semantic | duration, easing, motion distance and scale, timing |
  | `motion.reduced.tokens.json` | semantic | reduced-motion overrides |
  | `component.tokens.json` | component | tokens a component must expose to be themable (density) |
  | `density.compact.tokens.json` | component | compact overrides |

- **Overrides:** the dark file declares exactly the names of the light file; the reduced and compact files declare only names that exist in `motion` and `component`.
- **References:** primitives hold literal values only. In the semantic and component tiers, every value of type colour, dimension, font family or font weight, including those inside shadow and typography composites, is a reference to the tier directly below. Semantic tokens reference primitives, component tokens reference semantic tokens.
- **Literals allowed in the semantic tier**, because no scale exists for them: durations, cubic Béziers, and numbers (z-index, `motion.scale.enter`, typography `lineHeight`). `lineHeight` is the DTCG ratio; font size × ratio must land on the 4px grid (±0.01px).
- **`easing.spring`** is a `cubicBezier` token whose value is an overshooting fallback. The exact curve is in `$extensions.avelune.linear` (stops of a damped spring, damping ratio 0.65), and the CSS build emits `linear(…)` from it.
- **Additions to the brief's minimum set**, presented for approval at the Foundations milestone: state layers `color.bg.hover`, `color.bg.active`, `color.bg.disabled`; `color.fg.on-{info,success,warning,danger}`; `size.control.xs` (reached only by compact density); and a `timing` group for the catalog's non-transition timings (tooltip delay, spinner delay and minimum visibility, stagger, shimmer and spinner periods). The five durations and four easings of §6.2 are unchanged.

## Alternatives considered

- **Theme-independent tokens in the light file, with dark overriding only colours:** the parity check becomes "dark ⊆ light", which cannot catch a colour missing from dark. Rejected.
- **A primitive for every duration, z-index and ratio:** a second name for each value, no reuse, and still a literal at the bottom. Rejected.
- **Line height as a dimension:** DTCG types `lineHeight` as a number, and the schema check would reject it. Rejected.
- **A custom `$type` for `linear()`:** invalid DTCG, so every standard tool would reject the file. Rejected.

## Consequences

- `tools/tokens-check` enforces the tier of each file, the override rules, the reference rules and the line-height grid (Phase 2).
- Every additional token above is reviewed with the Foundations screenshots; if the product owner rejects one, it is removed before any component uses it.
