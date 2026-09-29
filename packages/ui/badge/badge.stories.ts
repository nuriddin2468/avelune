import { Component, LOCALE_ID, input } from '@angular/core';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, within } from 'storybook/test';
import { AveBadge, AveCount, type AveBadgeVariant } from '@avelune/ui/badge';

type View = 'default' | 'places' | 'long' | 'counts';

const statuses = [
  { variant: 'neutral', text: 'Черновик' },
  { variant: 'info', text: 'На согласовании' },
  { variant: 'success', text: 'Подписан' },
  { variant: 'warning', text: 'Истекает' },
  { variant: 'danger', text: 'Истёк' },
] as const satisfies readonly { variant: AveBadgeVariant; text: string }[];

/** The frame the stories draw badges and counts in. Styled with tokens only. */
@Component({
  selector: 'ave-badge-stories',
  imports: [AveBadge, AveCount],
  template: `
    @switch (view()) {
      @case ('places') {
        <ul class="rows" aria-label="Договоры" lang="ru">
          <li class="row">
            <span class="record">
              <span class="number">ДК-2025/114</span>
              <span>Поставка офисной мебели</span>
            </span>
            <ave-badge variant="success">Подписан</ave-badge>
          </li>
          <li class="row">
            <span class="record">
              <span class="number">ДК-2025/113</span>
              <span>Обслуживание серверного оборудования</span>
            </span>
            <ave-badge variant="info">На согласовании</ave-badge>
          </li>
        </ul>
        <h3 class="heading" lang="ru">Договор ДК-2025/109 <ave-badge variant="danger">Истёк</ave-badge></h3>
        <p lang="ru">
          Статус <ave-badge variant="warning">Истекает</ave-badge> ставится за 30 дней до окончания договора.
        </p>
      }
      @case ('long') {
        <div class="narrow">
          <ave-badge variant="info" lang="uz-Latn">Oʻzbekiston Respublikasi Moliya vazirligida kelishilmoqda</ave-badge>
          <ave-badge variant="warning" lang="ru">Ожидает подписи генерального директора</ave-badge>
          <ave-badge lang="uz-Cyrl">Қоралама</ave-badge>
          <ave-badge variant="success" />
        </div>
      }
      @case ('counts') {
        <ul class="places" aria-label="Разделы" lang="ru">
          <li>
            <a class="place" href="#inbox">Входящие <ave-count value="3" /></a>
          </li>
          <li>
            <a class="place" href="#approval">На согласовании <ave-count value="12" /></a>
          </li>
          <li>
            <a class="place" href="#all">Все документы <ave-count value="1284" /></a>
          </li>
          <li>
            <a class="place" href="#archive">Архив <ave-count value="1284" max="9999" /></a>
          </li>
          <li>
            <a class="place" href="#drafts">Черновики <ave-count value="0" /></a>
          </li>
        </ul>
      }
      @default {
        <div class="badges" lang="ru">
          @for (status of statuses; track status.variant) {
            <ave-badge [variant]="status.variant">{{ status.text }}</ave-badge>
          }
        </div>
      }
    }
  `,
  styleUrl: './badge.stories.css',
})
class BadgeStories {
  readonly view = input<View>('default');
  protected readonly statuses = statuses;
}

type Story = StoryObj<BadgeStories>;

function frame(view: View): NonNullable<Story['render']> {
  return () => ({
    props: { view },
    template: `<ave-badge-stories [view]="view" />`,
    moduleMetadata: { imports: [BadgeStories] },
  });
}

function source(...lines: readonly string[]): NonNullable<Story['parameters']> {
  return { docs: { source: { code: lines.join('\n'), language: 'html' } } };
}

const meta: Meta<BadgeStories> = {
  title: 'Components/Badge',
  component: BadgeStories,
  decorators: [applicationConfig({ providers: [{ provide: LOCALE_ID, useValue: 'ru' }] })],
};
export default meta;

/** The five variants, each a status of a contract in words on its tinted fill. */
export const Default: Story = {
  tags: ['forced-colors'],
  render: frame('default'),
  parameters: source(
    '<ave-badge>Черновик</ave-badge>',
    '<ave-badge variant="info">На согласовании</ave-badge>',
    '<ave-badge variant="success">Подписан</ave-badge>',
    '<ave-badge variant="warning">Истекает</ave-badge>',
    '<ave-badge variant="danger">Истёк</ave-badge>',
  ),
  play: async ({ canvasElement }) => {
    const badges = [...canvasElement.querySelectorAll('ave-badge')];
    await expect(badges.map((badge) => badge.textContent.trim())).toEqual(statuses.map((status) => status.text));
    for (const badge of badges) {
      await expect(badge.getBoundingClientRect().height).toBe(20);
      await expect(badge.getAttribute('role')).toBeNull();
    }
    // Each variant has a fill of its own.
    const fills = new Set(badges.map((badge) => getComputedStyle(badge).backgroundColor));
    await expect(fills.size).toBe(5);
  },
};

/** Where a status stands: at the end of a list's row, after a heading, and inside a sentence. */
export const Places: Story = {
  render: frame('places'),
  parameters: source(
    '<li class="row">…<ave-badge variant="success">Подписан</ave-badge></li>',
    '<h3>Договор ДК-2025/109 <ave-badge variant="danger">Истёк</ave-badge></h3>',
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // The badge is text: the row's and the heading's words include it.
    await expect(canvas.getByRole('heading', { name: 'Договор ДК-2025/109 Истёк' })).toBeVisible();
    for (const row of canvasElement.querySelectorAll('.row')) {
      const badge = row.querySelector('ave-badge')?.getBoundingClientRect();
      await expect(Math.round(row.getBoundingClientRect().right - (badge?.right ?? 0))).toBe(16);
    }
  },
};

/** Long Uzbek and Russian statuses wrap in a narrow column and are never cut; a badge without words draws nothing. */
export const LongText: Story = {
  name: 'Long text',
  render: frame('long'),
  play: async ({ canvasElement }) => {
    const column = canvasElement.querySelector('.narrow');
    for (const badge of canvasElement.querySelectorAll('ave-badge')) {
      const { height, width } = badge.getBoundingClientRect();
      await expect(width).toBeLessThanOrEqual(column?.clientWidth ?? 0);
      await expect(badge.scrollWidth).toBeLessThanOrEqual(badge.clientWidth);
      await expect(height === 0 || (height - 4) % 16 === 0).toBe(true);
    }
    await expect(canvasElement.querySelector('ave-badge:empty')?.getBoundingClientRect().width).toBe(0);
  },
};

/** Counts beside the names of places: one figure a circle, more a wider pill, "99+" over the cap, none at 0. */
export const Counts: Story = {
  tags: ['forced-colors'],
  render: frame('counts'),
  parameters: source(
    '<a aveLink routerLink="/inbox">Входящие <ave-count [value]="3" /></a>',
    '<a aveLink routerLink="/archive">Архив <ave-count [value]="1284" max="9999" /></a>',
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('link', { name: 'Входящие 3' })).toBeVisible();
    await expect(canvas.getByRole('link', { name: 'Все документы 99+' })).toBeVisible();
    // The locale groups thousands with a no-break space.
    await expect(canvas.getByRole('link', { name: /^Архив 1\u00a0284$/ })).toBeVisible();
    await expect(canvas.getByRole('link', { name: 'Черновики' })).toBeVisible();
    const [one] = canvasElement.querySelectorAll('ave-count');
    await expect(one?.getBoundingClientRect().width).toBe(20);
    await expect(one?.getBoundingClientRect().height).toBe(20);
  },
};
