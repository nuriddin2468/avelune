# Contributing

Read [AGENTS.md](AGENTS.md) first: its rules apply to people and coding agents alike. This file covers how changes get in. It is a skeleton; the merge-request template, changesets and the code-owner rule are completed in Phase 3.

## Commits

- [Conventional Commits](https://www.conventionalcommits.org/): `type(scope): subject`, subject in lower case, imperative, no full stop.
- Scope: an Nx project name (`ui`, `tokens`, `icons`, `showcase`, `storybook`, `eslint-config`, `stylelint-config`, a tool name) or one of `repo`, `deps`, `docs`, `ci`, `release`.
- A breaking change uses `!` (`feat(ui)!: …`) and a `BREAKING CHANGE:` footer, and ships with an `ng update` migration (ADR 0007).
- Hooks run on every commit and are never skipped.

## Merge requests

Every merge request:

- stays within one concern and passes every check locally (`pnpm nx affected -t lint typecheck build`);
- updates the API reports when the public API changes, with the diff explained in the description;
- adds a changeset when it touches `packages/` (from Phase 3);
- shows before and after screenshots, light and dark, for any visual change, and explains every changed visual baseline (non-negotiable 10);
- for a component, ticks every item of the definition of done in [AGENTS.md](AGENTS.md);
- records any decision of consequence as an ADR.

## Proposing a component or variant (RFC)

Anything not listed in the component waves of [docs/ROADMAP.md](docs/ROADMAP.md), and every new variant of an existing component, starts as an RFC. Open an issue with this template; it becomes `planned` in the ROADMAP when accepted.

```markdown
## Problem
What users or product teams cannot do today. Screens and examples.

## Why existing components don't solve it
Which components were considered and where each falls short.

## API sketch
Selector, inputs (union types), outputs, content projection slots.

## States
Default, hover, focus, active, disabled, readonly, invalid, loading, empty — which apply.

## Accessibility
Role, keyboard behaviour per WAI-ARIA APG, labelling, what Angular Aria / CDK / native HTML provides.

## Motion
Which entry of the motion catalog (brief §6.3) it uses.
```

## Review

Code owners for `packages/` and `docs/GUIDELINES.md` are defined in Phase 3. Until the GitLab edition is known, required code-owner approval is a documented rule: a change to those paths is merged only after a code owner approves it.
