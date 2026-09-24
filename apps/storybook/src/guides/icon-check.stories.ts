import { NgComponentOutlet } from '@angular/common';
import { Component, ElementRef, Injector, afterNextRender, computed, inject, signal, type Signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, within } from 'storybook/test';
import type { IconNode } from '@avelune/icons';
import {
  lucideBell,
  lucideCalendar,
  lucideCircleCheck,
  lucideSettings,
  lucideTriangleAlert,
} from '@avelune/icons/lucide';
import {
  AveIcon,
  defineAveIcon,
  provideAveIcons,
  type AveCustomIconOptions,
  type AveIconDefinition,
  type AveIconSize,
} from '@avelune/ui/icon';

declare module '@avelune/icons' {
  interface IconNames {
    'checked-icon': true;
  }
}

/** The sample: a certificate drawn by Lucide's rules and exported from a design tool in its own black. */
const sample = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M13 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3" stroke="#1E1E1E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M13 3v4a1 1 0 0 0 1 1h4v2" stroke="#1E1E1E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="16" cy="15" r="3" stroke="#1E1E1E" stroke-width="2"/>
  <path d="m14.5 17.6-.5 4.4 2-1 2 1-.5-4.4" stroke="#1E1E1E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

/** One of Lucide's rules, checked on the SVG. */
interface Finding {
  readonly rule: string;
  readonly passed: boolean;
  readonly detail: string;
}

/** Paint an element inherits from its ancestors. */
interface Inherited {
  readonly fill: string | undefined;
  readonly stroke: string | undefined;
  readonly width: string | undefined;
  readonly cap: string | undefined;
  readonly join: string | undefined;
}

const openShapes = new Set(['line', 'path', 'polyline']);
const cornerShapes = new Set(['path', 'polygon', 'polyline', 'rect']);
const drawnShapes = new Set(['circle', 'ellipse', 'line', 'path', 'polygon', 'polyline', 'rect', 'use']);
const definitions = new Set(['clipPath', 'defs', 'linearGradient', 'mask', 'radialGradient']);

const isColour = (value: string | undefined): value is string =>
  value !== undefined && !/^(?:none|transparent|currentColor|inherit)$/i.test(value) && !value.startsWith('url(');

/**
 * Checks the rules of Lucide's design guide that can be read from the markup (lucide.dev/contribute/icon-design-guide),
 * on the icon as drawn: colours and strokes untouched.
 */
