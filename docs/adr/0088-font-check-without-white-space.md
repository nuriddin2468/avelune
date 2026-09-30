# 0088. The visual suite's font check leaves white space out of the text it checks

- Status: Accepted (2026-09-29, technical decision within Wave 5; settles the tracked risk of Wave 4)
- Date: 2026-09-29
- Related: 0010, 0018, 0027

## Context

ADR 0010 makes every capture assert that the kit's font rendered the page: `document.fonts.check('<size> "Avelune Sans"', text)` for the page's text, true when every face that matches the font and the text has loaded. Facts, verified on 2026-09-29 (Chromium 153 in the pinned image):

- Avelune Sans has one variable face per subset (latin, latin-ext, cyrillic), each covering the weights 400 to 600 (ADR 0018). The latin subset's `unicode-range` holds U+0000–00FF, and with it the space, the line break and the no-break space.
- Chromium loads no face for white space: a page whose text has no Latin letter or digit never loads the latin face, and `check` over its text, spaces included, is false although every glyph it shows is in a face that has loaded.
- Wave 4's SidebarNav stories met this and showed a Latin word (tracked risk, "if it recurs, check each subset the text needs apart"). Wave 5's first visual run met it again: the Avatar's initials and the Tag's sizes show only Cyrillic letters, in both themes, both widths and forced colours (six failing checks).

## Decision

The font check reads the page's text without its white space (`\s`, which includes the no-break spaces of numbers): the faces it requires are those of the glyphs the page shows. Every other assertion of the check stays: the body's stack starts with Avelune Sans, fonts.css declares it, and no Avelune face failed to load.

## Alternatives considered

- **A Latin word in every story:** the Wave 4 workaround; a story's words would be chosen for the check instead of for the component.
- **Checking each text node with its own computed font:** the faces are variable and cover every weight the kit uses, so the family, the size and the glyphs already decide which faces are needed.
- **Loading every subset before each capture:** the check would no longer say whether the page's text found its faces.

## Consequences

- A page in one script passes when that script's face has loaded, and fails as before when a glyph it shows falls back.
- The tracked risk of Wave 4 is closed.
