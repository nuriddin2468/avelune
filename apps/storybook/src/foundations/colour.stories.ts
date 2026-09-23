import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import type { TokenName } from '@avelune/tokens';
import { DocsPage, DocsScroll, DocsSection } from './docs-page';
import { contrastPairs, cssValue, cssVar, description, themeOf, type Theme } from './token-data';

type SwatchKind = 'fill' | 'text' | 'border';

interface Swatch {
  readonly name: TokenName;
  readonly kind: SwatchKind;
  /** For fills: the token drawn on top (an on-colour); for text: the surface behind it. */
  readonly partner?: TokenName;
}

interface Group {
  readonly title: string;
  readonly note: string;
  readonly swatches: readonly Swatch[];
}

const roles = ['accent', 'info', 'success', 'warning', 'danger'] as const;

const groups: readonly Group[] = [
  {
    title: 'Surfaces',
    note: 'Higher surfaces are lighter in the dark theme; in the light theme they are white on an off-white canvas.',
    swatches: [
      { name: 'color.bg.canvas', kind: 'fill', partner: 'color.fg.default' },
      { name: 'color.bg.surface', kind: 'fill', partner: 'color.fg.default' },
      { name: 'color.bg.surface-raised', kind: 'fill', partner: 'color.fg.default' },
      { name: 'color.bg.surface-sunken', kind: 'fill', partner: 'color.fg.default' },
      { name: 'color.bg.backdrop', kind: 'fill' },
    ],
  },
  {
    title: 'State layers',
    note: 'Translucent layers for hovered and pressed items that have no fill of their own, and the fill of disabled controls.',
    swatches: [
      { name: 'color.bg.hover', kind: 'fill', partner: 'color.fg.default' },
      { name: 'color.bg.active', kind: 'fill', partner: 'color.fg.default' },
      { name: 'color.bg.disabled', kind: 'fill', partner: 'color.fg.disabled' },
    ],
  },
  {
    title: 'Text',
    note: 'Solid colours, never opacity, so every pair is computable. Disabled text is exempt from contrast minimums.',
    swatches: [
      { name: 'color.fg.default', kind: 'text', partner: 'color.bg.surface' },
      { name: 'color.fg.muted', kind: 'text', partner: 'color.bg.surface' },
      { name: 'color.fg.subtle', kind: 'text', partner: 'color.bg.surface' },
      { name: 'color.fg.disabled', kind: 'text', partner: 'color.bg.surface' },
      { name: 'color.fg.link', kind: 'text', partner: 'color.bg.surface' },
    ],
  },
  {
    title: 'Borders',
    note: 'Subtle and default borders are decorative; strong borders and the focus ring reach 3:1 against every surface.',
    swatches: [
      { name: 'color.border.subtle', kind: 'border' },
      { name: 'color.border.default', kind: 'border' },
      { name: 'color.border.strong', kind: 'border' },
      { name: 'color.border.focus', kind: 'border' },
    ],
  },
  ...roles.map((role): Group => ({
    title: role === 'accent' ? 'Accent' : `Status: ${role}`,
    note:
      role === 'accent'
        ? 'Primary actions, selection and focus. The fill is the exact brand colour with dark text in both themes (ADR 0019).'
        : '',
    swatches: [
      { name: `color.${role}.bg`, kind: 'fill', partner: `color.fg.on-${role}` },
      { name: `color.${role}.bg-hover`, kind: 'fill', partner: `color.fg.on-${role}` },
      { name: `color.${role}.bg-active`, kind: 'fill', partner: `color.fg.on-${role}` },
      { name: `color.${role}.bg-subtle`, kind: 'fill', partner: `color.${role}.fg` },
      { name: `color.${role}.fg`, kind: 'text', partner: 'color.bg.surface' },
      { name: `color.${role}.border`, kind: 'border' },
    ],
  })),
  {
    title: 'Brand',
    note: 'The exact brand colour as a mark: logos, illustrations, data. Buttons use it through color.accent.bg with dark text.',
    swatches: [{ name: 'color.brand.mark', kind: 'fill' }],
  },
];