function audit(icon: AveIconDefinition): readonly Finding[] {
  const widths = new Set<string>();
  const caps = new Set<string>();
  const joins = new Set<string>();
  const colours = new Set<string>();
  let filled = 0;
  const walk = (nodes: readonly IconNode[], inherited: Inherited, hidden: boolean) => {
    for (const { tag, attrs, children } of nodes) {
      const paint: Inherited = {
        fill: attrs.fill ?? inherited.fill,
        stroke: attrs.stroke ?? inherited.stroke,
        width: attrs['stroke-width'] ?? inherited.width,
        cap: attrs['stroke-linecap'] ?? inherited.cap,
        join: attrs['stroke-linejoin'] ?? inherited.join,
      };
      for (const value of [attrs.fill, attrs.stroke, attrs['stop-color']]) if (isColour(value)) colours.add(value);
      if (!hidden && drawnShapes.has(tag)) {
        if (paint.stroke !== undefined && paint.stroke !== 'none') {
          widths.add(paint.width ?? '1');
          if (openShapes.has(tag)) caps.add(paint.cap ?? 'butt');
          if (cornerShapes.has(tag)) joins.add(paint.join ?? 'miter');
        }
        const dot = tag === 'circle' && Number(attrs.r) <= 1;
        // An SVG fills a shape black unless told otherwise.
        if ((paint.fill ?? 'black') !== 'none' && !dot) filled += 1;
      }
      if (children !== undefined) walk(children, paint, hidden || definitions.has(tag));
    }
  };
  const { paint } = icon;
  walk(
    icon.nodes,
    {
      fill: paint.fill,
      stroke: paint.stroke,
      width: paint['stroke-width'],
      cap: paint['stroke-linecap'],
      join: paint['stroke-linejoin'],
    },
    false,
  );
  const list = (values: ReadonlySet<string>) => [...values].join(', ');
  const round = (values: ReadonlySet<string>) => [...values].every((value) => value === 'round');
  return [
    {
      rule: 'A 24 × 24 canvas',
      passed: icon.viewBox === '0 0 24 24',
      detail:
        icon.viewBox === '0 0 24 24'
          ? 'viewBox 0 0 24 24.'
          : `viewBox ${icon.viewBox}. The kit scales it to the icon size, but Lucide's grid keeps icons alike.`,
    },
    {
      rule: 'Strokes 2 px wide',
      passed: widths.size > 0 && [...widths].every((width) => Number(width) === 2),
      detail:
        widths.size === 0
          ? 'Nothing is stroked: Lucide draws outlines.'
          : `stroke-width ${list(widths)}. The kit draws strokes at its own width for each size.`,
    },
    {
      rule: 'Round caps and joins',
      passed: round(caps) && round(joins),
      detail:
        caps.size + joins.size === 0
          ? 'No open lines or corners.'
          : `Caps ${list(caps) || '(none)'}; joins ${list(joins) || '(none)'}.`,
    },
    {
      rule: 'Outlines, not fills',
      passed: filled === 0,
      detail:
        filled === 0
          ? 'No filled shapes (small dots excepted).'
          : `${String(filled)} filled shape${filled === 1 ? '' : 's'}; Lucide fills only dots.`,
    },
    {
      rule: 'One colour',
      passed: colours.size <= 1,
      detail:
        colours.size === 0
          ? 'Drawn in currentColor.'
          : colours.size === 1
            ? `${list(colours)}; the kit paints it in the text colour.`
            : `${String(colours.size)} colours (${list(colours)}). Keep icons monochrome, or register this one with colors: 'original'.`,
    },
  ];
}

const sizes: readonly AveIconSize[] = ['sm', 'md', 'lg'];

/** The icon in each size and both themes, next to three Lucide icons; measures its padding once drawn. */
@Component({
  selector: 'ave-icon-check-preview',
  imports: [AveIcon],
  template: `
    <div class="islands">
      @for (theme of themes; track theme) {
        <div class="island" [attr.data-theme]="theme">
          <p class="island-title">{{ theme === 'light' ? 'Light' : 'Dark' }} theme</p>
          @for (size of sizes; track size) {
            <p class="sample">
              <ave-icon name="checked-icon" label="Your icon" [size]="size" />
              <ave-icon name="calendar" decorative [size]="size" />
              <ave-icon name="bell" decorative [size]="size" />
              <ave-icon name="settings" decorative [size]="size" />
              <span class="size-name">{{ size }}</span>
            </p>
          }
        </div>
      }
    </div>
    <p class="padding" data-padding>
      <strong>Padding:</strong>
      {{ padding() }}
    </p>
  `,
  styleUrl: './icon-check.css',
})
class CheckPreview {
  protected readonly themes = ['light', 'dark'] as const;
  protected readonly sizes = sizes;
  protected readonly padding = signal('measuring…');

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    afterNextRender({
      read: () => {
        const svg = host.querySelector<SVGSVGElement>('ave-icon[data-icon="checked-icon"] svg');
        if (svg === null) return;
        const [, , width = 0, height = 0] = (svg.getAttribute('viewBox') ?? '').split(' ').map(Number);
        const box = svg.getBBox();
        const stroked = svg.querySelector('[stroke]:not([stroke="none"])') !== null || svg.hasAttribute('stroke');
        // Lucide keeps 1px between strokes and the edge; a 2px stroke reaches 1px past its path.
        const margin = ((stroked ? 2 : 1) * Math.max(width, height)) / 24;
        const inside =
          box.x >= margin - 0.01 &&
          box.y >= margin - 0.01 &&
          box.x + box.width <= width - margin + 0.01 &&
          box.y + box.height <= height - margin + 0.01;
        const span = `The drawing spans ${box.x.toFixed(1)}–${(box.x + box.width).toFixed(1)} across and ${box.y.toFixed(1)}–${(box.y + box.height).toFixed(1)} down`;
        this.padding.set(
          inside
            ? `${span}: at least 1px from every edge, as Lucide asks.`
            : `${span}: closer than 1px to an edge; Lucide keeps every stroke 1px inside the canvas.`,
        );
      },
    });
  }
}

