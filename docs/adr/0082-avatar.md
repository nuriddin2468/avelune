# 0082. Avatar: initials on the neutral fill, a circle for a person and a square for an organisation, a photo over them

- Status: Accepted (2026-09-29; proposed by the agent to the product owner, who did not object, for the taste of the wave's review; the rest a technical decision within Wave 5)
- Date: 2026-09-29
- Related: 0033, 0079, 0080; brief §4.2, §9.1, §9.4; GUIDELINES.md "Foundations"

## Context

Brief §9.4 lists Avatar in Wave 5. Facts, verified on 2026-09-29 (Angular 22.2.0, Chromium 153):

- A work system shows people (an approver, an author) and organisations (a counterparty) beside their names, in lists, tables and cards; photos are often missing or fail to load.
- The status colours carry meaning and the accent marks action and choice (GUIDELINES.md, "Foundations"); the palette has no decorative hues. `color.bg.active` is the neutral translucent fill.
- Names come in Cyrillic and Latin script, Uzbek Latin with ʻ and ʼ, and organisations with a legal form and a name in quotes ("ООО «Мебель Сервис»").
- angular-eslint's `prefer-ngsrc` asks for `NgOptimizedImage` on every `<img>`, which refuses data URLs (NG02952), and legacy systems often send photos as base64. The select family draws its options' images as a background from a custom property on the host (ADR 0055); an `Image` loaded apart says whether a photo came.
- The icon (ADR 0033) needs a label or `decorative`; a name beside an avatar says it already.

## Decision

1. **`@avelune/ui/avatar`** (layer components), `AveAvatar` (`<ave-avatar>`): `name` (required), `kind` `person` (default) or `organization`, `size` `sm` 24px, `md` 32px (default) or `lg` 40px, `image` (a URL), `initials` (the application's, when the kit's rule does not fit), `decorative`.
2. **Look (the agent's proposal, not objected to):** the initials in `fg.default` on `bg.active`, `font.label-sm` (`font.label-md` at 40px); a circle for a person, a square with `radius.md` for an organisation (`radius.sm` at 24px); no colour from the name. A transparent border only forced colours paint.
3. **Initials:** the first letters of the first two words, upper-cased for the locale; of an organisation, the words in quotes when it has them ("ООО «Мебель Сервис»" → "МС"); a word starts at its first letter, so "Oʻktam" gives "O".
4. **A photo** is loaded apart (an `Image`) and drawn as the avatar's background once it has come, cropped to fill (`background-size: cover`), over the initials; one that fails, or has not come, leaves the initials. None on the server.
5. **Name:** an `img` named by `name`; `decorative` hides it from assistive technology, for an avatar beside the name it shows.
6. **Harness:** `AveAvatarHarness` (`@avelune/ui/avatar/testing`): the name, the initials, whether the photo shows, the kind and the size.

## Alternatives considered

- **Colours from the name:** would take the status hues or the accent as decoration, or need a palette of their own the Foundations do not have.
- **One shape:** a counterparty and a person side by side in a list read apart by their shapes.
- **An icon without a photo:** initials tell people apart; the icon says only "a person".
- **An `<img>` over the initials:** `NgOptimizedImage` would refuse base64 photos, and a plain `img` fails the lint rule.
- **A status dot (online):** work systems in this wave have no presence; later, with a need.

## Consequences

- The showcase's contract page shows its counterparty's avatar and the avatars of the people in its history.
- An application with legal forms outside quotes ("ИП Каримов А.") gives `initials` when the first two words are wrong for it.
