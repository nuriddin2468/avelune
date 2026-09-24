import { Component, input } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { expect, within } from 'storybook/test';
import { iconNames } from '@avelune/icons';
import { tokens } from '@avelune/tokens';
import { AveIcon, type AveIconSize } from '@avelune/ui/icon';

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

/** The frame the stories draw icons in; styled with tokens only. */
@Component({
  selector: 'ave-icon-stories',
  imports: [AveIcon],
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
      @case ('gallery') {
        <ul class="gallery">
          @for (name of names; track name) {
            <li class="cell">
              <ave-icon [name]="name" decorative size="md" />
              <code class="name">{{ name }}</code>
            </li>
          }
        </ul>
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
  readonly view = input<'sizes' | 'meaning' | 'colour' | 'gallery' | 'long'>('sizes');
  protected readonly sizes = sizes;
  protected readonly colours = colours;
  protected readonly names = iconNames;

  protected px(token: (typeof sizes)[number]['token']): string {
    return tokens[token].css;
  }
}

const meta: Meta<AveIcon> = {
  title: 'Components/Icon',
  component: AveIcon,
  args: { name: 'circle-alert', label: 'Error', size: 'sm' },
  argTypes: {
    name: { control: 'select', options: iconNames },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
  },
};
export default meta;

type Story = StoryObj<AveIcon>;

/** One icon, with controls. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('img', { name: 'Error' })).toBeVisible();
  },
};

function frame(view: 'sizes' | 'meaning' | 'colour' | 'gallery' | 'long'): NonNullable<Story['render']> {
  return () => ({
    props: { view },
    template: `<ave-icon-stories [view]="view" />`,
    moduleMetadata: { imports: [IconStories] },
  });
}

/** The three sizes, next to the text each belongs with. */
export const Sizes: Story = {
  render: frame('sizes'),
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
  play: async ({ canvasElement }) => {
    for (const row of canvasElement.querySelectorAll('.swatch')) {
      const svg = row.querySelector('svg');
      if (svg === null) throw new Error('No icon');
      await expect(getComputedStyle(svg).stroke, row.getAttribute('data-role') ?? '').toBe(getComputedStyle(row).color);
    }
  },
};

/** Every icon of the set, by name. */
export const Gallery: Story = {
  render: frame('gallery'),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll('ave-icon')).toHaveLength(iconNames.length);
    await expect(within(canvasElement).queryAllByRole('img')).toHaveLength(0);
  },
};

/** Long Russian and Uzbek text in a narrow column: icons keep their size and never push the line out. */
export const LongText: Story = {
  name: 'Long text',
  render: frame('long'),
  play: async ({ canvasElement }) => {
    const paragraph = canvasElement.querySelector('.narrow');
    if (paragraph === null) throw new Error('No paragraph');
    await expect(paragraph.scrollWidth).toBeLessThanOrEqual(paragraph.clientWidth);
    for (const icon of paragraph.querySelectorAll('ave-icon')) {
      await expect(icon.getBoundingClientRect().width).toBe(tokens['size.icon.sm'].value);
    }
  },
};
