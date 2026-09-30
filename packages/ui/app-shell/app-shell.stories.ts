import { Component, LOCALE_ID, computed, inject, input, signal, type OnInit } from '@angular/core';
import { Router, provideRouter, withHashLocation } from '@angular/router';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import {
  lucideBookOpen,
  lucideFileText,
  lucideHouse,
  lucideInbox,
  lucideMoon,
  lucideRows3,
  lucideSettings,
  lucideSun,
  lucideUsers,
} from '@avelune/icons/lucide';
import { AveBanner } from '@avelune/ui/alert';
import { AveAppShell, AveAppShellActions, AveAppShellBanner, type AveAppLogo } from '@avelune/ui/app-shell';
import { AveIconButton } from '@avelune/ui/button';
import { provideAveIcons } from '@avelune/ui/icon';
import type { AveSidebarEntry } from '@avelune/ui/sidebar-nav';
import { aveColorScheme } from '@avelune/ui/theme';
import { AveTooltip } from '@avelune/ui/tooltip';

type View = 'default' | 'plain' | 'long';

/** A tenant's logo: its mark in the brand's orange and a wordmark, dark on the light bar and light on the dark one. */
function logoSvg(word: string, line: string, variant: string): string {
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='112' height='32' viewBox='0 0 112 32' data-variant='${variant}'>` +
    `<rect width='32' height='32' rx='8' fill='#E95420'/>` +
    `<path d='M9 23 16 9l7 14' stroke='#FFFFFF' stroke-width='3' fill='none' stroke-linejoin='round'/>` +
    `<rect x='42' y='8' width='64' height='7' rx='3.5' fill='${word}'/>` +
    `<rect x='42' y='19' width='44' height='5' rx='2.5' fill='${line}'/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const logo: AveAppLogo = {
  src: logoSvg('#262626', '#737373', 'light'),
  darkSrc: logoSvg('#F5F5F5', '#A3A3A3', 'dark'),
  alt: 'Альфа Технологии',
};

const pages: readonly AveSidebarEntry[] = [
  { label: 'Главная', link: '/', icon: 'house', exact: true },
  { label: 'Входящие', link: '/inbox', icon: 'inbox', count: 3 },
  { label: 'Договоры', link: '/contracts', icon: 'file-text' },
  {
    label: 'Справочники',
    icon: 'book-open',
    items: [
      { label: 'Контрагенты', link: '/directories/counterparties' },
      { label: 'Подразделения', link: '/directories/departments' },
    ],
  },
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
  { label: 'Shartnomalar va qoʻshimcha kelishuvlar', link: '/contracts', icon: 'file-text' },
];

/** The frame the stories draw the shell in: a product's screen with a page in it. Styled with tokens only. */
@Component({
  selector: 'ave-app-shell-stories',
  imports: [AveAppShell, AveAppShellActions, AveAppShellBanner, AveBanner, AveIconButton, AveTooltip],
  providers: [
    provideAveIcons([
      lucideBookOpen,
      lucideFileText,
      lucideHouse,
      lucideInbox,
      lucideMoon,
      lucideRows3,
      lucideSettings,
      lucideSun,
      lucideUsers,
    ]),
  ],
  template: `
    @switch (view()) {
      @case ('plain') {
        <ave-app-shell product="Документооборот" [logo]="logo" lang="ru">
          <div aveAppShellActions>
            <button
              aveIconButton
              type="button"
              variant="ghost"
              icon="rows-3"
              label="Компактная плотность"
              aveTooltip="Компактная плотность"
              aveTooltipSide="bottom"
            ></button>
          </div>
          <h1>Согласование договора</h1>
          <p class="text">Экран без навигации: мастер или внешняя страница, где у продукта одна задача.</p>
        </ave-app-shell>
      }
      @case ('long') {
        <ave-app-shell
          product="Oʻzbekiston Respublikasi Davlat soliq qoʻmitasi hujjat aylanishi tizimi"
          navigationLabel="Boʻlimlar"
          [navigation]="long"
          lang="uz-Latn"
        >
          <ave-banner aveAppShellBanner variant="info">
            Tizim 2026-yil 31-dekabrgacha yangi versiyaga oʻtkaziladi, hujjatlaringiz saqlanib qoladi.
          </ave-banner>
          <h1>Shartnomalar va qoʻshimcha kelishuvlar</h1>
        </ave-app-shell>
      }
      @default {
        <ave-app-shell
          product="Документооборот"
          navigationLabel="Разделы"
          [logo]="logo"
          [navigation]="pages"
          [(navigationOpen)]="navigating"
          lang="ru"
        >
          <div aveAppShellActions role="group" aria-label="Вид">
            <button
              aveIconButton
              type="button"
              variant="ghost"
              [icon]="dark() ? 'sun' : 'moon'"
              [label]="dark() ? 'Светлая тема' : 'Тёмная тема'"
              [aveTooltip]="dark() ? 'Светлая тема' : 'Тёмная тема'"
              aveTooltipSide="bottom"
            ></button>
          </div>
          <ave-banner aveAppShellBanner variant="warning" dismissible>
            В субботу с 22:00 до 02:00 система будет недоступна: плановые работы.
          </ave-banner>
          <h1>Договоры</h1>
          <p class="text">Реестр договоров подразделения, их сроки и согласования.</p>
        </ave-app-shell>
      }
    }
  `,
  styleUrl: './app-shell.stories.css',
})
class AppShellStories implements OnInit {
  readonly view = input<View>('default');
  /** The page the story opens on. */
  readonly url = input('/contracts');
  protected readonly logo = logo;
  protected readonly pages = pages;
  protected readonly long = long;
  protected readonly navigating = signal(false);
  /** The theme the page shows, which the theme button would change in an application. */
  protected readonly dark = computed(() => this.scheme() === 'dark');
  private readonly scheme = aveColorScheme();
  private readonly router = inject(Router);

  ngOnInit(): void {
    void this.router.navigateByUrl(this.url());
  }
}

type Story = StoryObj<AppShellStories>;

function frame(view: View): NonNullable<Story['render']> {
  return () => ({
    props: { view },
    template: `<ave-app-shell-stories [view]="view" />`,
    moduleMetadata: { imports: [AppShellStories] },
  });
}

/** Whether the story's window is below breakpoint.md, where the navigation waits in its drawer. */
function narrow(canvasElement: HTMLElement): boolean {
  const button = within(canvasElement).queryByRole('button', { name: 'Разделы' });
  return button !== null && getComputedStyle(button).display !== 'none';
}

const meta: Meta<AppShellStories> = {
  title: 'Patterns/App shell',
  component: AveAppShell,
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

/**
 * A product's screen: the tenant's logo and the product's name, the view's switch, a maintenance banner, the
 * navigation as a column (or its button on a phone) and the page.
 */
export const Default: Story = {
  tags: ['forced-colors'],
  render: frame('default'),
  parameters: {
    docs: {
      source: {
        code: `<ave-app-shell
  product="Документооборот"
  navigationLabel="Разделы"
  [logo]="{ src: '/logo.svg', darkSrc: '/logo-dark.svg', alt: 'Альфа Технологии' }"
  [navigation]="pages"
>
  <div aveAppShellActions role="group" aria-label="Вид">
    <button aveIconButton type="button" variant="ghost" icon="moon" label="Тёмная тема" aveTooltip="Тёмная тема"></button>
  </div>
  <ave-banner aveAppShellBanner variant="warning" dismissible (dismiss)="maintenanceSeen.set(true)">
    В субботу с 22:00 до 02:00 система будет недоступна: плановые работы.
  </ave-banner>
  <router-outlet />
</ave-app-shell>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('banner')).toBeVisible();
    await expect(canvas.getByRole('main')).toBeVisible();
    await expect(canvas.getByRole('link', { name: 'Альфа Технологии Документооборот' })).toHaveAttribute('href', '#/');
    const image = canvas.getByRole('img', { name: 'Альфа Технологии' });
    const variant = document.documentElement.dataset['theme'] === 'dark' ? 'dark' : 'light';
    await expect(decodeURIComponent(image.getAttribute('src') ?? '')).toContain(`data-variant='${variant}'`);
    await expect(image.getBoundingClientRect().height).toBe(32);
    const bar = canvas.getByRole('banner');
    await expect(bar.getBoundingClientRect().height % 4).toBe(0);
    await expect(bar.scrollWidth).toBe(bar.clientWidth);
    if (narrow(canvasElement)) {
      await expect(canvas.queryByRole('navigation', { name: 'Разделы' })).toBeNull();
    } else {
      const nav = within(canvas.getByRole('navigation', { name: 'Разделы' }));
      await waitFor(() => expect(nav.getByRole('link', { name: 'Договоры' })).toHaveAttribute('aria-current', 'page'));
    }
  },
};

/** Below breakpoint.md the navigation opens in a drawer from the start; from it, the column shows it. */
export const Drawer: Story = {
  name: 'Navigation drawer',
  render: frame('default'),
  parameters: {
    docs: {
      source: {
        code: `<!-- Below breakpoint.md the bar's button opens the navigation in a drawer; following a link closes it. -->
<ave-app-shell product="Документооборот" navigationLabel="Разделы" [navigation]="pages" [(navigationOpen)]="navigating">
  <router-outlet />
</ave-app-shell>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    if (!narrow(canvasElement)) {
      await expect(canvas.getByRole('navigation', { name: 'Разделы' })).toBeVisible();
      return;
    }
    const button = canvas.getByRole('button', { name: 'Разделы' });
    await expect(button).toHaveAttribute('aria-haspopup', 'dialog');
    // From the keyboard, as a baseline should show it: a scripted click would draw the button's focus ring.
    button.focus();
    await userEvent.keyboard('{Enter}');
    const drawer = await within(document.body).findByRole('dialog', { name: 'Разделы' });
    const nav = within(within(drawer).getByRole('navigation', { name: 'Разделы' }));
    await waitFor(() => expect(nav.getByRole('link', { name: 'Договоры' })).toHaveAttribute('aria-current', 'page'));
    await waitFor(() => expect(drawer.getAnimations({ subtree: true })).toHaveLength(0));
  },
};

/** The first Tab shows the skip link over the bar's start; it moves focus past the bar and the navigation. */
export const SkipLink: Story = {
  name: 'Skip link',
  render: frame('default'),
  parameters: {
    docs: {
      source: {
        code: `<!-- The shell draws it: the first Tab stop of every screen, "Перейти к содержимому". -->
<ave-app-shell product="Документооборот" [navigation]="pages"><router-outlet /></ave-app-shell>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const skip = canvas.getByRole('link', { name: 'Перейти к содержимому' });
    await expect(getComputedStyle(skip.parentElement ?? skip).clipPath).toBe('inset(50%)');
    (document.activeElement as HTMLElement | null)?.blur();
    await userEvent.tab();
    await expect(skip).toHaveFocus();
    await expect(getComputedStyle(skip.parentElement ?? skip).clipPath).toBe('none');
    await userEvent.keyboard('{Enter}');
    await expect(canvas.getByRole('main')).toHaveFocus();
    await expect(window.location.hash).toBe('#/contracts');
    skip.focus();
  },
};

/** A screen without navigation: the bar with the logo, the name and an action, over the page. */
export const WithoutNavigation: Story = {
  name: 'Without navigation',
  render: frame('plain'),
  parameters: {
    docs: {
      source: {
        code: `<ave-app-shell product="Документооборот" [logo]="logo">
  <div aveAppShellActions>…</div>
  <router-outlet />
</ave-app-shell>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole('navigation')).toBeNull();
    await expect(canvas.queryByRole('button', { name: 'Navigation' })).toBeNull();
    await expect(canvas.getByRole('heading', { level: 1 })).toBeVisible();
  },
};

/** A long Uzbek name without a logo wraps in the bar; long pages wrap in the navigation; nothing scrolls sideways. */
export const LongText: Story = {
  name: 'Long text',
  render: frame('long'),
  parameters: {
    docs: {
      source: {
        code: `<ave-app-shell
  product="Oʻzbekiston Respublikasi Davlat soliq qoʻmitasi hujjat aylanishi tizimi"
  navigationLabel="Boʻlimlar"
  [navigation]="pages"
  lang="uz-Latn"
>
  <ave-banner aveAppShellBanner variant="info">…</ave-banner>
  <router-outlet />
</ave-app-shell>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const bar = canvas.getByRole('banner');
    await expect(bar.scrollWidth).toBe(bar.clientWidth);
    await expect(document.documentElement.scrollWidth).toBe(document.documentElement.clientWidth);
    const name = canvas.getByText('Oʻzbekiston Respublikasi Davlat soliq qoʻmitasi hujjat aylanishi tizimi');
    await expect(getComputedStyle(name).clipPath).toBe('none');
    await expect(name.getBoundingClientRect().height % 20).toBe(0);
    // On a phone the name wraps beside the navigation's button, never on a row of its own under it.
    const menu = within(bar).queryByRole('button', { name: 'Boʻlimlar' });
    if (menu !== null && getComputedStyle(menu).display !== 'none') {
      await expect(name.getBoundingClientRect().top).toBeLessThan(menu.getBoundingClientRect().bottom);
    }
  },
};
