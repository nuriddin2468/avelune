# adoption-metrics

Scans a consumer repository and counts what keeps it off the kit (ADR 0105): raw colours, raw pixel values, raw interactive elements, local keyframes, `::ng-deep`, `--ave-*` declared or unknown, inline styles in templates, and banned or deep imports, with the kit version lag. The counts are the findings of the built `@avelune/eslint-config` and `@avelune/stylelint-config`, by rule, so a metric means what the lint configs mean.

```bash
pnpm nx run-many -t build -p eslint-config stylelint-config
node tools/adoption-metrics/src/cli.ts <repository> --json report.json --summary summary.md
```

| Option | What it does |
|---|---|
| `--json <file>` | Writes the report: totals, counts per file (the most first), coverage, notes and the lag |
| `--summary <file>` | Writes the Markdown summary; without it, the summary is appended to `$GITHUB_STEP_SUMMARY` when that is set |
| `--previous <file>` | A previous report: the summary shows each count's change |
| `--ratchet` | With `--previous`, exits 1 when any count rose |
| `--latest <version>` | The newest kit version for the lag; this repository's `@avelune/ui` version by default |
| `--exclude <glob>` | One more path to leave out, relative to the repository; repeatable |
| `--name <label>` | The name in the summary's heading; the folder's name by default |

`pnpm nx run adoption-metrics:scan -- <repository> …` builds the configs first and runs the same command from the repository root.

What it reads:

- **Stylesheets:** CSS files, and the `styles` of every `@Component`, read with TypeScript's parser.
- **Templates:** HTML files, and inline templates through angular-eslint's processor.
- **Scripts:** TypeScript and JavaScript files, for imports.

It leaves out `node_modules`, build output and caches, `public` and `vendor` folders, minified files and test files. It ignores disable comments. The report counts what it could not read: SCSS, Sass and Less files, and component styles with an interpolation. A note says when Tailwind is installed, whose utility classes it does not scan. It writes nothing in the scanned repository.

The adoption plan (ROADMAP) records each consumer's baseline in `docs/audit.md`. `pnpm nx run adoption-metrics:test` scans the fixtures in `fixtures/`: a consumer with every metric at a known count, and one on the kit alone.
