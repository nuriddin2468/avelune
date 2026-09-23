import { ChangeDetectionStrategy, Component } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { tokens, type TokenName } from '@avelune/tokens';
import { DocsPage, DocsSection } from './docs-page';
import { cssVar, description, namesUnder } from './token-data';

@Component({
  selector: 'ave-docs-spacing',
  imports: [DocsPage, DocsSection],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ave-docs-page heading="Spacing and size">
      <span lead
        >A 4px grid. Spacing tokens are named by their multiple (space.4 is 16px), the only semantic tokens with numbers
        in their names. Control heights come through component tokens, so compact density changes them; switch density
        in the toolbar.</span
      >
      <ave-docs-section heading="Spacing scale" note="Related elements 8, form fields 16, sections 32–48.">
        <ul class="scale">
          @for (name of space; track name) {
            <li class="step">
              <span class="name">{{ name }}</span>
              <span class="value">{{ px(name) }}</span>
              <span class="bar" aria-hidden="true" [style.inline-size]="variable(name)"></span>
            </li>
          }
        </ul>
      </ave-docs-section>
      <ave-docs-section
        heading="Control heights"
        note="Buttons, inputs and selects of one size share height and padding."
      >
        <div class="controls">
          @for (size of controlSizes; track size) {
            <div
              class="control"
              [style.block-size]="variable(size.height)"
              [style.padding-inline]="variable(size.padding)"
            >
              <span>{{ size.label }}</span>
            </div>
          }
        </div>
      </ave-docs-section>
      <ave-docs-section heading="Icons and targets">
        <ul class="boxes">
          @for (name of boxes; track name) {
            <li class="box-item">
              <span
                class="box"
                aria-hidden="true"
                [style.inline-size]="variable(name)"
                [style.block-size]="variable(name)"
              ></span>
              <span class="name">{{ name }}</span>
              <span class="value">{{ px(name) }}</span>
              <span class="description">{{ describe(name) }}</span>
            </li>
          }
        </ul>
      </ave-docs-section>
    </ave-docs-page>
  `,
  styles: `
    .scale,
    .boxes {
      display: grid;
      gap: var(--ave-space-2);
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .step {
      display: grid;
      grid-template-columns: minmax(0, calc(var(--ave-space-16) * 2)) var(--ave-space-12) minmax(0, 1fr);
      align-items: center;
      gap: var(--ave-space-4);
    }
    .name {
      font: var(--ave-font-label-md);
    }
    .value {
      font: var(--ave-font-code);
      color: var(--ave-color-fg-muted);
    }
    .bar {
      block-size: var(--ave-space-4);
      border-radius: var(--ave-radius-sm);
      background: var(--ave-color-accent-bg);
    }
    .controls {
      display: flex;
      flex-wrap: wrap;
      align-items: end;
      gap: var(--ave-space-4);
    }
    .control {
      display: inline-flex;
      align-items: center;
      border: var(--ave-border-width-default) solid var(--ave-color-border-strong);
      border-radius: var(--ave-radius-md);
      background: var(--ave-color-bg-surface);
      font: var(--ave-font-label-md);
    }
    .box-item {
      display: grid;
      grid-template-columns: var(--ave-space-12) minmax(0, 1fr) auto;
      align-items: center;
      column-gap: var(--ave-space-4);
    }
    .box {
      grid-row: span 2;
      border: var(--ave-border-width-default) dashed var(--ave-color-border-strong);
      border-radius: var(--ave-radius-sm);
    }
    .description {
      grid-column: 2 / -1;
      font: var(--ave-font-caption);
      color: var(--ave-color-fg-muted);
    }
    .description:empty {
      display: none;
    }
  `,
})
class Spacing {
  protected readonly space = namesUnder('space.');
  protected readonly boxes = [...namesUnder('size.icon.'), ...namesUnder('size.target.')];
  protected readonly controlSizes = (['sm', 'md', 'lg'] as const).map((size) => ({
    label: `Control ${size}`,
    height: `control.height.${size}` as const,
    padding: `control.padding-inline.${size}` as const,
  }));
  protected variable(name: TokenName): string {
    return `var(${cssVar(name)})`;
  }
  protected px(name: TokenName): string {
    return tokens[name].css;
  }
  protected describe(name: TokenName): string {
    return description(name);
  }
}

const meta: Meta = { title: 'Foundations/Spacing and size' };
export default meta;

export const Scale: StoryObj = {
  render: () => ({ template: `<ave-docs-spacing />`, moduleMetadata: { imports: [Spacing] } }),
};
