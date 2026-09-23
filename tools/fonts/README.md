# fonts

Builds the kit's web fonts from `source/` into `packages/ui/styles/fonts` (brief §4.4, ADR 0018): IBM Plex Sans 3.201 as "Avelune Sans" (weight axis 400–600) and IBM Plex Mono 2.3 Regular as "Avelune Mono", each subset into latin, latin-ext and cyrillic woff2 files (cyrillic includes the Uzbek letters Ғ Қ Ҳ) and renamed as the OFL requires, plus `fonts.css` with the `@font-face` rules and metric-matched fallback faces (Arial per weight, Courier New for mono).

- `pnpm nx run fonts:check`: fails when the committed files are not what the build produces, when a shipped file misses a character any locale needs (Intl output included), keeps the Reserved Font Name, has other axes or a wrong checksum.
- `pnpm nx run fonts:check --update`: rebuilds the files; review and commit them.
- `pnpm nx run fonts:test`: sfnt round trips, renaming, glyph remapping, coverage failures, the CLI rejecting a changed file.

Consumers preload the latin file (it carries digits and punctuation for every locale): `<link rel="preload" href="…/avelune-sans-latin.woff2" as="font" type="font/woff2" crossorigin>`.
