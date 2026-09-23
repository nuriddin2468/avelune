# AGENTS.md

Rules for any coding agent working in this repository. This file is expanded to its full form in Phase 1. Until then, the essentials:

## Resume

1. Read [docs/ROADMAP.md](docs/ROADMAP.md): current position, parameters, first unchecked item.
2. Read the sections of [docs/BRIEF.md](docs/BRIEF.md) (the product owner's original brief) that cover that item. "brief §N" anywhere in the repo refers to that file. Where the brief's placeholders differ from the resolved parameters in ROADMAP.md, ROADMAP.md wins.
3. Read the ADRs in [docs/adr](docs/adr/README.md) that touch the area you will change.
4. Versions are pinned in [docs/compatibility.md](docs/compatibility.md). Before installing or upgrading anything, verify with `npm view <pkg> version peerDependencies` and update that file in the same change.
5. At the end of every phase or wave: update the ROADMAP checkboxes, write a short summary, and ask the product owner whether to continue in the same session or a fresh one (brief §1 rule 8). Talk to the product owner in Russian; write the docs in English.

## Non-negotiables

1. No raw values: colours, spacing, radii, shadows, z-index, font values, durations and easings come from tokens only.
2. Primitive tokens are never referenced outside `packages/tokens` and never emitted to public CSS.
3. No `::ng-deep`, `!important`, id selectors or `transition: all`, and no `@keyframes` outside `packages/ui/styles/motion.css`.
4. No `@angular/animations`.
5. No hand-rolled keyboard or focus behaviour where Angular Aria, CDK or native HTML provides it.
6. Native elements are enhanced with attribute selectors, never wrapped.
7. No `class`, `style` or free-form appearance inputs on components.
8. Every component meets the full definition of done. No "dark theme later".
9. Guardrails are never weakened to make a check pass.
10. Visual baselines are never updated without inspecting and explaining the diff.
11. Every decision of consequence is an ADR, and ADRs are read before changing an area.
12. Look at what you built before calling it done.

## Language

Human-facing docs: English. Code, identifiers, commit messages and lint messages: English.
