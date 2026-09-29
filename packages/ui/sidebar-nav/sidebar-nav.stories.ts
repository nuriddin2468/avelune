import { Component, LOCALE_ID, inject, input, type OnInit } from '@angular/core';
import { Router, provideRouter, withHashLocation } from '@angular/router';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import {
  lucideBookOpen,
  lucideChartColumn,
  lucideFileText,
  lucideHouse,
  lucideInbox,
  lucideSettings,
  lucideUsers,
} from '@avelune/icons/lucide';
import { provideAveIcons } from '@avelune/ui/icon';
import { AveSidebarNav, type AveSidebarEntry } from '@avelune/ui/sidebar-nav';

type View = 'default' | 'long';

const pages: readonly AveSidebarEntry[] = [
  { label: 'Главная', link: '/', icon: 'house', exact: true },
  { label: 'Входящие', link: '/inbox', icon: 'inbox' },
  { label: 'Договоры', link: '/contracts', icon: 'file-text' },
  {
    label: 'Справочники',
    icon: 'book-open',
    items: [
      { label: 'Контрагенты', link: '/directories/counterparties' },
      { label: 'Подразделения', link: '/directories/departments' },
    ],
  },
  { label: 'Отчёты', link: '/reports', icon: 'chart-column' },
  {
    heading: 'Администрирование',
    items: [
      { label: 'Пользователи', link: '/users', icon: 'users' },
      { label: 'Настройки', link: '/settings', icon: 'settings' },
    ],
  },
];

const long: readonly AveSidebarEntry[] = [
  { label: 'Bosh sahifa', link: '/', icon: 'house', exact: true },
  { label: 'Kelib tushgan hujjatlar va murojaatlar', link: '/inbox', icon: 'inbox' },
  {
    label: 'Маълумотномалар',
    icon: 'book-open',
    items: [
      { label: 'Oʻzbekiston Respublikasi vazirliklari va idoralari', link: '/directories/ministries' },
      { label: 'Контрагенты и их банковские реквизиты', link: '/directories/counterparties' },
    ],
  },
  {
    heading: 'Maʼmuriyat va tizim sozlamalari',
    items: [{ label: 'Foydalanuvchilar', link: '/users', icon: 'users' }],
  },
];

/** The frame the stories draw the navigation in: an application's sidebar column. Styled with tokens only. */
@Component({
  selector: 'ave-sidebar-nav-stories',
  imports: [AveSidebarNav],
  providers: [
    provideAveIcons([
      lucideBookOpen,
      lucideChartColumn,
      lucideFileText,
      lucideHouse,
      lucideInbox,
      lucideSettings,
      lucideUsers,
    ]),
  ],
  template: `
    <div class="column">
      <p class="product">Avelune · Документооборот</p>
      @if (view() === 'long') {
        <ave-sidebar-nav label="Boʻlimlar" [items]="long" lang="uz-Latn" />
      } @else {
        <ave-sidebar-nav [label]="label()" [items]="pages" />
      }
    </div>
  `,
  styleUrl: './sidebar-nav.stories.css',
})
class SidebarNavStories implements OnInit {
  readonly view = input<View>('default');
  /** The page the story opens on. */
  readonly url = input('/');
  /** The landmark's name; each story's is its own, as the docs page shows them together. */
  readonly label = input('Разделы');
  protected readonly pages = pages;
  protected readonly long = long;
  private readonly router = inject(Router);

  ngOnInit(): void {
    void this.router.navigateByUrl(this.url());
  }
}

type Story = StoryObj<SidebarNavStories>;

function frame(view: View, url: string, label = 'Разделы'): NonNullable<Story['render']> {
  return () => ({
    props: { view, url, label },
    template: `<ave-sidebar-nav-stories [view]="view" [url]="url" [label]="label" />`,
    moduleMetadata: { imports: [SidebarNavStories] },
  });
}

function source(...lines: readonly string[]): NonNullable<Story['parameters']> {
  return { docs: { source: { code: lines.join('\n'), language: 'ts' } } };
}

const meta: Meta<SidebarNavStories> = {
  title: 'Components/Sidebar navigation',
  component: SidebarNavStories,
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

/** A product's pages, a group and a headed section; the contracts are current. */
export const Default: Story = {
  tags: ['forced-colors'],
  render: frame('default', '/contracts'),
  parameters: source(
    '<ave-sidebar-nav [label]="label()" [items]="pages" />',
    '',
    'pages: AveSidebarEntry[] = [',
    "  { label: 'Главная', link: '/', icon: 'house', exact: true },",
    "  { label: 'Договоры', link: '/contracts', icon: 'file-text' },",
    "  { label: 'Справочники', icon: 'book-open', items: [{ label: 'Контрагенты', link: '/directories/counterparties' }] },",
    "  { heading: 'Администрирование', items: [{ label: 'Настройки', link: '/settings', icon: 'settings' }] },",
    '];',
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const nav = within(canvas.getByRole('navigation', { name: 'Разделы' }));
    await waitFor(() => expect(nav.getByRole('link', { name: 'Договоры' })).toHaveAttribute('aria-current', 'page'));
    await expect(nav.getByRole('list', { name: 'Администрирование' })).toBeVisible();
    const group = nav.getByRole('button', { name: 'Справочники' });
    await expect(group).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(group);
    await expect(group).toHaveAttribute('aria-expanded', 'true');
    await expect(nav.getByRole('link', { name: 'Контрагенты' })).toBeVisible();
    await userEvent.keyboard('{Enter}');
    await expect(group).toHaveAttribute('aria-expanded', 'false');
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

/** A page inside a group: the group opens by itself; closed, it shows that it holds the current page. */
export const InGroup: Story = {
  name: 'In a group',
  render: frame('default', '/directories/departments', 'Разделы документооборота'),
  play: async ({ canvasElement }) => {
    const nav = within(within(canvasElement).getByRole('navigation'));
    // The navigation happens as the story opens: the group opens once it has.
    const page = await nav.findByRole('link', { name: 'Подразделения' });
    await waitFor(() => expect(page).toHaveAttribute('aria-current', 'page'));
    await expect(nav.getByRole('button', { name: 'Справочники' })).toHaveAttribute('aria-expanded', 'true');
  },
};

/** Long Uzbek and Russian names wrap in the column, in both scripts; nothing is cut or scrolls sideways. */
export const LongText: Story = {
  name: 'Long text',
  render: frame('long', '/directories/ministries'),
  play: async ({ canvasElement }) => {
    const nav = canvasElement.querySelector('nav');
    await expect(nav?.scrollWidth).toBe(nav?.clientWidth);
    const page = await within(canvasElement).findByRole('link', {
      name: 'Oʻzbekiston Respublikasi vazirliklari va idoralari',
    });
    await waitFor(() => expect(page).toHaveAttribute('aria-current', 'page'));
    await expect(page.getBoundingClientRect().height).toBeGreaterThan(36);
  },
};