@Component({
  selector: 'ave-docs-colour-roles',
  imports: [DocsPage, DocsSection],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ave-docs-page heading="Colour">
      <span lead
        >Semantic colour roles, {{ theme() }} theme. Names describe purpose; themes map them to the generated OKLCH
        palette. Switch the theme in the toolbar.</span
      >
      @for (group of groups; track group.title) {
        <ave-docs-section [heading]="group.title" [note]="group.note">
          <ul class="swatches">
            @for (swatch of group.swatches; track swatch.name) {
              <li class="swatch">
                @switch (swatch.kind) {
                  @case ('fill') {
                    @if (isDisabled(swatch)) {
                      <!-- A disabled control: the WCAG 1.4.3 exemption applies, so it is one. -->
                      <button
                        type="button"
                        disabled
                        class="sample fill"
                        tabindex="-1"
                        [style.background-color]="variable(swatch.name)"
                        [style.color]="swatch.partner ? variable(swatch.partner) : null"
                      >
                        Aa
                      </button>
                    } @else {
                      <span
                        class="sample fill"
                        aria-hidden="true"
                        [style.background-color]="variable(swatch.name)"
                        [style.color]="swatch.partner ? variable(swatch.partner) : null"
                        >{{ swatch.partner ? 'Aa' : '' }}</span
                      >
                    }
                  }
                  @case ('text') {
                    @if (isDisabled(swatch)) {
                      <button
                        type="button"
                        disabled
                        class="sample text"
                        tabindex="-1"
                        [style.color]="variable(swatch.name)"
                        [style.background-color]="swatch.partner ? variable(swatch.partner) : null"
                      >
                        Oʻzbek Ғалаба
                      </button>
                    } @else {
                      <span
                        class="sample text"
                        aria-hidden="true"
                        [style.color]="variable(swatch.name)"
                        [style.background-color]="swatch.partner ? variable(swatch.partner) : null"
                        >Oʻzbek Ғалаба</span
                      >
                    }
                  }
                  @case ('border') {
                    <span class="sample border" aria-hidden="true" [style.border-color]="variable(swatch.name)"></span>
                  }
                }
                <span class="name">{{ swatch.name }}</span>
                <code class="value">{{ value(swatch.name) }}</code>
                <span class="description">{{ describe(swatch.name) }}</span>
              </li>
            }
          </ul>
        </ave-docs-section>
      }
    </ave-docs-page>
  `,
  styles: `
    .swatches {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, var(--ave-container-xs)), 1fr));
      gap: var(--ave-space-4);
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .swatch {
      display: grid;
      grid-template-columns: var(--ave-space-16) 1fr;
      grid-template-rows: auto auto 1fr;
      column-gap: var(--ave-space-3);
      row-gap: var(--ave-space-1);
      align-items: start;
    }
    .sample {
      grid-row: 1 / 4;
      display: grid;
      place-items: center;
      block-size: var(--ave-space-16);
      padding: 0;
      border-radius: var(--ave-radius-md);
      border: var(--ave-border-width-default) solid var(--ave-color-border-subtle);
      font: var(--ave-font-label-md);
    }
    .text {
      padding-inline: var(--ave-space-1);
      text-align: center;
    }
    .border {
      border-width: var(--ave-border-width-selected);
      background-color: var(--ave-color-bg-surface);
    }
    .name {
      font: var(--ave-font-label-md);
      overflow-wrap: anywhere;
    }
    .value {
      font: var(--ave-font-code);
      color: var(--ave-color-fg-muted);
    }
    .description {
      font: var(--ave-font-caption);
      color: var(--ave-color-fg-muted);
    }
  `,
})
class ColourRoles {
  /** The theme the page describes. */
  readonly theme = input<Theme>('light');
  protected readonly groups = groups;
  protected variable(name: TokenName): string {
    return `var(${cssVar(name)})`;
  }
  protected value(name: TokenName): string {
    return cssValue(name, this.theme());
  }
  protected describe(name: TokenName): string {
    return description(name);
  }
  protected isDisabled(swatch: Swatch): boolean {
    return swatch.name.endsWith('.disabled') || swatch.partner?.endsWith('.disabled') === true;
  }
}

@Component({
  selector: 'ave-docs-contrast',
  imports: [DocsPage, DocsScroll, DocsSection],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ave-docs-page heading="Contrast">
      <span lead
        >Every pair declared in contrast-pairs.json, computed on the painted colours of the {{ theme() }} theme.
        tools/tokens-check fails the build below the minimum (WCAG 2.x). APCA Lc is shown for information only.</span
      >
      @for (group of groups(); track group.reason) {
        <ave-docs-section [heading]="group.reason" [note]="'Minimum ' + group.minimum + ':1'">
          <ave-docs-scroll [label]="'Table: ' + group.reason">
            <table class="pairs">
              <thead>
                <tr>
                  <th scope="col">Sample</th>
                  <th scope="col">Foreground</th>
                  <th scope="col">Background</th>
                  <th scope="col" class="number">WCAG</th>
                  <th scope="col" class="number">APCA Lc</th>
                </tr>
              </thead>
              <tbody>
                @for (pair of group.results; track $index) {
                  <tr>
                    <td>
                      <span
                        class="sample"
                        aria-hidden="true"
                        [style.background-color]="pair.over ? variable(pair.over) : variable(pair.background)"
                      >
                        <span
                          class="inner"
                          [class.boundary]="isBoundary(pair.foreground)"
                          [class.filled]="isFill(pair.foreground)"
                          [style.background-color]="
                            isFill(pair.foreground)
                              ? variable(pair.foreground)
                              : pair.over
                                ? variable(pair.background)
                                : null
                          "
                          [style.border-color]="isBoundary(pair.foreground) ? variable(pair.foreground) : null"
                          [style.color]="variable(pair.foreground)"
                          >{{ isBoundary(pair.foreground) || isFill(pair.foreground) ? '' : 'Oʻ Ғ Aa' }}</span
                        >
                      </span>
                    </td>
                    <td class="token">{{ pair.foreground }}</td>
                    <td class="token">
                      {{ pair.background }}
                      @if (pair.over) {
                        <span class="over">over {{ pair.over }}</span>
                      }
                    </td>
                    <td class="number" [class.fail]="pair.wcag < pair.minimum">
                      {{ pair.wcag.toFixed(2) }}:1 {{ pair.wcag < pair.minimum ? 'fails' : 'passes' }}
                    </td>
                    <td class="number">{{ pair.apca.toFixed(0) }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </ave-docs-scroll>
        </ave-docs-section>
      }
    </ave-docs-page>
  `,
  styles: `
    .pairs {
      inline-size: 100%;
      border-collapse: collapse;
      font: var(--ave-font-body-sm);
    }
    th {
      padding: var(--ave-space-2) var(--ave-space-3);
      text-align: start;
      font: var(--ave-font-label-sm);
      color: var(--ave-color-fg-muted);
      border-block-end: var(--ave-border-width-default) solid var(--ave-color-border-default);
    }
    td {
      padding: var(--ave-space-2) var(--ave-space-3);
      border-block-end: var(--ave-border-width-default) solid var(--ave-color-border-subtle);
      vertical-align: middle;
    }
    .number {
      text-align: end;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }
    .fail {
      color: var(--ave-color-danger-fg);
    }
    .token {
      font: var(--ave-font-code);
      overflow-wrap: anywhere;
    }
    .over {
      display: block;
      color: var(--ave-color-fg-muted);
    }
    .sample {
      display: inline-grid;
      place-items: center;
      inline-size: var(--ave-space-16);
      block-size: var(--ave-space-10);
      border-radius: var(--ave-radius-sm);
      border: var(--ave-border-width-default) solid var(--ave-color-border-subtle);
    }
    .inner {
      display: grid;
      place-items: center;
      inline-size: 100%;
      block-size: 100%;
      font: var(--ave-font-label-md);
      border-radius: var(--ave-radius-sm);
    }
    .boundary,
    .filled {
      inline-size: var(--ave-space-5);
      block-size: var(--ave-space-5);
    }
    .boundary {
      border: var(--ave-border-width-selected) solid;
    }
  `,
})
class Contrast {
  /** The theme the page describes. */
  readonly theme = input<Theme>('light');
  protected readonly groups = computed(() => contrastPairs(this.theme()));
  protected variable(name: TokenName): string {
    return `var(${cssVar(name)})`;
  }
  protected isBoundary(name: TokenName): boolean {
    return name.includes('.border');
  }
  protected isFill(name: TokenName): boolean {
    return /\.bg$/.test(name);
  }
}

const meta: Meta = { title: 'Foundations/Colour' };
export default meta;

export const Roles: StoryObj = {
  render: (_args, { globals }) => ({
    props: { theme: themeOf(globals) },
    template: `<ave-docs-colour-roles [theme]="theme" />`,
    moduleMetadata: { imports: [ColourRoles] },
  }),
};

export const ContrastPairs: StoryObj = {
  name: 'Contrast pairs',
  render: (_args, { globals }) => ({
    props: { theme: themeOf(globals) },
    template: `<ave-docs-contrast [theme]="theme" />`,
    moduleMetadata: { imports: [Contrast] },
  }),
};
