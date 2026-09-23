# tokens-check

Validates the token package (`packages/tokens`) from its files alone, without Style Dictionary (ADR 0003): DTCG 2025.10 schema, references, naming, tier direction and literal values (ADR 0016), the 4px line-height grid, theme parity and override rules, every contrast pair in `contrast-pairs.json` in both themes (ADR 0011), and the built `dist/tokens.css` (no primitives, no missing tokens).

- `pnpm nx run tokens-check:check`: check the repository tokens (builds them first).
- `pnpm nx run tokens-check:test`: the valid fixture passes, the repository passes, and each fixture in `fixtures/` (one file of `valid/` replaced) is rejected by its rule.
