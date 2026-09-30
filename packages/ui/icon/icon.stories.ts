import { Component, computed, input, signal } from '@angular/core';
import {
  applicationConfig,
  componentWrapperDecorator,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular-vite';
import { expect, userEvent, within } from 'storybook/test';
import {
  lucideCalendar,
  lucideCircleAlert,
  lucideCircleCheck,
  lucideDownload,
  lucideExternalLink,
  lucideFileText,
  lucidePaperclip,
} from '@avelune/icons/lucide';
import { lucideIcons } from '@avelune/icons/lucide/all';
import { tokens } from '@avelune/tokens';
import { AveIcon, defineAveIcon, provideAveIcons, type AveIconSize } from '@avelune/ui/icon';
import lucideTags from 'lucide-static/tags.json';

declare module '@avelune/icons' {
  interface IconNames {
    'story-certificate': true;
    'story-verified': true;
    'story-signature': true;
  }
}

const sizes = [
  { size: 'sm', token: 'size.icon.sm', text: 'body', note: 'body text, controls' },
  { size: 'md', token: 'size.icon.md', text: 'large', note: 'large text, spacious controls' },
  { size: 'lg', token: 'size.icon.lg', text: 'heading', note: 'headings, empty states' },
] as const satisfies readonly { size: AveIconSize; token: string; text: string; note: string }[];

const colours = [
  { role: 'fg-default', label: 'Default text' },
  { role: 'fg-muted', label: 'Muted text' },
  { role: 'accent', label: 'Accent' },
  { role: 'danger', label: 'Danger' },
  { role: 'success', label: 'Success' },
  { role: 'on-accent', label: 'On the accent fill' },
] as const;

/** A certificate drawn on Lucide's grid and exported from a design tool in its own black. */
const certificateSvg = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M13 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3" stroke="#1E1E1E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M13 3v4a1 1 0 0 0 1 1h4v2" stroke="#1E1E1E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="16" cy="15" r="3" stroke="#1E1E1E" stroke-width="2"/>
  <path d="m14.5 17.6-.5 4.4 2-1 2 1-.5-4.4" stroke="#1E1E1E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

/** A two-colour badge that keeps its own colours (here the light theme's accent), whatever the theme. */
const verifiedSvg = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <rect x="2" y="2" width="20" height="20" rx="6" fill="${tokens['color.accent.bg'].value}"/>
  <path d="m7.5 12 3 3 6-6" fill="none" stroke="${tokens['color.fg.on-accent'].value}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

/** A fine-line signature, drawn at 1 unit on purpose. */
const signatureSvg = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#000" stroke-width="1" stroke-linecap="round">
  <path d="M3 16c2-6 4-9 5-8s-2 9 0 9 3-6 4-6 0 5 2 5 3-3 4-3"/>
  <path d="M3 20h18"/>
</svg>`;

const certificate = defineAveIcon('story-certificate', certificateSvg);
const verified = defineAveIcon('story-verified', verifiedSvg, { colors: 'original' });
const signature = defineAveIcon('story-signature', signatureSvg, { strokes: 'original' });

/** The frame the stories draw icons in; it registers the icons it draws. Styled with tokens only. */
@Component({
  selector: 'ave-icon-stories',
  imports: [AveIcon],
  providers: [
    provideAveIcons([
      lucideCalendar,
      lucideCircleAlert,
      lucideCircleCheck,
      lucideDownload,
      lucideExternalLink,
      lucideFileText,
      lucidePaperclip,
      certificate,
      verified,
      signature,
    ]),
  ],
  template: `
    @switch (view()) {
      @case ('sizes') {
        <ul class="list">
          @for (row of sizes; track row.size) {
            <li class="row" [attr.data-text]="row.text">
              <ave-icon name="calendar" decorative [size]="row.size" />
              <span>Muddati · Срок — {{ row.size }}, {{ px(row.token) }}: {{ row.note }}</span>
            </li>
          }
        </ul>
      }
      @case ('meaning') {
        <ul class="list">
          <li class="row">
            <ave-icon name="circle-alert" label="Xato" />
            <span>Hujjat saqlanmadi: fayl hajmi 20 MB dan oshmasligi kerak.</span>
          </li>
          <li class="row">
            <ave-icon name="download" decorative />
            <span>Скачать отчёт</span>
          </li>
        </ul>
      }
      @case ('colour') {
        <ul class="list">
          @for (colour of colours; track colour.role) {
            <li class="row swatch" [attr.data-role]="colour.role">
              <ave-icon name="circle-check" decorative />
              <span>{{ colour.label }}</span>
            </li>
          }
        </ul>
      }
      @case ('custom') {
        <table class="custom">
          <caption>
            Your own icons next to Lucide's, in each size
          </caption>
          <thead>
            <tr>
              <th scope="col">Icon</th>
              @for (row of sizes; track row.size) {
                <th scope="col">{{ row.size }}</th>
              }
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Lucide <code>file-text</code></th>
              @for (row of sizes; track row.size) {
                <td><ave-icon name="file-text" decorative [size]="row.size" /></td>
              }
            </tr>
            <tr>
              <th scope="row">Certificate, fitted: text colour, kit strokes</th>
              @for (row of sizes; track row.size) {
                <td><ave-icon name="story-certificate" label="Certificate" [size]="row.size" /></td>
              }
            </tr>
            <tr>
              <th scope="row">Verified, <code>colors: 'original'</code></th>
              @for (row of sizes; track row.size) {
                <td><ave-icon name="story-verified" label="Verified" [size]="row.size" /></td>
              }
            </tr>
            <tr>
              <th scope="row">Signature, <code>strokes: 'original'</code></th>
              @for (row of sizes; track row.size) {
                <td><ave-icon name="story-signature" label="Signature" [size]="row.size" /></td>
              }
            </tr>
          </tbody>
        </table>
      }
      @default {
        <p class="narrow" lang="ru">
          <ave-icon name="paperclip" decorative />
          Приложение к распоряжению о переводе сотрудников в отдел документационного обеспечения управления
          <ave-icon name="external-link" label="Открыть в новой вкладке" /> и
          <span lang="uz-Latn">Oʻzbekiston Respublikasi Vazirlar Mahkamasining qarorlari roʻyxati</span>
          <ave-icon name="file-text" decorative />
        </p>
      }
    }
  `,
  styleUrl: './icon.stories.css',
})
class IconStories {
  readonly view = input<'sizes' | 'meaning' | 'colour' | 'custom' | 'long'>('sizes');
  protected readonly sizes = sizes;
  protected readonly colours = colours;

  protected px(token: (typeof sizes)[number]['token']): string {
    return tokens[token].css;
  }
}

const tagsOf: Readonly<Record<string, readonly string[] | undefined>> = lucideTags;

/** How many icons the gallery shows before "Show all", so the page stays light. */
const galleryPage = 60;

/** Every Lucide icon, searchable by name and by Lucide's tags. Registers the whole set. */
@Component({
  selector: 'ave-icon-gallery',
  imports: [AveIcon],
  providers: [provideAveIcons(lucideIcons)],
  template: `
    <div class="search">
      <label class="field">
        <span class="field-label">Search {{ icons.length }} icons by name or tag</span>
        <input #search class="input" type="search" [value]="query()" (input)="query.set(search.value)" />
      </label>
      <p class="count" aria-live="polite">
        @if (matches().length === 0) {
          No icon matches “{{ query() }}”.
        } @else {
          {{ shown().length }} of {{ matches().length }}
        }
      </p>
    </div>
    <ul class="gallery">
      @for (icon of shown(); track icon.name) {
        <li class="cell">
          <ave-icon [name]="icon.name" decorative size="md" />
          <code class="name">{{ icon.name }}</code>
        </li>
      }
    </ul>
    @if (shown().length < matches().length) {
      <button class="more" type="button" (click)="limit.set(matches().length)">Show all {{ matches().length }}</button>
    }
  `,
  styleUrl: './icon.stories.css',
})
class IconGallery {
  protected readonly icons = lucideIcons;
  protected readonly query = signal('');
  protected readonly limit = signal(galleryPage);
  protected readonly matches = computed(() => {
    const query = this.query().trim().toLowerCase();
    if (query === '') return this.icons;
    return this.icons.filter(
      ({ name }) => name.includes(query) || (tagsOf[name] ?? []).some((tag) => tag.includes(query)),
    );
  });
  protected readonly shown = computed(() => this.matches().slice(0, this.limit()));
}

/** Pads the Default story as the frame above pads the others; styled with tokens only. */
@Component({
  selector: 'ave-icon-story-frame',
  template: '<ng-content />',
  styleUrl: './icon.stories.css',
})
class IconStoryFrame {}

/** `arrow-down` → `lucideArrowDown`: the export an application imports from `@avelune/icons/lucide`. */
const lucideExport = (name: string) =>
  `lucide${name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')}`;

/**
 * The Default snippet, from the story's current args: a whole component that registers the icon it draws. Storybook's
 * own snippet leaves the provider out, and a copy of it would throw.
 */
function registeredComponent(_code: string, { args }: { readonly args: Readonly<Record<string, unknown>> }): string {
  const name = typeof args['name'] === 'string' ? args['name'] : 'circle-alert';
  const label = typeof args['label'] === 'string' ? args['label'].trim() : '';
  const size = typeof args['size'] === 'string' ? args['size'] : 'sm';
  const meaning = args['decorative'] === true || label === '' ? 'decorative' : `label="${label}"`;
  const attributes = [`name="${name}"`, meaning, ...(size === 'sm' ? [] : [`size="${size}"`])].join(' ');
  return [
    "import { Component } from '@angular/core';",
    `import { ${lucideExport(name)} } from '@avelune/icons/lucide';`,
    "import { AveIcon, provideAveIcons } from '@avelune/ui/icon';",
    '',
    '@Component({',
    "  selector: 'app-demo',",
    '  imports: [AveIcon],',
    '  // Registers the icon this component draws; icons used across the app go in app.config.ts.',
    `  providers: [provideAveIcons([${lucideExport(name)}])],`,
    `  template: \`<ave-icon ${attributes} />\`,`,
    '})',
    'export class DemoComponent {}',
  ].join('\n');
}

const meta: Meta<AveIcon> = {
  title: 'Components/Icon',
  component: AveIcon,
  args: { name: 'circle-alert', label: 'Error', size: 'sm' },
  argTypes: {
    name: { control: 'select', options: lucideIcons.map((icon) => icon.name) },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
  },
};
export default meta;

type Story = StoryObj<AveIcon>;

/** One icon, with controls; every Lucide icon is registered, so any name works. */
export const Default: Story = {
  parameters: { docs: { source: { transform: registeredComponent, language: 'typescript' } } },
  decorators: [
    applicationConfig({ providers: [provideAveIcons(lucideIcons)] }),
    moduleMetadata({ imports: [IconStoryFrame] }),
    componentWrapperDecorator(IconStoryFrame),
  ],
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('img', { name: 'Error' })).toBeVisible();
  },
};

