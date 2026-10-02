## Avelune UI kit

This application is built on Avelune (`@avelune/ui`, `@avelune/icons`, `@avelune/tokens`). `ng add @avelune/ui` wrote this section and replaces it on the next run; `@avelune/eslint-config` and `@avelune/stylelint-config` check most of these rules.

### Rules

- Build every control, overlay and page layout from the kit. Import each from its entry point (`@avelune/ui/button`), never from a file inside one.
- Native `<button>`, `<a>`, `<input>`, `<textarea>`, `<progress>` and `<dialog>` always carry the kit's directive (`aveButton`, `aveLink`, `aveInput`, `aveCheckbox`, …). A list to choose from is `<ave-select>`, `<ave-combobox>` or `<ave-multiselect>`, never `<select>`.
- Every CSS value is a token: `var(--ave-color-fg-muted)`, `var(--ave-space-4)`, `var(--ave-radius-md)`. Never a raw colour, pixel length, duration or easing, and never an `--ave-*` declaration: a product's or a tenant's colour goes through `AveTheme.setBrand()`.
- Motion: the catalog's classes (`ave-motion-popover-enter`, …) with `animate.enter` and `animate.leave`, and transitions in longhands on the duration and easing tokens. No `@keyframes`, `transition: all` or `@angular/animations`.
- No `::ng-deep`, `!important`, id selectors, inline `style`, `outline` or `:focus` styles: the kit draws the one focus ring.
- Every `<ave-icon>` and icon button names its icon: `label`, or `decorative` when the text beside it says the same. Register the icons the application draws with `provideAveIcons`.
- Words: a button says what it does ("Save changes", "Delete document"), never "OK" or "Yes"; errors say what happened and how to fix it.
- Check each screen in light and dark, comfortable and compact density, at 320 px wide, and with long Russian and Uzbek text.
- The API: every public input, output and method has JSDoc in `node_modules/@avelune/ui/types/avelune-ui-<entry>.d.ts`. Which component to use when: https://github.com/nuriddin2468/avelune/blob/main/docs/GUIDELINES.md.
- Moving an old screen onto the kit, and running the old styles beside the kit's meanwhile: https://github.com/nuriddin2468/avelune/blob/main/docs/consumers/migration.md.
- A component or variant is missing: do not build a local one. Open an issue with the RFC template of https://github.com/nuriddin2468/avelune/blob/main/CONTRIBUTING.md, and use the nearest kit component meanwhile.

### Examples

The application's providers (`app.config.ts`):

```ts
import { LOCALE_ID, type ApplicationConfig } from '@angular/core';
import { lucideFileText, lucideX } from '@avelune/icons/lucide';
import { provideAveIcons } from '@avelune/ui/icon';
import { provideAvelune } from '@avelune/ui/theme';

export const appConfig: ApplicationConfig = {
  providers: [
    // The kit's own words (labels, announcements) follow the locale: uz-Latn, uz-Cyrl, ru or en.
    { provide: LOCALE_ID, useValue: 'ru' },
    provideAvelune(),
    // Only the icons the application draws itself; the kit's components register their own.
    provideAveIcons([lucideFileText, lucideX]),
  ],
};
```

A field with Signal Forms:

```html
<ave-form-field label="Contract number">
  <input aveInput type="text" [formField]="contract.number" />
  <p aveHint>As written on the signed copy.</p>
  @if (contract.number().errors().length > 0) {
    <p aveError>Enter the contract number, for example ДК-2026/114.</p>
  }
</ave-form-field>
```

Actions: one primary per region, last in its row; an icon-only button has a label.

```html
<div role="group" aria-label="The contract's actions">
  <button aveIconButton type="button" icon="x" label="Close"></button>
  <button aveButton type="button">Cancel</button>
  <button aveButton type="button" variant="primary">Save changes</button>
</div>
```

A destructive action, confirmed by naming it:

```html
<dialog aveConfirmDialog heading="Удалить договор ДК-2026/114?" action="Удалить договор"
  [(open)]="asking" (confirm)="remove()">
  Договор <b>ДК-2026/114</b> и его приложения будут удалены без возможности восстановления.
</dialog>
```

A result reported in a toast:

```ts
import { Component, inject } from '@angular/core';
import { AveButton } from '@avelune/ui/button';
import { AveToaster } from '@avelune/ui/toast';

@Component({
  selector: 'app-contract-registry',
  imports: [AveButton],
  template: `<button aveButton type="button" (click)="save()">Сохранить документ</button>`,
})
export class ContractRegistry {
  private readonly toaster = inject(AveToaster);

  protected save(): void {
    this.toaster.show({ message: 'Документ сохранён', variant: 'success' });
  }
}
```

The application's own styles: layout on tokens, logical properties, motion from the catalog.

```css
.summary {
  display: grid;
  gap: var(--ave-space-4);
  padding-inline: var(--ave-space-6);
  color: var(--ave-color-fg-muted);
  border-block-end: var(--ave-border-width-default) solid var(--ave-color-border-subtle);
  transition-property: background-color;
  transition-duration: var(--ave-duration-fast);
  transition-timing-function: var(--ave-easing-standard);
}
```

```html
@if (expanded()) {
  <section class="summary" animate.enter="ave-motion-popover-enter" animate.leave="ave-motion-popover-exit">
    <p>Срок действия договора истекает через 14 дней.</p>
  </section>
}
```
