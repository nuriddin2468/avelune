import { Component, LOCALE_ID, input } from '@angular/core';
import { provideRouter, withHashLocation } from '@angular/router';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, within } from 'storybook/test';
import { AveBreadcrumbs, type AveBreadcrumb } from '@avelune/ui/breadcrumbs';

type View = 'default' | 'deep' | 'long';

const contract: readonly AveBreadcrumb[] = [
  { label: 'Главная', link: '/' },
  { label: 'Договоры', link: '/contracts' },
];

const deep: readonly AveBreadcrumb[] = [
  { label: 'Главная', link: '/' },
  { label: 'Справочники', link: '/directories' },
  { label: 'Контрагенты', link: '/directories/counterparties' },
  { label: 'ООО «Альфа Технологии»', link: '/directories/counterparties/1' },
];

const long: readonly AveBreadcrumb[] = [
  { label: 'Oʻzbekiston Respublikasi Vazirlar Mahkamasi', link: '/' },
  { label: 'Hujjatlarni roʻyxatdan oʻtkazish boʻlimi', link: '/registry' },
  { label: 'Входящая корреспонденция министерств и ведомств', link: '/registry/incoming' },
];

/** The frame the stories draw trails in: the top of a page, over its heading. Styled with tokens only. */
@Component({
  selector: 'ave-breadcrumbs-stories',
  imports: [AveBreadcrumbs],
  template: `
    @switch (view()) {
      @case ('deep') {
        <header class="page">
          <ave-breadcrumbs [items]="deep" current="Банковские реквизиты" />
          <h1 class="title">Банковские реквизиты</h1>
        </header>
      }
      @case ('long') {
        <header class="page">
          <ave-breadcrumbs
            [items]="long"
            current="Toshkent shahar hokimligining 2026-yil 18-martdagi 214-sonli qarori"
          />
        </header>
      }
      @default {
        <header class="page">
          <ave-breadcrumbs [items]="contract" current="ДК-2026/114" />
          <h1 class="title">Договор ДК-2026/114</h1>
        </header>
      }
    }
  `,
  styleUrl: './breadcrumbs.stories.css',
})
class BreadcrumbsStories {
  readonly view = input<View>('default');
  protected readonly contract = contract;
  protected readonly deep = deep;
  protected readonly long = long;
}

type Story = StoryObj<BreadcrumbsStories>;

function frame(view: View): NonNullable<Story['render']> {
  return () => ({
    props: { view },
    template: `<ave-breadcrumbs-stories [view]="view" />`,
    moduleMetadata: { imports: [BreadcrumbsStories] },
  });
}

function source(...lines: readonly string[]): NonNullable<Story['parameters']> {
  return { docs: { source: { code: lines.join('\n'), language: 'html' } } };
}

const meta: Meta<BreadcrumbsStories> = {
  title: 'Components/Breadcrumbs',
  component: BreadcrumbsStories,
  decorators: [
    applicationConfig({
      // Hash locations keep a followed link inside Storybook's frame.
      providers: [
        { provide: LOCALE_ID, useValue: 'ru' },
        provideRouter([{ path: '**', children: [] }], withHashLocation()),
      ],
    }),
  ],
};
export default meta;

/** A contract's page under the register: a link to each page above it, the current page last as text. */
export const Default: Story = {
  tags: ['forced-colors'],
  render: frame('default'),
  parameters: source(
    '<ave-breadcrumbs',
    "  [items]=\"[{ label: 'Главная', link: '/' }, { label: 'Договоры', link: '/contracts' }]\"",
    '  current="ДК-2026/114"',
    '/>',
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const nav = canvas.getByRole('navigation', { name: 'Навигационная цепочка' });
    const trail = within(nav);
    await expect(trail.getAllByRole('listitem')).toHaveLength(3);
    await expect(trail.getAllByRole('link').map((link) => link.textContent.trim())).toEqual(['Главная', 'Договоры']);
    await expect(trail.getByText('ДК-2026/114')).toHaveAttribute('aria-current', 'page');
    await userEvent.tab();
    await expect(trail.getByRole('link', { name: 'Главная' })).toHaveFocus();
    await userEvent.tab();
    await expect(trail.getByRole('link', { name: 'Договоры' })).toHaveFocus();
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

/** Four levels above the page: the trail is as long as the path, and wraps between its items on a phone. */
export const Deep: Story = {
  render: frame('deep'),
  play: async ({ canvasElement }) => {
    const trail = within(within(canvasElement).getByRole('navigation'));
    await expect(trail.getAllByRole('link')).toHaveLength(4);
    await expect(trail.getByText('Банковские реквизиты')).toHaveAttribute('aria-current', 'page');
  },
};

/** Long Uzbek and Russian names wrap between items and inside a name; nothing is cut or scrolls sideways. */
export const LongText: Story = {
  name: 'Long text',
  render: frame('long'),
  play: async ({ canvasElement }) => {
    const trail = canvasElement.querySelector('ol');
    await expect(trail?.scrollWidth).toBe(trail?.clientWidth);
    // Every item starts a whole number of 24px lines under the trail's top.
    const top = trail?.getBoundingClientRect().top ?? 0;
    for (const item of canvasElement.querySelectorAll('li')) {
      await expect((item.getBoundingClientRect().top - top) % 24).toBe(0);
    }
  },
};
