# 0021. Accent fill: back to the nearest passing step

- Status: Accepted (2026-09-23, product owner)
- Date: 2026-09-23
- Related: supersedes 0019; restores the accent-fill rule of 0011 and its generator addendum

## Context

At the Foundations milestone the product owner first chose the exact brand colour `#e95420` with dark text as the accent fill (ADR 0019). After seeing it applied, the product owner asked in the same session to return to the previous colour.

## Decision

- `color.accent.bg` is **orange 600** (`#b53700`) with **white** text in the light theme (5.98:1); hover orange 700, pressed orange 800.
- In the dark theme it is **orange 400** with **neutral 950** text; hover orange 300, pressed orange 200 (ADR 0011, addendum "dark fills").
- The exact brand colour stays `color.brand.mark`, for marks only and `neverText`.
- ADR 0019's other decision stands: **one accent** for primary actions, selection and focus, no separate "suggested action" colour.

## Alternatives considered

- **Keep ADR 0019** (exact brand colour with dark text): the product owner withdrew it.

## Consequences

- The token values are those of the Foundations review before ADR 0019; `tools/tokens-check` passes all 264 pairs.
- A future change of the accent fill needs a new ADR and the product owner.
