# Font sources

Inputs of `tools/fonts`. Not shipped: the build writes its output to `packages/ui/styles/fonts`. Verify a replacement with `git hash-object` (Google Fonts, blob SHA) or `shasum -a 256`, and update this file in the same change.

| File | Origin | Version | Hash | Licence |
|---|---|---|---|---|
| `IBMPlexSans-Variable.ttf` | `github.com/google/fonts`, `ofl/ibmplexsans/IBMPlexSans[wdth,wght].ttf` at commit `0b58fb370093f9a9f4ff785d94405710b79de67c` | 3.201 | git blob `30f837e8b02e8ecddce6cbebc425b1f422392515`; sha256 `3b031aa4216174205bd8471f88a49b91f093169e9e87bd5262242bc5967fe2e3` | SIL OFL 1.1, Reserved Font Name "Plex" (`OFL-IBMPlexSans.txt`, same commit, blob `c35c4c618fab33da8695177b3a6cefe0810b7b28`) |
| `LiberationSans-Regular.ttf` | `github.com/liberationfonts/liberation-fonts` release 2.1.5, `liberation-fonts-ttf-2.1.5.tar.gz` (sha256 `7191c669bf38899f73a2094ed00f7b800553364f90e2637010a69c0e268f25d0`) | 2.1.5 | sha256 `76d04c18ea243f426b7de1f3ad208e927008f961dc5945e5aad352d0dfde8ee8` | SIL OFL 1.1 (`OFL-LiberationSans.txt`) |
| `LiberationSans-Bold.ttf` | same archive | 2.1.5 | sha256 `788abee4c806d660e8aee46689dd8540cd4bb98da03dcc9d171ce3efd99a9173` | SIL OFL 1.1 |

Liberation Sans is used only as the metric reference for the Arial fallback faces: it is metric-compatible with Arial (checked against macOS Arial on 2026-09-23: identical vertical metrics and identical advance widths for a ru/uz/en sample).

`@ibm/plex-sans` on npm was not used: it depends on `@ibm/telemetry-js`, which collects usage data at install time.
