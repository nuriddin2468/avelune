import { ChangeDetectionStrategy, Component } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { tokens, type TokenName } from '@avelune/tokens';
import { DocsPage, DocsSection } from './docs-page';
import { cssVar, description, namesUnder } from './token-data';

@Component({
  selector: 'ave-docs-shape',
  imports: [DocsPage, DocsSection],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ave-docs-page heading="Radius and elevation">
      <span lead
        >Radii follow the hierarchy of elements, and nested corners are concentric. Four elevation levels, each a
        two-layer shadow; in the dark theme higher surfaces are also lighter and overlays carry a subtle border.</span
      >
      <ave-docs-section heading="Radius">
        <ul class="radii">
          @for (name of radii; track name) {
            <li class="radius-item">
              <span class="radius" aria-hidden="true" [style.border-radius]="variable(name)"></span>
              <span class="name">{{ name }}</span>
              <span class="value">{{ css(name) }}</span>
              <span class="description">{{ describe(name) }}</span>
            </li>
          }
        </ul>
      </ave-docs-section>
      <ave-docs-section
        heading="Concentric corners"
        note="A menu (radius lg, 12px) with a 4px inset holds items of radius md (8px): inner radius = outer radius − gap."
      >
        <div class="menu" role="presentation">
          <div class="item selected">Hujjatni saqlash</div>
          <div class="item">Сохранить как черновик</div>
          <div class="item">Export to PDF</div>
        </div>
      </ave-docs-section>
      <ave-docs-section heading="Elevation" note="Shown on the canvas and on a surface.">
        @for (backdrop of ['canvas', 'surface']; track backdrop) {
          <div class="stage" [class.on-surface]="backdrop === 'surface'">
            @for (name of levels; track name) {
              <div class="card" [class.overlay]="name !== 'elevation.flat'" [style.box-shadow]="variable(name)">
                <span class="name">{{ name }}</span>
                <span class="description">{{ describe(name) }}</span>
              </div>
            }
          </div>
        }
      </ave-docs-section>
      <ave-docs-section heading="Stacking order" note="z-index for elements outside the top layer, lowest first.">
        <ol class="layers">
          @for (name of layers; track name) {
            <li class="layer" [style.margin-inline-start]="'calc(' + $index + ' * var(--ave-space-3))'">
              <span class="name">{{ name }}</span>
              <span class="value">{{ css(name) }}</span>
            </li>
          }
        </ol>
      </ave-docs-section>
    </ave-docs-page>
  `,
  styles: `
    .radii {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, var(--ave-container-xs)), 1fr));
      gap: var(--ave-space-4);
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .radius-item {
      display: grid;
      grid-template-columns: var(--ave-space-16) 1fr;
      grid-template-rows: auto auto 1fr;
      column-gap: var(--ave-space-3);
    }
    .radius {
      grid-row: 1 / 4;
      block-size: var(--ave-space-16);
      background: var(--ave-color-accent-bg-subtle);
      border: var(--ave-border-width-selected) solid var(--ave-color-accent-border);
    }
    .name {
      font: var(--ave-font-label-md);
    }
    .value {
      font: var(--ave-font-code);
      color: var(--ave-color-fg-muted);
    }
    .description {
      font: var(--ave-font-caption);
      color: var(--ave-color-fg-muted);
    }
    .menu {
      display: grid;
      gap: var(--ave-space-1);
      max-inline-size: calc(var(--ave-container-xs) - var(--ave-space-8));
      padding: var(--ave-space-1);
      border-radius: var(--ave-radius-lg);
      border: var(--ave-border-width-default) solid var(--ave-color-border-subtle);
      background: var(--ave-color-bg-surface-raised);
      box-shadow: var(--ave-elevation-popover);
    }
    .item {
      display: flex;
      align-items: center;
      block-size: var(--ave-control-height-md);
      padding-inline: var(--ave-space-3);
      border-radius: var(--ave-radius-md);
    }
    .selected {
      background: var(--ave-color-accent-bg-subtle);
      color: var(--ave-color-accent-fg);
    }
    .stage {
      display: grid;
      grid-template-columns: repeat(
        auto-fill,
        minmax(min(100%, calc(var(--ave-container-xs) - var(--ave-space-16))), 1fr)
      );
      gap: var(--ave-space-8);
      padding: var(--ave-space-6);
      border-radius: var(--ave-radius-lg);
      background: var(--ave-color-bg-canvas);
      border: var(--ave-border-width-default) solid var(--ave-color-border-subtle);
    }
    .on-surface {
      background: var(--ave-color-bg-surface);
    }
    .card {
      display: grid;
      gap: var(--ave-space-1);
      align-content: start;
      min-block-size: var(--ave-space-16);
      padding: var(--ave-space-4);
      border-radius: var(--ave-radius-lg);
      background: var(--ave-color-bg-surface);
    }
    .overlay {
      background: var(--ave-color-bg-surface-raised);
      border: var(--ave-border-width-default) solid var(--ave-color-border-subtle);
    }
    .layers {
      display: grid;
      gap: var(--ave-space-2);
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .layer {
      display: flex;
      justify-content: space-between;
      max-inline-size: var(--ave-container-xs);
      padding: var(--ave-space-2) var(--ave-space-4);
      border-radius: var(--ave-radius-md);
      background: var(--ave-color-bg-surface-raised);
      border: var(--ave-border-width-default) solid var(--ave-color-border-subtle);
    }
  `,
})
class Shape {
  protected readonly radii = namesUnder('radius.');
  protected readonly levels = namesUnder('elevation.');
  protected readonly layers = namesUnder('z-index.');
  protected variable(name: TokenName): string {
    return `var(${cssVar(name)})`;
  }
  protected css(name: TokenName): string {
    return tokens[name].css;
  }
  protected describe(name: TokenName): string {
    return description(name);
  }
}

const meta: Meta = { title: 'Foundations/Radius and elevation' };
export default meta;

export const Shapes: StoryObj = {
  render: () => ({ template: `<ave-docs-shape />`, moduleMetadata: { imports: [Shape] } }),
};
