# 0020. Icons: Lucide

- Status: Accepted (2026-09-23, technical decision delegated by the product owner at the Foundations milestone)
- Date: 2026-09-23
- Related: brief §4.2 (icon sizes), Phase 4 (icons package)

## Context

The icons package (Phase 4) generates an `IconName` union from a set of SVGs and ships `<ave-icon>`. Icons appear at 16, 20 and 24 px next to IBM Plex Sans. Candidates, checked on npm on 2026-09-23: `lucide-static` 1.47.0 (ISC, 2112 SVGs, last release 2026-09-17), `@tabler/icons` 3.48.0 (MIT, last release 2026-09-22), `@phosphor-icons/core` 2.1.1 (MIT, last release 2024-03-29), Material Symbols (Apache 2.0).

## Decision

- **Lucide**, taken as plain SVG files from `lucide-static`; no framework package, no runtime dependency. The icons package copies the icons the kit uses, normalises them and generates `IconName`.
- **One style:** outline on a 24 px grid, round caps and joins, `currentColor`. The stroke width is set once for the kit; 2 px at 24 px is the default, and Phase 4 tunes it (for example 1.75 at 20 px) against Plex at the three icon sizes, then freezes it.
- The version is pinned under the 24-hour rule and recorded in compatibility.md when Phase 4 installs it.

## Alternatives considered

- **Tabler:** the same outline style with more icons (MIT). The fallback if Lucide lacks icons the kit needs; mixing sets is not allowed.
- **Phosphor:** six weights invite inconsistency, and the core package had no release since March 2024. Rejected.
- **Material Symbols:** Google's visual language, delivered mainly as an icon font. Rejected.

## Consequences

- An icon Lucide lacks is drawn to Lucide's grid and stroke rules in the icons package, or the set moves to Tabler through a new ADR; never an icon from a third set.
- The ISC licence text ships with the icons package.
