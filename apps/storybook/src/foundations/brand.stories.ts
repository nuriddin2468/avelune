import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { expect, within } from 'storybook/test';
import {
  aveBrandPresetNames,
  generateAveBrand,
  type AveBrand,
  type AveBrandAdjustment,
  type AveBrandInput,
} from '@avelune/tokens/brand';
import { AveButton } from '@avelune/ui/button';
import { AveCheckbox, AveChoice } from '@avelune/ui/checkbox';
import { AveLink } from '@avelune/ui/link';
import { AveProgress } from '@avelune/ui/progress';
import { AveSwitch } from '@avelune/ui/switch';
import { DocsPage, DocsSection } from './docs-page';
import { themeOf, type Theme } from './token-data';

/** Colours that push the generator to its edges (ADR 0089): pale, vivid, near black and white, red and green. */
const stress: readonly { readonly name: string; readonly input: AveBrandInput }[] = [
  { name: 'Pale yellow', input: '#fff9c4' },
  { name: 'Cyan', input: '#00e5ff' },
  { name: 'Near black', input: '#0a0a0a' },
  { name: 'Near white', input: '#f7f7f7' },
  { name: 'Red', input: '#e00000' },
  { name: 'Green', input: '#00c853' },
];

interface Sample {
  readonly name: string;
  readonly brand: AveBrand;
}

/** What a sample's report says, in a line. */
function note(adjustments: readonly AveBrandAdjustment[]): string {
  const parts = adjustments.flatMap((adjustment): string[] => {
    switch (adjustment.kind) {
      case 'fill':
        return [`${adjustment.theme} fill ${String(adjustment.step)}`];
      case 'danger':
        return [`danger ${String(adjustment.fromHue)}° → ${String(adjustment.toHue)}°`];
      case 'near-status':
        return [`near ${adjustment.status} in ${adjustment.theme}`];
      case 'chroma':
        return [`${adjustment.family} ${String(adjustment.step)} less vivid`];
    }
  });
  return [...new Set(parts)].join(' · ') || 'exact';
}

/**
 * Every preset and six stress colours through the brand generator, each on an island of the page's theme with its own
 * colour tokens: the controls that carry the accent, the danger button beside them and the exact mark.
 */
@Component({
  selector: 'ave-docs-brand',
  imports: [AveButton, AveCheckbox, AveChoice, AveLink, AveProgress, AveSwitch, DocsPage, DocsSection],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ave-docs-page heading="Brand">
      <span lead
        >A product's or a tenant's brand colour, {{ theme() }} theme: the generator in @avelune/tokens/brand builds its
        accent and tinted neutrals on the kit's ladder, checks every declared pair, and says what it adapted (ADR 0089).
        The mark is the exact colour, for logos only.</span
      >
      @for (group of groups(); track group.heading) {
        <ave-docs-section [heading]="group.heading" [note]="group.note">
          <ul class="samples">
            @for (sample of group.samples; track sample.name) {
              <li
                class="sample"
                [attr.data-theme]="theme()"
                [attr.data-brand]="sample.brand.input"
                [style]="vars(sample)"
              >
                <div class="head">
                  <span class="mark" aria-hidden="true" [style.background-color]="sample.brand.mark"></span>
                  <span class="name">{{ sample.name }}</span>
                  <code class="value">{{ sample.brand.mark }}</code>
                </div>
                <div class="controls">
                  <button aveButton variant="primary" type="button">Сохранить</button>
                  <button aveButton variant="danger" type="button">Удалить</button>
                </div>
                <div class="controls">
                  <label aveChoice><input type="checkbox" aveCheckbox checked /> Выбрано</label>
                  <label aveChoice><input type="checkbox" aveSwitch checked /> Включено</label>
                  <a aveLink href="#brand">Регламент</a>
                </div>
                <progress aveProgress [value]="0.6" [attr.aria-label]="'Загрузка, ' + sample.name"></progress>
                <span class="note">{{ describe(sample) }}</span>
              </li>
            }
          </ul>
        </ave-docs-section>
      }
    </ave-docs-page>
  `,
  styleUrl: './docs-brand.css',
})
class BrandPage {
  /** The theme the page shows. */
  readonly theme = input<Theme>('light');

  protected readonly groups = computed(() => [
    {
      heading: 'Presets',
      note: 'The named colours a settings screen offers. Orange is the kit’s own and gives back tokens.css exactly.',
      samples: aveBrandPresetNames.map((name): Sample => ({ name, brand: generateAveBrand(name) })),
    },
    {
      heading: 'Stress colours',
      note: 'An own colour at the edges: the fill moves to the nearest step its text can use, steps lose chroma until their pairs pass, and danger moves away from a red.',
      samples: stress.map((colour): Sample => ({ name: colour.name, brand: generateAveBrand(colour.input) })),
    },
  ]);

  /** The sample's colour tokens for the page's theme, as its island's custom properties. */
  protected vars(sample: Sample): Record<string, string> {
    return Object.fromEntries(
      Object.entries(sample.brand[this.theme()]).map(([name, value]) => [`--ave-${name.replaceAll('.', '-')}`, value]),
    );
  }

  protected describe(sample: Sample): string {
    return note(sample.brand.report.adjustments.filter((a) => a.kind !== 'fill' || a.theme === this.theme()));
  }
}

const meta: Meta = { title: 'Foundations/Brand' };
export default meta;

export const Brands: StoryObj = {
  render: (_args, { globals }) => ({
    props: { theme: themeOf(globals) },
    template: `<ave-docs-brand [theme]="theme" />`,
    moduleMetadata: { imports: [BrandPage] },
  }),
  play: async ({ canvasElement, globals }) => {
    const theme = themeOf(globals);
    const samples = [...canvasElement.querySelectorAll<HTMLElement>('[data-brand]')];
    await expect(samples).toHaveLength(aveBrandPresetNames.length + stress.length);
    const colour = (value: string) => {
      const probe = document.createElement('span');
      probe.style.color = value;
      document.body.append(probe);
      const computed = getComputedStyle(probe).color;
      probe.remove();
      return computed;
    };
    for (const sample of samples) {
      const brand = generateAveBrand(sample.dataset['brand'] as AveBrandInput);
      const [primary, danger] = within(sample).getAllByRole('button');
      // Each island paints its own brand's accent and danger, not the page's.
      await expect(getComputedStyle(primary as Element).backgroundColor).toBe(
        colour(brand[theme]['color.accent.bg'] ?? ''),
      );
      await expect(getComputedStyle(danger as Element).backgroundColor).toBe(
        colour(brand[theme]['color.danger.bg'] ?? ''),
      );
    }
  },
};
