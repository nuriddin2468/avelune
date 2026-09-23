# 0018. Fonts: IBM Plex Sans subsets, renamed "Avelune Sans", metric-matched fallback

- Status: Accepted (2026-09-23, technical decision within Phase 2; the glyph choice for ʻ and ʼ is shown at the Foundations milestone)
- Date: 2026-09-23
- Related: 0010, 0015, brief §4.4, compatibility.md §4

## Context

The product owner chose IBM Plex Sans (Phase 0). Brief §4.4 asks for self-hosted woff2 subsets (latin, latin-ext, cyrillic), `font-display: swap`, and a fallback face tuned so the swap causes no layout shift. Findings while building it:

1. **Licence.** Plex is OFL 1.1 with the Reserved Font Name "Plex". OFL-FAQ 2.6: removing glyphs for web delivery is a modification, and a modified version may not use the reserved name; the exception (2.7–2.8) needs the full character inventory and behaviour, which subsets do not keep.
2. **Uzbek Cyrillic.** Google's `cyrillic` range (fonts.googleapis.com, 2026-09-23) lacks Ғ ғ Қ қ Ҳ ҳ (U+0492–0493, U+049A–049B, U+04B2–04B3); they sit in `cyrillic-ext`.
3. **Uzbek Latin.** Plex draws U+02BB (ʻ) and U+02BC (ʼ) as spacing modifier letters 0.6 em wide with 0.25 em side bearings, so "Oʻzbekiston" renders as "O ʻ zbekiston". Its ‘ and ’ are 0.27 em.
4. **Source.** `@ibm/plex-sans` on npm depends on `@ibm/telemetry-js`. Google Fonts' repository ships the same version (3.201) as one variable TTF.

## Decision

- **Source:** `IBMPlexSans[wdth,wght].ttf` from `google/fonts` at a pinned commit, committed to `tools/fonts/source` with its hash (source README). Not shipped.
- **Subsets:** latin and latin-ext with Google's ranges; cyrillic with Google's range plus the six Uzbek letters. One variable woff2 per subset, weight axis limited to 400–600 (the kit's three weights), width pinned to 100. Sizes: latin 37 KB, latin-ext 22 KB, cyrillic 24 KB; a Russian or Uzbek Cyrillic page loads about 61 KB for all weights.
- **Name:** the files and the CSS family are **"Avelune Sans"**. `tools/fonts` rewrites every name record except copyright, trademark and licence, and ships `OFL.txt` and a `FONTLOG.txt` that lists the modifications. Tokens use `["Avelune Sans", "Avelune Sans Fallback", "sans-serif"]`.
- **ʻ and ʼ** are mapped in the cmap to Plex's own ‘ and ’ glyphs, the form Uzbek text commonly uses. No outline or metric changes. The product owner sees it in the type specimen and can reverse it.
- **Fallback:** one `@font-face` per weight (400, 500, 600) named "Avelune Sans Fallback" over `local()` Arial and its metric-compatible clones (Liberation Sans, Arimo, Helvetica), with `size-adjust` so a ru/uz/en corpus sets the same width as Plex at that weight, and `ascent-/descent-/line-gap-override` equal to Plex's metrics divided by `size-adjust`. Liberation Sans 2.1.5, identical in metrics to Arial, is the reference. Measured in Chromium on macOS: same line breaks and height at every weight, width within 1%.
- **Checks** (`fonts:check`): committed files equal a fresh build (byte for byte); every character each locale needs, including what Intl emits for numbers, money, dates and lists, lies in a subset's `unicode-range` and in that file's cmap; no name record keeps "Plex"; axes and checksums are right.
- The `@font-face` rules live in `packages/ui/styles/fonts/fonts.css`; Phase 4 imports it from `styles.css`. Consumers preload the latin file.

## Alternatives considered

- **Keep the name "IBM Plex Sans" on subsets:** contrary to OFL-FAQ 2.6. Rejected.
- **Ship the full variable font (functionally equivalent, may keep the name):** about 3× the bytes of a page's subsets, and against brief §4.4. Rejected.
- **Google's subset files via `@fontsource`:** Google's cyrillic range misses Uzbek letters, and the RFN question stays. Rejected.
- **Tighten Plex's own ʻ glyph** (change its side bearings): needs outline and HVAR edits in a variable font. The quotation-mark glyphs already have the right spacing. Rejected for now.
- **Another typeface** (Inter, Noto Sans): a taste decision; the product owner chose Plex. Not changed.

## Consequences

- Upgrading Plex means replacing the source, updating the hashes, `fonts:check --update`, and reviewing the rendering; the RFN rename stays.
- Visual tests (ADR 0010) assert that "Avelune Sans" loaded, not "IBM Plex Sans".
