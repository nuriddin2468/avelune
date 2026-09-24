# 0009. Logical-properties lint: `stylelint-plugin-logical-css`

- Status: Accepted (2026-09-23, product-owner go-ahead)
- Date: 2026-09-23
- Related: 0004

## Context

The brief names `stylelint-use-logical-spec` to enforce logical properties. As of 2026-09-23:

| Plugin | Version | Peer `stylelint` | Last publish | Maintainers | Coverage (per README) |
|---|---|---|---|---|---|
| `stylelint-use-logical-spec` | 5.0.1 | `>=11 <17` | 2024-10-24 | none listed | properties, values |
| `stylelint-use-logical` | 2.1.3 | `>=11 <18` | 2026-02-04 | 3 (csstools) | properties, values (`float`, `text-align`); **no units** |
| `stylelint-plugin-logical-css` | 2.1.0 | `^14 \|\| ^15 \|\| ^16 \|\| ^17` | 2026-03-29 | 1 | properties, keywords, **units** (`vh` → `vb`, and so on) |

We use Stylelint 17.15.0. `stylelint-use-logical-spec` doesn't support it and appears unmaintained.

## Decision

- Use **`stylelint-plugin-logical-css` 2.1.0**, with its README rules `logical-css/require-logical-properties`, `logical-css/require-logical-keywords` and `logical-css/require-logical-units` at `error`.
- The rule names are re-verified against the installed version in Phase 3 (rule 1: verify, never recall) and recorded in `packages/stylelint-config`.
- Violation fixtures (`margin-left`, `padding-right`, `left:`, `width` vs `inline-size`, `text-align: left`, `float: left`, `100vh`) prove each rule fires.

## Alternatives considered

- **`stylelint-use-logical-spec` with Stylelint 16:** downgrading the linter to fit a stale plugin. Rejected.
- **`stylelint-use-logical`:** better maintained (3 maintainers), but it can't flag physical viewport units, which we want banned. It is the **fallback** if the chosen plugin stalls: swap it in and add a small custom rule for units.
- **A custom rule for everything:** more code to own for a solved problem. Rejected.

## Consequences

- Physical properties, keywords and units are errors in kit and consumer CSS, because the shared config ships the rules.
- **Single-maintainer risk:** tracked in ROADMAP.md. The fixture tests make a swap to the fallback safe, because they prove the replacement still rejects every case.
- Whether `width` / `height` are flagged is set via the plugin's options, decided and documented in Phase 3 together with the fixtures.

## Addendum: rule names and options (Phase 3, 2026-09-24)

Re-verified against the installed 2.1.0: `logical-css/require-logical-properties`, `logical-css/require-logical-keywords`, `logical-css/require-logical-units`. `width` and `height` are flagged (use `inline-size` and `block-size`). The only ignored properties and keywords are those whose logical form is missing at the browser floor, derived from MDN browser-compat-data by a test (ADR 0024).
