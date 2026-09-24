# AGENTS.md

Rules for any coding agent (and any human) working in this repository. `CLAUDE.md` contains only `@AGENTS.md`.

## Resume

1. Read [docs/ROADMAP.md](docs/ROADMAP.md): current position, parameters, first unchecked item.
2. Read the sections of [docs/BRIEF.md](docs/BRIEF.md) (the product owner's original brief) that cover that item. "brief §N" anywhere in the repo refers to that file. Where the brief's placeholders differ from the resolved parameters in ROADMAP.md, ROADMAP.md wins.
3. Read the ADRs in [docs/adr](docs/adr/README.md) that touch the area you will change, and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for where things live.
4. Versions are pinned in [docs/compatibility.md](docs/compatibility.md). Before installing or upgrading anything, verify with `npm view <pkg> version peerDependencies time` and update that file in the same change. pnpm refuses versions younger than 24 hours (ADR 0012); pin the previous release and list the upgrade in ROADMAP.md.
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

## Working rules

- **Verify, never recall.** Versions, peer ranges, rule names and APIs are checked against the installed package or the official docs, not memory.
- **Local installs only.** Anything global (a global package, a system setting, a file outside the repo) needs the product owner's consent.
- **Never weaken a guardrail.** Forbidden: disabling or downgrading a lint rule, lowering a threshold, `any`, `@ts-ignore`, `@ts-expect-error` without a linked issue, `eslint-disable` without a description, `git commit --no-verify`, `minimumReleaseAgeExclude`, updating a baseline or API report without reviewing the diff. If a rule is wrong, write an ADR and ask.
- **Maximum typing.** Union literal types for variants and sizes, typed token and icon names, no stringly-typed APIs.
- **Decisions are ADRs** (template in [docs/adr/README.md](docs/adr/README.md)). An ADR is never edited to reverse its decision; a new ADR supersedes it.
- **Ask about taste, decide about tech.** Brand, typography feel, default density and visual milestones go to the product owner; tooling and implementation are decided and recorded.
- **Commits** follow Conventional Commits. The scope is an Nx project name (`ui`, `tokens`, `showcase`, …) or one of `repo`, `deps`, `docs`, `ci`, `release`. commitlint enforces both.

## Commands

Run from the repository root. `pnpm` switches itself to the pinned 11.27.1 (`packageManager` field).

| Task | Command |
|---|---|
| Install | `pnpm install` (also installs the git hooks) |
| Build the library | `pnpm nx build ui` |
| Build or serve the showcase | `pnpm nx build showcase`, `pnpm nx serve showcase` |
| Storybook: serve / build (Foundations pages) | `pnpm nx serve storybook` / `pnpm nx build storybook` |
| Lint, type-check everything | `pnpm nx run-many -t lint typecheck` |
| Only what a change affects | `pnpm nx affected -t lint typecheck build` |
| API reports: check / update | `pnpm nx run ui:api-report` / `pnpm nx run ui:api-report --update` |
| Build the tokens (`dist/tokens.css`, `tokens.ts`) | `pnpm nx build tokens` |
| Check the tokens (schema, tiers, contrast in both themes, output) | `pnpm nx run tokens-check:check` |
| Check that no tsconfig weakens the compiler strictness / prove each option with its fixture | `pnpm nx run compiler-check:check` / `pnpm nx run compiler-check:test` |
| Stylelint (all CSS; builds the tokens first) | `pnpm nx run-many -t stylelint` |
| Prove the ESLint and Stylelint configs and the `avelune` rules (rule tests + workspace fixtures) | `pnpm nx run lint-rules:test` |
| Fonts: check / rebuild (`packages/ui/styles/fonts`) | `pnpm nx run fonts:check` / `pnpm nx run fonts:check --update` |
| Colour primitives: check / regenerate | `pnpm nx run tokens:colors` / `pnpm nx run tokens:colors --update` |
| All tests: library (Vitest in Chromium, coverage gate), stories (render, `play`, axe), Node-side (`node:test`) | `pnpm nx run-many -t test` (ADR 0015, 0026) |
| Library unit tests / story tests | `pnpm nx run ui:test` / `pnpm nx run storybook:test` |
| Size budget of every entry point (`sizeLimit` in `entry.json`) | `pnpm nx run ui:size` (ADR 0028) |
| Format | `pnpm format` (check: `pnpm format:check`) |
| Project graph | `pnpm nx graph` |

The pre-commit hook runs ESLint, Stylelint and Prettier on staged files, `typecheck` on affected projects and `compiler-check:check` when a tsconfig is staged; the commit-msg hook runs commitlint. Visual regression, the Playwright axe sweep, invariants and size budgets are added later in Phase 3 and listed here then.

## Where things live

[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) has the full map. In short: publishable packages in `packages/`, the showcase and Storybook in `apps/`, internal checks in `tools/`, decisions in `docs/adr/`. Each component is a secondary entry point `packages/ui/<name>/` with `index.ts`, `entry.json` (its layer), `ng-package.json` and a `testing/` entry point for its harness.

## Workflow per component (brief §9.2)

1. Read `docs/GUIDELINES.md`, `docs/ARCHITECTURE.md` and the ADRs that touch the component.
2. Write the spec as the Storybook docs page first: when to use and when not (with the alternative), anatomy, variants, applicable states, keyboard behaviour per WAI-ARIA APG, a11y notes, motion (which catalog entry), do and don't. Taste questions go to the product owner now.
3. Implement.
4. Stories: every variant × size × applicable state; stress content (long ru/uz text, empty, overflow); both themes; compact density; `play` interaction tests.
5. Harness and unit tests through the harness.
6. Visual baselines; axe clean.
7. Visual review (brief §8.1): screenshots, inspect, fix, repeat until zero findings.
8. Add it to the showcase in at least one realistic composition; run the invariants (brief §8.2).
9. Changeset, API report updated, ROADMAP status updated.

## Definition of done (brief §9.3)

- [ ] Typed signal API, JSDoc on every public input and output, no `any`
- [ ] Only semantic and component tokens; Stylelint and ESLint green without disables
- [ ] Every applicable state implemented and shown in stories
- [ ] Keyboard behaviour matches WAI-ARIA APG; correct roles and labels; screen-reader names verified
- [ ] axe: zero violations in every story and showcase screen
- [ ] Harness shipped; unit tests via the harness; coverage threshold met
- [ ] Visual baselines for light and dark × both viewports; reduced motion checked
- [ ] Stress stories pass (long ru/uz, empty, overflow)
- [ ] Forms integration (Signal Forms and Reactive Forms) if it is a control
- [ ] Motion uses the catalog only; reduced motion respected
- [ ] Invariants green in the showcase
- [ ] size-limit budget met
- [ ] Docs page complete; changeset added; API report updated; ROADMAP updated
- [ ] Visual review checklist passed with zero findings

## Agent tooling

- **Angular skill.** `angular-developer` from the official [angular/skills](https://github.com/angular/skills) repository is vendored in `.claude/skills/angular-developer/` (angular/skills commit `4873ba2`, built from angular/angular `95e8dec`, 2026-09-22). Use it for Angular APIs: signals, inputs, host bindings, Signal Forms, DI, harnesses, Angular Aria. It is general Angular advice; where it conflicts with this file or an ADR, the repository wins. In particular: no Tailwind, no `@angular/animations`, no Angular Material, no `ViewEncapsulation.None` or `ShadowDom`, and Nx targets instead of `ng build` / `ng generate`. `angular-new-app` is not installed: this repository never runs `ng new`. To update, copy a newer commit's folder, review the diff, and update the commit hashes here.
- **Angular CLI MCP server.** `.mcp.json` starts the repository's own pinned CLI (`node_modules/.bin/ng mcp --read-only`), never `npx @angular/cli@latest`. Useful tools: `get_best_practices`, `search_documentation`. `list_projects` and the dev-server tools read `angular.json`, which this Nx workspace does not have; use Nx for builds and serving.
