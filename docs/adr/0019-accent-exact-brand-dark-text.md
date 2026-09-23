# 0019. Accent fill: the exact brand colour with dark text

- Status: Superseded by [0021](0021-accent-nearest-passing-step.md) (2026-09-23, product owner); its "one accent" decision is carried over into 0021
- Date: 2026-09-23
- Related: 0011 (supersedes the accent-fill bullet of its generator addendum), 0016

## Context

The Foundations proposal filled primary actions with orange 600 (`#b53700`) and white text (5.98:1), because the brand colour `#e95420` gives 3.65:1 with white. With dark text, neutral 950 (`#1e1b1a`), the exact brand colour gives 4.69:1. The product owner asked for the exact colour ("желательно точный") and for a single orange accent, not a separate "suggested action" colour (audit.md §3).

## Decision

- `color.accent.bg` is **orange 500, the exact brand colour, in both themes**, and `color.fg.on-accent` is **neutral 950** in both themes.
- Hover and pressed get **lighter**: `bg-hover` orange 400 (7.56:1 with the text), `bg-active` orange 300 (10.75:1). A darker step would take the dark text below 4.5:1 (orange 600 gives 2.86:1).
- The fill stays at least 3:1 against every surface it sits on (light 3.30–3.65:1, dark 3.62–4.69:1), so a checked checkbox or switch keeps its boundary (WCAG 1.4.11).
- Unchanged: accent text and links (`accent.fg`, `fg.link`) stay orange 600 in light and orange 400 in dark, since text on a surface needs 4.5:1; the focus ring stays orange 600 / 400; status fills keep white text in light and dark text in dark. `color.brand.mark` remains the marks-only token and `neverText`.
- One accent: primary actions, selection and focus all use it. There is no separate "suggested action" colour.

## Alternatives considered

- **Orange 600 with white text** (the proposal): passes, but is not the brand colour. The product owner preferred the exact colour.
- **Darker hover with white text:** the label would switch from dark to white between rest and hover. Rejected.
- **A Yaru-style green primary action:** rejected by the product owner for now.

## Consequences

- The primary button's label is dark, while the danger button's label is white in the light theme. Components read the on-colour token of their role, never a literal.
- The lighter hover and pressed states are reviewed on real buttons at the Wave 1 calibration milestone.
