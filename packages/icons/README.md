# @avelune/icons

The kit's icon set (ADR 0020, 0033): Lucide outlines from `lucide-static`, as typed data, with the `IconName` union. Applications use the icons through `<ave-icon>` from `@avelune/ui/icon`.

- `scripts/icons.config.ts` lists the icons the kit ships, by their Lucide names.
- `pnpm nx run icons:generate` fails when `src/icons.ts` or `LICENSE-lucide.txt` is not what the config and the installed `lucide-static` generate; `--update` rewrites them. Review the diff.
- `pnpm nx run icons:build` compiles `src/icons.ts` to `dist/`.

The generator accepts only Lucide's outline shapes, with no fill, so every icon is drawn the same way. The Lucide licence (ISC) is in `LICENSE-lucide.txt`.