type CheckResult =
  | { readonly icon: AveIconDefinition; readonly drawn: AveIconDefinition; readonly problems?: never }
  | { readonly icon?: never; readonly drawn?: never; readonly problems: readonly string[] };

/** The page: an SVG in, the icon out, in both themes and every size, with Lucide's rules checked. */
@Component({
  selector: 'ave-icon-check',
  imports: [AveIcon, NgComponentOutlet],
  providers: [provideAveIcons([lucideCircleCheck, lucideTriangleAlert])],
  template: `
    <main class="page">
      <h1 class="title">Check your icon</h1>
      <p class="lead">
        Paste an SVG. The kit draws it as <code>defineAveIcon</code> would, next to Lucide's icons, and checks the rules
        of <a href="https://lucide.dev/contribute/icon-design-guide">Lucide's design guide</a> that can be read from the
        markup.
      </p>
      <div class="layout">
        <div class="form">
          <label class="field-label" for="icon-check-source">SVG</label>
          <textarea
            #area
            id="icon-check-source"
            class="source"
            rows="14"
            spellcheck="false"
            [value]="source()"
            (input)="source.set(area.value)"
          ></textarea>
          <fieldset class="options">
            <legend>Colours</legend>
            @for (option of colourOptions; track option.value) {
              <label class="option">
                <input
                  type="radio"
                  name="icon-check-colours"
                  [value]="option.value"
                  [checked]="colors() === option.value"
                  (change)="colors.set(option.value)"
                />
                {{ option.label }}
              </label>
            }
          </fieldset>
          <fieldset class="options">
            <legend>Strokes</legend>
            @for (option of strokeOptions; track option.value) {
              <label class="option">
                <input
                  type="radio"
                  name="icon-check-strokes"
                  [value]="option.value"
                  [checked]="strokes() === option.value"
                  (change)="strokes.set(option.value)"
                />
                {{ option.label }}
              </label>
            }
          </fieldset>
        </div>
        <div class="result">
          @if (result().problems; as problems) {
            <div class="problems" role="alert">
              <p class="problems-title">The kit cannot use this SVG:</p>
              <ul>
                @for (problem of problems; track problem) {
                  <li>{{ problem }}</li>
                }
              </ul>
            </div>
          } @else {
            <ng-container *ngComponentOutlet="preview; injector: previewInjector()" />
            <h2 class="subtitle">Lucide's rules</h2>
            <ul class="findings">
              @for (finding of findings(); track finding.rule) {
                <li class="finding" [attr.data-passed]="finding.passed">
                  <ave-icon
                    [name]="finding.passed ? 'circle-check' : 'triangle-alert'"
                    [label]="finding.passed ? 'Follows' : 'Differs'"
                  />
                  <span
                    ><strong>{{ finding.rule }}.</strong> {{ finding.detail }}</span
                  >
                </li>
              }
            </ul>
            <h2 class="subtitle">Check by eye</h2>
            <ul class="by-eye">
              <li>Corners: a 2px radius on shapes 8px or larger, 1px on smaller ones.</li>
              <li>At least 2px between separate parts.</li>
              <li>As heavy and as centred as Lucide's icons beside it.</li>
              <li>Points on the pixel grid where the shape allows it.</li>
            </ul>
          }
        </div>
      </div>
    </main>
  `,
  styleUrl: './icon-check.css',
})
class IconCheck {
  private readonly injector = inject(Injector);
  protected readonly preview = CheckPreview;
  protected readonly source = signal(sample);
  protected readonly colors = signal<NonNullable<AveCustomIconOptions['colors']>>('current');
  protected readonly strokes = signal<NonNullable<AveCustomIconOptions['strokes']>>('kit');
  protected readonly colourOptions = [
    { value: 'current', label: 'The text colour (default)' },
    { value: 'original', label: "Its own colours (colors: 'original')" },
  ] as const;
  protected readonly strokeOptions = [
    { value: 'kit', label: "The kit's width (default)" },
    { value: 'original', label: "Its own width (strokes: 'original')" },
  ] as const;

