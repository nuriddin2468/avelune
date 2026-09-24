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
  styleUrl: './docs-shape.css',
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
