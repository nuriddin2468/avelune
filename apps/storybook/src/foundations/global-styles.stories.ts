import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, within } from 'storybook/test';
import { tokens, type TokenName } from '@avelune/tokens';
import { DocsPage, DocsScroll, DocsSection } from './docs-page';
import { themeOf, type Theme } from './token-data';

const layers = [
  { name: 'reset', holds: 'Browser defaults removed: box sizing, margins, media sizing, fonts of form controls.' },
  { name: 'tokens', holds: 'Every --ave-* custom property, per theme, density and motion mode.' },
  { name: 'base', holds: 'Canvas and text colours, the typography of plain HTML, the focus ring.' },
  { name: 'components', holds: 'Every kit component.' },
  { name: 'patterns', holds: 'Page patterns (Wave 6).' },
  { name: 'utilities', holds: 'Single-purpose classes, such as ave-tabular-nums.' },
  { name: 'app', holds: "The application's own styles." },
] as const;

/** Which typography role each plain element takes in the base layer. */
const elementRoles = [
  { selector: 'h1', role: 'font.heading-xl' },
  { selector: 'h2', role: 'font.heading-lg' },
  { selector: 'h3', role: 'font.heading-md' },
  { selector: 'h4', role: 'font.heading-sm' },
  { selector: 'p', role: 'font.body-md' },
  { selector: 'pre', role: 'font.code' },
] as const satisfies readonly { selector: string; role: TokenName }[];

const amounts = [
  { item: 'Toʻlov topshiriqnomasi № 18', amount: '1 204 500,00' },
  { item: 'Счёт-фактура № 7', amount: '87 111,10' },
  { item: 'Shartnoma № 3', amount: '9 990 000,05' },
] as const;

