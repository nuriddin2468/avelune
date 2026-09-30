# Avelune guidelines

How to build screens with Avelune so that every product feels like one system (brief §7.3). The rules here are for people and agents who design and build with the kit; how the kit itself is built is in [ARCHITECTURE.md](ARCHITECTURE.md). Written incrementally with each wave and finalised in Phase 6. Where a rule has an automated check, the check is named.

## Principles

When two good options conflict, the higher principle wins.

1. **People can use it.** Keyboard, screen readers, zoom to 400%, forced colours, and long Russian and Uzbek text are requirements, not extras. A screen that looks right but fails one of them is not done.
2. **One system.** The same thing looks and behaves the same everywhere. A local improvement that makes one screen differ from the rest is not an improvement; propose it for the kit instead (RFC, [CONTRIBUTING.md](../CONTRIBUTING.md)).
3. **Content first.** The screen exists for the data and the task. Chrome, decoration and motion earn their place or go.
4. **Calm and quick.** Feedback is immediate, motion is short and has a purpose, nothing moves without a cause.
5. **Dense, not crowded.** Work screens show a lot at once, on a strict 4px rhythm, with space that groups rather than decorates.

## Foundations

Every value comes from a token ([packages/tokens](../packages/tokens), browsable in Storybook under Foundations). Applications use the semantic tokens (`--ave-color-fg-muted`, `--ave-space-4`) and never a raw colour, length, duration or easing.

- **Type:** body text is 14/20 (`font.body-md`). Headings, labels and captions have their own roles; three weights at most.
- **Colour:** one accent for the primary action, selection and focus: the kit's orange, or a product's or a tenant's brand through `AveTheme.setBrand` (ADR 0089), never by writing `--ave-*` values. The exact brand colour is for the logo and marks only; the generator picks the shades that keep every text and boundary readable. Status colours (info, success, warning, danger) carry meaning and are never decoration.
- **Shape:** radii by hierarchy: `radius.sm` for small parts inside controls (a checkbox), `radius.md` for controls and menu items, `radius.lg` for cards, popovers and dialogs. Nested corners are concentric: inner radius = outer radius − the gap between them.
- **Themes and density:** light and dark from day one, comfortable and compact. Review a screen in both themes; never assume dark from light.

## Spacing rhythm

| Between | Space |
|---|---|
| Parts of one control (icon and text) | `space.2` (8) |
| Related elements (buttons in a row, a label and its field) | `space.2` (8) |
| Form fields | `space.4` (16) |
| Groups inside a section | `space.6` (24) |
| Sections | `space.8`–`space.12` (32–48) |

## Choosing a component

### Button variants

One primary button per view region (a form, a dialog, a toolbar, a card): the one action most people came to do.

| Variant | Use for | Not for |
|---|---|---|
| `primary` | The main action of the region: "Save changes", "Send for approval" | More than one action in a region; destructive actions |
| `secondary` (default) | Every other action: "Cancel", "Export", "Filters" | — |
| `ghost` | Low-emphasis actions in dense places: toolbars, table rows, "Show more" | The only action of a form; anything that needs to be found |
| `danger` | The confirming action of a destructive flow: "Delete document" in its confirmation | Starting a destructive flow (use `secondary`, then confirm with `danger`) |

- Order in a row: the primary action last (at the inline end), "Cancel" before it.
- A button that navigates is a link styled as a button (`a[aveButton]`); a button that acts is a `<button>`.
- Five or more actions on one thing go into a toolbar (`[aveToolbar]`, ADR 0075): one Tab stop, ghost buttons, the rarest in its menu at the end.
- An editor's many commands go into a menubar (`<ave-menubar>`, ADR 0076), "Файл", "Правка", "Вставка", with the most used in a toolbar under it; a page's or a record's actions never do.
- A clickable icon without a visible label is an IconButton, with a label for assistive technology and the same words in its tooltip (`aveTooltip`), so everyone can read its name.

### Dialog, drawer or page

| Use | When |
|---|---|
| Dialog | A short, focused task or a confirmation that blocks the flow until answered |
| Drawer | Details or a form next to the list it belongs to, where the context stays useful |
| Page | Anything long, anything people bookmark or share, anything with its own navigation |

### Navigation

| Use | When |
|---|---|
| Sidebar navigation | The product's pages and groups of pages, the same on every screen; in a drawer on a phone (ADR 0072) |
| Tree | One place in a hierarchy people choose, whose content the page shows beside it: a department, a folder; never the product's pages (ADR 0085) |
| Breadcrumbs | Where a page deep in the hierarchy is, above its heading: a contract under the register (ADR 0070) |
| Tabs | Sections of one page that people look at one at a time; tabs never change the address (ADR 0071) |
| Accordion | Sections of one page that people read one or two at a time, in any order, where showing all would make it long (ADR 0084) |
| Link (`a[aveLink]`) | A reference inside text, or a record's name that opens its page; always underlined, and it says when it opens a new tab (ADR 0073) |
| Pagination | A list longer than a page, under the list; back to the first page when a search or a filter changes it; a page-size select when people choose how much to see (ADR 0074, 0087) |
| Stepper | The steps of a long form in turn, or the stages a document passes through (an approval route); never sections people open in any order (ADR 0077) |

