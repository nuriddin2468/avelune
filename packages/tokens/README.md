# @avelune/tokens

Design tokens for Avelune: DTCG sources and the Style Dictionary build. ADR 0003, 0011, 0016, 0017.

- `@avelune/tokens/tokens.css`: every semantic and component token as a `--ave-*` custom property, with the dark theme, compact density and reduced motion.
- `@avelune/tokens`: `tokens` (typed values per mode), `TokenName`, `tokenVar()`.

Build with `pnpm nx build tokens`. How the package works and how to add a token: "Tokens" in [ARCHITECTURE.md](../../docs/ARCHITECTURE.md). `private` is removed when the package is first published.