@Component({
  selector: 'ave-docs-global-styles',
  imports: [DocsPage, DocsScroll, DocsSection],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ave-docs-page heading="Global styles">
      <span lead
        >&#64;avelune/ui/styles.css: the layer order, a reset, the typography of plain HTML, the focus ring and a
        utility for figures. An application loads it once, through its bundler (ADR 0030).</span
      >
      <ave-docs-section
        heading="Layers"
        note="Declared once, lowest first; a later layer wins. Unlayered CSS beats every layer, so an application puts its own styles in app."
      >
        <ol class="layers">
          @for (layer of layers; track layer.name) {
            <li class="layer">
              <code class="layer-name">{{ layer.name }}</code>
              <span>{{ layer.holds }}</span>
            </li>
          }
        </ol>
      </ave-docs-section>
      <ave-docs-section
        heading="Plain HTML"
        note="Elements without a class take the typography roles: h1 heading-xl, h2 heading-lg, h3 heading-md, h4 to h6 heading-sm, body text body-md, pre code. Bold is semibold; inline code keeps the size of its text."
      >
        <div class="specimen" data-specimen>
          <h1 lang="uz-Latn">Hujjatlar roʻyxati</h1>
          <h2 lang="ru">Входящие документы</h2>
          <h3 lang="uz-Cyrl">Ҳужжат тафсилотлари</h3>
          <h4>Approval history</h4>
          <p>
            Document <strong>No. 1042</strong> was saved to the <a href="#global-styles-register">register</a>. Press
            <kbd>Ctrl</kbd> + <kbd>S</kbd> to save again; the file is <code>report-2026.pdf</code>.
            <small>Last change at 10:00.</small>
          </p>
          <pre>pnpm nx build ui</pre>
        </div>
      </ave-docs-section>
      <ave-docs-section
        heading="Focus ring"
        note="One rule, on :focus-visible: a 2px accent outline, 2px outside the element. Inside a container that clips, data-focus-ring='inset' draws it inside the element; on a range input with a drawn thumb, data-focus-ring='thumb' draws it around the thumb. In forced colours it takes the system highlight."
      >
        <div class="focus-row">
          <a id="global-styles-register" href="#global-styles-register">A link</a>
          <button type="button" class="sample-button">A native button</button>
          <input type="range" class="thumb-sample" data-focus-ring="thumb" aria-label="A range" value="40" />
        </div>
        <div class="clipped">
          <button type="button" class="row" data-focus-ring="inset">Kiruvchi hujjatlar</button>
          <button type="button" class="row" data-focus-ring="inset">Чиқувчи ҳужжатлар</button>
        </div>
      </ave-docs-section>
      <ave-docs-section
        heading="Figures"
        note="ave-tabular-nums gives every figure one width, so amounts line up in a column. Avelune Sans draws tabular figures already; the class keeps them tabular in the fallback font and states the intent."
      >
        <ave-docs-scroll label="Table of amounts">
          <table class="amounts ave-tabular-nums">
            <caption class="caption">
              Amounts in UZS
            </caption>
            <tbody>
              @for (row of amounts; track row.item) {
                <tr>
                  <th scope="row">{{ row.item }}</th>
                  <td class="amount">{{ row.amount }}</td>
                </tr>
              }
            </tbody>
          </table>
        </ave-docs-scroll>
      </ave-docs-section>
      <ave-docs-section
        heading="Theme island"
        note="data-theme on any element switches the theme inside it, and the base layer paints the island's own canvas and text."
      >
        <div class="island" data-island [attr.data-theme]="island()">
          <p>
            This block is in the {{ island() }} theme, with a <a href="#global-styles-register">link</a> and
            <strong>semibold</strong> text.
          </p>
        </div>
      </ave-docs-section>
    </ave-docs-page>
  `,
  styleUrl: './docs-global-styles.css',
})
class GlobalStyles {
  /** The theme of the island: the opposite of the page's. */
  readonly island = input.required<Theme>();
  protected readonly layers = layers;
  protected readonly amounts = amounts;
}

/** The colour a CSS colour value computes to inside `context`, read from a probe element. */
function computedColour(context: Element, value: string): string {
  const probe = document.createElement('span');
  probe.style.color = value;
  context.append(probe);
  const colour = getComputedStyle(probe).color;
  probe.remove();
  return colour;
}

function style(element: Element): CSSStyleDeclaration {
  return getComputedStyle(element);
}

const meta: Meta = { title: 'Foundations/Global styles' };
export default meta;

export const Base: StoryObj = {
  // The visual suite also renders it in forced colours, where the play function checks the ring's system colour.
  tags: ['forced-colors'],
  render: (_args, { globals }) => ({
    props: { island: themeOf(globals) === 'dark' ? 'light' : 'dark' },
    template: `<ave-docs-global-styles [island]="island" />`,
    moduleMetadata: { imports: [GlobalStyles] },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = document.documentElement;
    const forced = matchMedia('(forced-colors: active)').matches;
    const specimen = canvasElement.querySelector<HTMLElement>('[data-specimen]');
    if (specimen === null) throw new Error('The specimen is missing');

    // Forced colours replace every author colour with a system colour, so colours are compared only without them.
    await step('the page takes its canvas, text colour and font from the tokens', async () => {
      if (!forced) {
        await expect(style(root).backgroundColor).toBe(computedColour(root, 'var(--ave-color-bg-canvas)'));
        await expect(style(root).color).toBe(computedColour(root, 'var(--ave-color-fg-default)'));
      }
      await expect(style(document.body).fontFamily).toBe(style(root).fontFamily);
      await expect(style(document.body).margin).toBe('0px');
    });

    await step('plain elements take their typography roles', async () => {
      for (const { selector, role } of elementRoles) {
        const element = specimen.querySelector(selector);
        if (element === null) throw new Error(`No ${selector} in the specimen`);
        const { fontSize, lineHeight, fontWeight } = tokens[role].value;
        await expect(style(element).fontSize, selector).toBe(`${String(fontSize)}px`);
        await expect(style(element).lineHeight, selector).toBe(`${String(lineHeight)}px`);
        await expect(style(element).fontWeight, selector).toBe(String(fontWeight));
        await expect(style(element).marginBlockStart, selector).toBe('0px');
      }
      const paragraph = specimen.querySelector('p');
      const strong = specimen.querySelector('strong');
      const small = specimen.querySelector('small');
      const code = specimen.querySelector('code');
      if (paragraph === null || strong === null || small === null || code === null) throw new Error('Specimen text');
      await expect(style(strong).fontWeight).toBe(String(tokens['font.weight.semibold'].value));
      await expect(style(small).fontSize).toBe(`${String(tokens['font.body-sm'].value.fontSize)}px`);
      await expect(style(small).lineHeight).toBe(style(paragraph).lineHeight);
      await expect(style(code).fontFamily).toMatch(/^"?Avelune Mono"?,/);
      await expect(style(code).fontSize).toBe(style(paragraph).fontSize);
      if (!forced) {
        const link = within(paragraph).getByRole('link');
        await expect(style(link).color).toBe(computedColour(paragraph, 'var(--ave-color-fg-link)'));
      }
    });

    await step('the figures utility sets tabular figures', async () => {
      await expect(style(canvas.getByRole('table')).fontVariantNumeric).toBe('tabular-nums');
    });

    await step('a theme island paints its own canvas and text', async () => {
      if (forced) return;
      const island = canvasElement.querySelector('[data-island]');
      if (island === null) throw new Error('The island is missing');
      await expect(style(island).backgroundColor).toBe(computedColour(island, 'var(--ave-color-bg-canvas)'));
      await expect(style(island).color).toBe(computedColour(island, 'var(--ave-color-fg-default)'));
      await expect(style(island).color).not.toBe(style(root).color);
    });

    await step(
      'keyboard focus draws the ring, outside or inset, in the system highlight under forced colours',
      async () => {
        const ringColour = computedColour(root, forced ? 'Highlight' : 'var(--ave-color-border-focus)');
        const expectRing = async (element: Element, offset: string) => {
          await expect(element).toHaveFocus();
          await expect(element.matches(':focus-visible')).toBe(true);
          await expect(style(element).outlineStyle).toBe('solid');
          await expect(style(element).outlineWidth).toBe(tokens['focus-ring.width'].css);
          await expect(style(element).outlineColor).toBe(ringColour);
          await expect(style(element).outlineOffset).toBe(offset);
        };
        const offset = tokens['focus-ring.offset'].css;
        const inset = `-${tokens['focus-ring.width'].css}`;
        const nativeButton = canvas.getByRole('button', { name: 'A native button' });
        await userEvent.tab();
        await expectRing(within(specimen).getByRole('link'), offset);
        await userEvent.tab();
        await expectRing(canvas.getByRole('link', { name: 'A link' }), offset);
        await userEvent.tab();
        await expectRing(nativeButton, offset);
        // The range's ring is on its thumb, which computed styles cannot read; the input itself draws none.
        await userEvent.tab();
        const range = canvas.getByRole('slider', { name: 'A range' });
        await expect(range).toHaveFocus();
        await expect(range.matches(':focus-visible')).toBe(true);
        await expect(style(range).outlineStyle).toBe('none');
        await userEvent.tab();
        await expectRing(canvas.getByRole('button', { name: 'Kiruvchi hujjatlar' }), inset);
        // Back to the native button, whose ring the screenshot shows.
        await userEvent.tab({ shift: true });
        await userEvent.tab({ shift: true });
        await expectRing(nativeButton, offset);
      },
    );
  },
};