### Card, list or table

| Use | When |
|---|---|
| Card | A few records or groups side by side, each read on its own: a dashboard, a board, a page's groups of settings (ADR 0083) |
| List | Records one under another, read in order, each with its few facts |
| Table | Many records to compare, sort and choose from, by the same columns; a page at a time, each record's rarer actions in its menu (ADR 0078, 0087) |

### Toast, inline alert or banner

| Use | When |
|---|---|
| Toast | Confirmation of an action the person just took ("Document saved"); never the only place an error appears |
| Inline alert | A problem or a notice about one part of the screen, next to that part |
| Banner | A state of the whole product or page (maintenance, an expiring licence) |

### Radio, select or combobox

| Options | Use |
|---|---|
| 2–5 | Radio group: every option visible at once |
| 6–15 | Select |
| More than 15, or unknown | Combobox with search |
| Thousands, on the server | Combobox with `search="server"`: the server searches, a page at a time (ADR 0056) |

### Status, tag or count

| Use | When |
|---|---|
| Badge | The status of a record, in its words and colour: "Подписан", "На согласовании" (ADR 0079). One status, one variant, across the product |
| Tag | A value chosen for a filter or a field, which people take away with its button; or a record's label without one (ADR 0080). Never a status |
| Count | How many items wait in a place, beside its name: "Входящие 12"; nothing at 0 |

## States

- **Disabled** controls are dimmed and cannot be used. When people need to know why, keep the control focusable (a button's `disabledInteractive`) and say why next to it or in its description.
- **Readonly** fields show a value that cannot be changed here; they stay readable and focusable.
- **Invalid** fields show the error under the field, in words, with an icon, not by colour alone.
- **Loading:** skeletons for content that is on its way, a spinner for an action in progress. A spinner appears only after 300ms of waiting and then stays at least 500ms (`timing.spinner-delay`, `timing.spinner-min-visible`), so fast actions never flash. A loading button keeps its size. A progress bar shows work whose share done is known (an upload, an import), with the share in words beside it; it never stands for a wait of unknown length.

## Writing

- **Sentence case** everywhere: "Save changes", not "Save Changes". No all-caps labels.
- **Buttons say what happens:** a verb and, if needed, its object. "Save changes", "Send for approval", never "OK" or "Yes".
- **One verb through the flow:** "Publish" on the button, "Publish document?" in the confirmation, "Published" in the result.
- **Errors say what happened and how to fix it**, without apology or blame: "The file is larger than 20 MB. Choose a smaller file." Never "Something went wrong" alone.
- **Destructive confirmations name the action:** "Delete document", not "Yes".
- **Links name their destination:** "договор ДК-2025/109", "регламент документооборота", never "здесь" or "по ссылке".
- **Empty states explain why** the place is empty and offer the next action.

## Formatting

Dates, numbers and currency are formatted for the person's locale (uz-Latn, uz-Cyrl, ru, en), never by hand. Chrome and Edge have no Uzbek data in Latin script and write `2026 M09 23`, so dates go through `aveDateFormat(locale)` from `@avelune/ui/i18n`, which uses `Intl` for the other locales and the kit's own data for Uzbek (ADR 0048). A date's value is an ISO date (`2026-03-18`), never a `Date` with a time zone. Numbers go through `aveNumberFormat(locale, options)` and file sizes through `aveFileSize(bytes, locale)` from the same entry point, which write Uzbek in Latin script with the right separators (`1 234 567,8`, ADR 0050); currency still uses `Intl` (ROADMAP.md, "Tracked risks").

## Content resilience

- Russian runs 15–30% longer than English, and Uzbek has long words (`Oʻzbekiston Respublikasi Vazirlar Mahkamasining`). Design for the longest locale.
- Labels and messages wrap; they never truncate.
- Button text never truncates: a long label wraps onto a second line, and the button grows.
- Table cells may truncate, with the full value in a tooltip.
- Numbers in columns use tabular figures (`.ave-tabular-nums`).

## Cross-component invariants

Checked on every showcase screen by `tools/invariants` (brief §8.2) as the components arrive:

- Controls of the same size (Button, IconButton, Input, Select, Combobox, DatePicker) have the same height, radius, border width, font size and horizontal padding.
- Every overlay shares elevation, radius, enter and exit motion, closes on Esc and on an outside click, and returns focus to its trigger. The popups attached to a control share `elevation.popover`, the modal dialogs `elevation.dialog`, both `radius.lg`. The control that opens an overlay carries `aria-haspopup`: the kit's controls do, and a button of the application that opens a dialog sets `aria-haspopup="dialog"`, which also tells screen reader users (ADR 0069).
- Every animation runs on a duration and an easing token; under reduced motion nothing moves or scales.
- No screen scrolls horizontally at 320 px.
