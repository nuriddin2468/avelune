import { ChangeDetectionStrategy, Component, afterNextRender, signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { tokens, type TokenName } from '@avelune/tokens';
import { DocsPage, DocsScroll, DocsSection } from './docs-page';
import { cssVar } from './token-data';

interface Role {
  readonly name: TokenName;
  readonly label: string;
}

const roles: readonly Role[] = [
  { name: 'font.display', label: 'display' },
  { name: 'font.heading-xl', label: 'heading-xl' },
  { name: 'font.heading-lg', label: 'heading-lg' },
  { name: 'font.heading-md', label: 'heading-md' },
  { name: 'font.heading-sm', label: 'heading-sm' },
  { name: 'font.body-lg', label: 'body-lg' },
  { name: 'font.body-md', label: 'body-md' },
  { name: 'font.body-sm', label: 'body-sm' },
  { name: 'font.label-md', label: 'label-md' },
  { name: 'font.label-sm', label: 'label-sm' },
  { name: 'font.caption', label: 'caption' },
  { name: 'font.code', label: 'code' },
];

/** Sample lines in every locale of the kit; Uzbek Latin carries Oʻ, Gʻ and ʼ, Uzbek Cyrillic Ў, Қ, Ғ, Ҳ. */
const samples = [
  { lang: 'uz-Latn', text: 'Oʻzbekiston Respublikasi: hujjatlar roʻyxati, Gʻalaba koʻchasi, maʼlumotlar bazasi' },
  { lang: 'uz-Cyrl', text: 'Ўзбекистон Республикаси: ҳужжатлар рўйхати, Ғалаба кўчаси, қарорлар' },
  { lang: 'ru', text: 'Список документов: съешь же ещё этих мягких французских булок, да выпей чаю' },
  { lang: 'en', text: 'Save changes to the document register before 14:05' },
] as const;

@Component({
  selector: 'ave-docs-typography',
  imports: [DocsPage, DocsScroll, DocsSection],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ave-docs-page heading="Typography">
      <span lead
        >Twelve roles on IBM Plex Sans, shipped as Avelune Sans (ADR 0018). Body text is 14/20; every line height is a
        multiple of 4; three weights: 400, 500, 600.</span
      >
      <ave-docs-section heading="Font" [note]="fontStatus()">
        <dl class="facts">
          <div>
            <dt>Family</dt>
            <dd>Avelune Sans (IBM Plex Sans 3.201), Avelune Sans Fallback, sans-serif</dd>
          </div>
          <div>
            <dt>Weights</dt>
            <dd>400 regular, 500 medium, 600 semibold</dd>
          </div>
          <div>
            <dt>Subsets</dt>
            <dd>latin, latin-ext, cyrillic with Uzbek Ғ Қ Ҳ</dd>
          </div>
        </dl>
      </ave-docs-section>
      <ave-docs-section heading="Roles">
        <ul class="roles">
          @for (role of roles; track role.name) {
            <li class="role">
              <div class="meta">
                <span class="label">{{ role.label }}</span>
                <span class="spec">{{ spec(role.name) }}</span>
              </div>
              <div class="lines">
                @for (
                  sample of role.name === 'font.display' || role.name === 'font.heading-xl'
                    ? samples.slice(0, 2)
                    : samples;
                  track sample.lang
                ) {
                  <p class="line" [lang]="sample.lang" [style.font]="variable(role.name)">{{ sample.text }}</p>
                }
              </div>
            </li>
          }
        </ul>
      </ave-docs-section>
      <ave-docs-section
        heading="Figures"
        note="Figures are tabular by default, so numbers align in columns. The values are what this browser's Intl produces: Chromium formats uz-Latn with root patterns (UZS 1,234,567.80), a tracked risk in ROADMAP.md."
      >
        <ave-docs-scroll [label]="'Table of figures'">
          <table class="figures">
            <caption class="caption">
              Money and dates as Intl formats them in each locale
            </caption>
            <tbody>
              @for (row of figures; track row.locale) {
                <tr>
                  <th scope="row">{{ row.locale }}</th>
                  <td [lang]="row.locale">{{ row.money }}</td>
                  <td [lang]="row.locale">{{ row.date }}</td>
                </tr>
              }
            </tbody>
          </table>
        </ave-docs-scroll>
      </ave-docs-section>
    </ave-docs-page>
  `,
  styles: `
    .facts {
      display: grid;
      gap: var(--ave-space-2);
      margin: 0;
    }
    .facts div {
      display: grid;
      grid-template-columns: var(--ave-space-16) 1fr;
      gap: var(--ave-space-4);
    }
    dt {
      color: var(--ave-color-fg-muted);
    }
    dd {
      margin: 0;
    }
    .roles {
      display: grid;
      margin: 0;
      padding: 0;
      list-style: none;
    }
    /* Meta and samples side by side when there is room, stacked on narrow screens. */
    .role {
      display: flex;
      flex-wrap: wrap;
      column-gap: var(--ave-space-6);
      row-gap: var(--ave-space-2);
      padding-block: var(--ave-space-4);
      border-block-start: var(--ave-border-width-default) solid var(--ave-color-border-subtle);
    }
    .meta {
      display: grid;
      flex: 0 0 calc(var(--ave-space-16) * 2);
      align-content: start;
      gap: var(--ave-space-1);
    }
    .label {
      font: var(--ave-font-label-md);
    }
    .spec {
      font: var(--ave-font-caption);
      color: var(--ave-color-fg-muted);
    }
    .lines {
      display: grid;
      flex: 1 1 var(--ave-container-xs);
      gap: var(--ave-space-1);
      min-inline-size: 0;
    }
    .line {
      margin: 0;
    }
    .figures {
      inline-size: max-content;
      border-collapse: collapse;
      font: var(--ave-font-body-md);
    }
    .figures th,
    .figures td {
      padding: var(--ave-space-2) var(--ave-space-4);
      text-align: end;
      border-block-end: var(--ave-border-width-default) solid var(--ave-color-border-subtle);
    }
    .figures th {
      text-align: start;
      font: var(--ave-font-label-md);
      color: var(--ave-color-fg-muted);
    }
    .caption {
      padding-block-end: var(--ave-space-2);
      text-align: start;
      font: var(--ave-font-caption);
      color: var(--ave-color-fg-muted);
    }
  `,
})
class Typography {
  protected readonly roles = roles;
  protected readonly samples = samples;
  protected readonly fontStatus = signal('Checking whether Avelune Sans loaded…');
  protected readonly figures = (['uz-Latn', 'uz-Cyrl', 'ru', 'en'] as const).map((locale) => ({
    locale,
    money: new Intl.NumberFormat(locale, { style: 'currency', currency: 'UZS' }).format(1234567.8),
    date: new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeZone: 'Asia/Tashkent' }).format(
      new Date(Date.UTC(2026, 8, 23)),
    ),
  }));

  constructor() {
    afterNextRender(async () => {
      await document.fonts.ready;
      const loaded = [400, 500, 600].every((weight) => document.fonts.check(`${weight} 14px "Avelune Sans"`, 'Oʻ Ғ Ж'));
      this.fontStatus.set(
        loaded
          ? 'Avelune Sans is loaded in all three weights for Latin and Cyrillic.'
          : 'Avelune Sans did not load; the page shows the fallback.',
      );
    });
  }

  protected variable(name: TokenName): string {
    return `var(${cssVar(name)})`;
  }

  protected spec(name: TokenName): string {
    const value = tokens[name].value;
    if (typeof value !== 'object' || value === null || !('fontSize' in value)) return '';
    return `${value.fontSize}/${value.lineHeight} · ${value.fontWeight}`;
  }
}

const meta: Meta = { title: 'Foundations/Typography' };
export default meta;

export const Specimen: StoryObj = {
  render: () => ({ template: `<ave-docs-typography />`, moduleMetadata: { imports: [Typography] } }),
};
