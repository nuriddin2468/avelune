# 0002. Behaviour layer: Angular Aria, CDK, native HTML; no Angular Material

- Status: Accepted (2026-09-23, product-owner go-ahead)
- Date: 2026-09-23
- Related: 0004, 0005

## Context

Keyboard, focus and ARIA behaviour is where hand-written UI kits fail audits. Angular now ships headless behaviour:

- **`@angular/aria` 22.2.0**: stable since 22.0, when the developer-preview tag was removed. Its entry points are `accordion`, `combobox`, `grid`, `listbox`, `menu` (includes `MenuBar`), `tabs`, `toolbar` and `tree`, each with a `/testing` harness. Select, Autocomplete and Multiselect are **documented patterns** composed from Combobox + Listbox, not separate entry points.
- **`@angular/cdk` 22.2.0**: Overlay, Dialog, A11y (FocusTrap, LiveAnnouncer, FocusMonitor, InteractivityChecker), Scrolling, DragDrop, Portal, Testing (harness base).
- **Native HTML**: `<button>`, `<input>`, `<dialog>`, the Popover API. All are available at our browser floor (ADR 0005).

## Decision

1. Behaviour comes from, in order of preference: native HTML, then Angular Aria, then Angular CDK. Hand-written keyboard or focus logic requires an ADR explaining why none of these fit.
2. Select, Autocomplete and Multiselect are built on `@angular/aria/combobox` + `@angular/aria/listbox`, following the Aria pattern docs. Menubar uses `MenuBar` from `@angular/aria/menu`.
3. Our harnesses (`@avelune/ui/<name>/testing`) extend CDK `ComponentHarness` and may delegate to Aria's harnesses internally.
4. **Angular Material is not used**, neither as a dependency nor as a visual base.

## Why not Angular Material

- Its visual system is Material 3. Restyling it means overriding its DOM and class structure, which requires `::ng-deep` or global overrides. Both are banned (ADR 0004).
- Its theming API (Sass mixins, M3 system tokens) would sit beside our DTCG pipeline as a second source of truth.
- Its component APIs expose appearance inputs (`color`, `appearance`) that contradict our minimal-surface rule (brief §9.1).
- The behaviour we would want from it now lives in CDK and Aria, which Material itself is built on.

## Alternatives considered

- **Restyled Angular Material:** see above. Rejected.
- **Third-party headless libraries** (for example ng-primitives, Spartan): capable, but not maintained by the Angular team, add a release-cadence dependency, and duplicate what Aria provides. Rejected.
- **Hand-rolled behaviour:** highest audit risk. Allowed only with an ADR.

## Consequences

- Wave 2 (Select, Combobox, Multiselect) depends on Aria's Combobox pattern quality. Any gap is recorded as an ADR with a workaround, not patched silently.
- ESLint forbids `@angular/material` imports (`no-restricted-imports`).
