# Avelune

Angular UI kit for internal work systems. The aim is that every product built on it looks and behaves like one system: the same tokens, components, keyboard behaviour and motion, enforced by automated checks rather than goodwill.

Status: **0.x, in construction.** Progress and the plan are in [docs/ROADMAP.md](docs/ROADMAP.md). Nothing is published yet.

## Requirements

- Node `^24.15.0` (`.nvmrc` pins 24.21.0)
- pnpm: any recent pnpm switches itself to the version pinned in `package.json` (11.27.1)
- Docker, for visual tests (from Phase 3)

## Getting started

```sh
pnpm install          # dependencies and git hooks
pnpm nx build ui      # the library, into dist/packages/ui
pnpm nx serve showcase
```

Every command, the rules for contributors and coding agents, and the definition of done are in [AGENTS.md](AGENTS.md).

## Documentation

| Document | Contents |
|---|---|
| [AGENTS.md](AGENTS.md) | Rules, commands, component workflow, definition of done |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Commits, merge requests, RFCs for new components |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Phases, component status, versioning, adoption plan |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Repository map, layers, entry points, build, enforcement |
| [docs/adr/](docs/adr/README.md) | Architecture decision records |
| [docs/compatibility.md](docs/compatibility.md) | Pinned versions and why |
| [docs/BRIEF.md](docs/BRIEF.md) | The product owner's original brief |