  protected readonly result: Signal<CheckResult> = computed(() => {
    const options = { colors: this.colors(), strokes: this.strokes() };
    try {
      return {
        icon: defineAveIcon('checked-icon', this.source(), options),
        drawn: defineAveIcon('checked-icon', this.source(), { colors: 'original', strokes: 'original' }),
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        problems: message
          .split('\n')
          .slice(1)
          .map((line) => line.replace(/^- /, '')),
      };
    }
  });

  protected readonly findings = computed(() => {
    const { drawn } = this.result();
    return drawn === undefined ? [] : audit(drawn);
  });

  /** A fresh injector per icon, so the preview registers exactly the icon being checked. */
  protected readonly previewInjector = computed(() => {
    const { icon } = this.result();
    return Injector.create({
      providers: [provideAveIcons([...(icon === undefined ? [] : [icon]), lucideCalendar, lucideBell, lucideSettings])],
      parent: this.injector,
    });
  });
}

const meta: Meta = {
  title: 'Guides/Custom icons',
  parameters: { layout: 'fullscreen' },
};
export default meta;

/**
 * Paste an SVG, see it as the kit draws it next to Lucide's icons in every size and both themes, and read which of
 * Lucide's rules it follows.
 */
export const Check: StoryObj = {
  name: 'Check your icon',
  render: () => ({ template: `<ave-icon-check />`, moduleMetadata: { imports: [IconCheck] } }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole('img', { name: 'Your icon' })).toHaveLength(6);
    await expect(canvas.queryAllByRole('img', { name: 'Differs' })).toHaveLength(0);
    await expect(canvasElement.querySelector('[data-padding]')?.textContent).toMatch(/at least 1px from every edge/);

    // Its own colours: the design tool's black stays.
    await userEvent.click(canvas.getByRole('radio', { name: /Its own colours/ }));
    await expect(canvasElement.querySelector('ave-icon[data-icon="checked-icon"] path')?.getAttribute('stroke')).toBe(
      '#1E1E1E',
    );
    await userEvent.click(canvas.getByRole('radio', { name: /The text colour/ }));

    // Markup the kit refuses shows every problem instead of the preview.
    const area = canvas.getByRole('textbox', { name: 'SVG' });
    await userEvent.clear(area);
    await userEvent.click(area);
    await userEvent.paste('<svg viewBox="0 0 24 24"><script>alert(1)</script><path class="a" d="M0 0"/></svg>');
    const alert = await canvas.findByRole('alert');
    await expect(alert).toHaveTextContent('<script> (element 2): scripts are not allowed');

    // A filled, two-colour drawing on another canvas differs from Lucide's rules.
    await userEvent.clear(area);
    await userEvent.paste(
      '<svg viewBox="0 0 32 32"><rect width="32" height="32" fill="#123456"/><circle cx="16" cy="16" r="8" fill="#fedcba"/></svg>',
    );
    await expect(await canvas.findAllByRole('img', { name: 'Differs' })).toHaveLength(4);

    // Back to the sample, the state the visual baseline records.
    await userEvent.clear(area);
    await userEvent.paste(sample);
    await expect(await canvas.findAllByRole('img', { name: 'Follows' })).toHaveLength(5);
    area.blur();
  },
};