function frame(view: 'sizes' | 'meaning' | 'colour' | 'custom' | 'long'): NonNullable<Story['render']> {
  return () => ({
    props: { view },
    template: `<ave-icon-stories [view]="view" />`,
    moduleMetadata: { imports: [IconStories] },
  });
}

/** The three sizes, next to the text each belongs with. */
export const Sizes: Story = {
  render: frame('sizes'),
  parameters: {
    docs: {
      source: {
        code: `<!-- Registered with provideAveIcons([lucideCalendar]), see "Registering icons". -->
<ave-icon name="calendar" decorative />
<ave-icon name="calendar" decorative size="md" />
<ave-icon name="calendar" decorative size="lg" />`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const icons = [...canvasElement.querySelectorAll('ave-icon')];
    for (const [index, icon] of icons.entries()) {
      const row = sizes[index];
      if (row === undefined) throw new Error('One icon per size');
      const box = icon.getBoundingClientRect();
      await expect([box.width, box.height], row.size).toEqual([tokens[row.token].value, tokens[row.token].value]);
    }
  },
};

/** An icon that carries meaning has a label; one that repeats its text is decorative. */
export const Meaning: Story = {
  render: frame('meaning'),
  parameters: {
    docs: {
      source: {
        code: `<!-- Registered with provideAveIcons([lucideCircleAlert, lucideDownload]), see "Registering icons". -->
<!-- The icon says what the text does not: it has a label. -->
<ave-icon name="circle-alert" label="Xato" />
Hujjat saqlanmadi: fayl hajmi 20 MB dan oshmasligi kerak.

<!-- The text says it: the icon is decorative. -->
<ave-icon name="download" decorative />
Скачать отчёт`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole('img')).toHaveLength(1);
    await expect(canvas.getByRole('img', { name: 'Xato' })).toBeVisible();
  },
};

/** An icon takes the colour of its text, in every role and in forced colours. */
export const Colour: Story = {
  tags: ['forced-colors'],
  render: frame('colour'),
  parameters: {
    docs: {
      source: {
        code: `<!-- Registered with provideAveIcons([lucideCircleCheck]), see "Registering icons". -->
<!-- The icon draws in its text colour: colour the text, never the icon. -->
<span class="status-danger">
  <ave-icon name="circle-check" decorative />
  Danger
</span>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    for (const row of canvasElement.querySelectorAll('.swatch')) {
      const svg = row.querySelector('svg');
      if (svg === null) throw new Error('No icon');
      await expect(getComputedStyle(svg).stroke, row.getAttribute('data-role') ?? '').toBe(getComputedStyle(row).color);
    }
  },
};

/**
 * An application's own icons: fitted to the kit by default (text colour, kit strokes), or keeping their colours or
 * strokes when they ask to.
 */
export const Custom: Story = {
  name: 'Your own icons',
  render: frame('custom'),
  parameters: {
    docs: {
      source: {
        language: 'typescript',
        code: `import { defineAveIcon, provideAveIcons } from '@avelune/ui/icon';
import certificateSvg from './icons/certificate.svg';
import signatureSvg from './icons/signature.svg';
import verifiedSvg from './icons/verified.svg';

// Declare the names, so templates accept them.
declare module '@avelune/icons' {
  interface IconNames {
    certificate: true;
    signature: true;
    verified: true;
  }
}

export const certificate = defineAveIcon('certificate', certificateSvg);
export const verified = defineAveIcon('verified', verifiedSvg, { colors: 'original' });
export const signature = defineAveIcon('signature', signatureSvg, { strokes: 'original' });

// app.config.ts, or the providers of the route or component that draws them
providers: [provideAveIcons([certificate, verified, signature])];

// In a template: <ave-icon name="certificate" label="Certificate" />`,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const [fitted] = canvas.getAllByRole('img', { name: 'Certificate' });
    const fittedPath = fitted?.querySelector('path');
    if (fitted === undefined || fittedPath === null || fittedPath === undefined) throw new Error('No certificate');
    // Fitted: the design tool's black became the text colour, and the strokes the kit's.
    await expect(getComputedStyle(fittedPath).stroke).toBe(getComputedStyle(fitted).color);
    await expect(fitted.querySelector('svg')?.getAttribute('stroke-width')).toBe('2.25');
    const [badge] = canvas.getAllByRole('img', { name: 'Verified' });
    await expect(badge?.querySelector('rect')?.getAttribute('fill')).toBe(tokens['color.accent.bg'].value);
    const [line] = canvas.getAllByRole('img', { name: 'Signature' });
    await expect(line?.querySelector('svg')?.getAttribute('stroke-width')).toBe('1');
  },
};

/** Every Lucide icon, searchable by name and tag; the first 60 until "Show all". */
export const Gallery: Story = {
  render: () => ({ template: `<ave-icon-gallery />`, moduleMetadata: { imports: [IconGallery] } }),
  parameters: {
    docs: {
      source: {
        code: `<!-- Registered with provideAveIcons([lucideArrowDown]), see "Registering icons". -->
<ave-icon name="arrow-down" decorative size="md" />`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvasElement.querySelectorAll('ave-icon')).toHaveLength(galleryPage);
    await expect(canvas.queryAllByRole('img')).toHaveLength(0);
    const search = canvas.getByRole('searchbox', { name: /Search \d+ icons by name or tag/ });
    // "birthday" is a tag of calendar icons, not a name.
    await userEvent.type(search, 'birthday');
    await expect(canvasElement.querySelector('ave-icon[data-icon="calendar"]')).not.toBeNull();
    await userEvent.clear(search);
    await userEvent.type(search, 'no-such-icon');
    await expect(canvas.getByText('No icon matches “no-such-icon”.')).toBeVisible();
    // Cleared, the gallery is back to its first page; the visual baseline is taken in this state.
    await userEvent.clear(search);
    await expect(canvas.getByRole('button', { name: `Show all ${String(lucideIcons.length)}` })).toBeVisible();
    await expect(canvasElement.querySelectorAll('ave-icon')).toHaveLength(galleryPage);
    search.blur();
  },
};

/** Long Russian and Uzbek text in a narrow column: icons keep their size and never push the line out. */
export const LongText: Story = {
  name: 'Long text',
  render: frame('long'),
  parameters: {
    docs: {
      source: {
        code: `<!-- Registered with provideAveIcons([lucidePaperclip, lucideExternalLink]), see "Registering icons". -->
<p>
  <ave-icon name="paperclip" decorative />
  Приложение к распоряжению о переводе сотрудников в отдел документационного обеспечения управления
  <ave-icon name="external-link" label="Открыть в новой вкладке" />
</p>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const paragraph = canvasElement.querySelector('.narrow');
    if (paragraph === null) throw new Error('No paragraph');
    await expect(paragraph.scrollWidth).toBeLessThanOrEqual(paragraph.clientWidth);
    for (const icon of paragraph.querySelectorAll('ave-icon')) {
      await expect(icon.getBoundingClientRect().width).toBe(tokens['size.icon.sm'].value);
    }
  },
};
