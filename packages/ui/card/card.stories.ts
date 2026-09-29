import { Component, LOCALE_ID, input } from '@angular/core';
import { RouterLink, provideRouter, withHashLocation } from '@angular/router';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, within } from 'storybook/test';
import { AveBadge } from '@avelune/ui/badge';
import { AveButton } from '@avelune/ui/button';
import { AveCard, AveCardEnd, AveCardFooter, AveCardTitle } from '@avelune/ui/card';
import { AveLink } from '@avelune/ui/link';

type View = 'default' | 'grid' | 'long';

/** The frame the stories draw cards in: contracts and a group of settings. Styled with tokens only. */
@Component({
  selector: 'ave-card-stories',
  imports: [AveBadge, AveButton, AveCard, AveCardEnd, AveCardFooter, AveCardTitle, AveLink, RouterLink],
  template: `
    @switch (view()) {
      @case ('grid') {
        <ul class="grid" aria-label="Договоры на продление" lang="ru">
          @for (contract of contracts; track contract.number) {
            <li>
              <ave-card>
                <h3 aveCardTitle>
                  <a aveLink [routerLink]="['/contracts', contract.number]">{{ contract.subject }}</a>
                </h3>
                <ave-badge aveCardEnd [variant]="contract.variant">{{ contract.status }}</ave-badge>
                <p class="muted">{{ contract.number }} · {{ contract.counterparty }}</p>
              </ave-card>
            </li>
          }
        </ul>
      }
      @case ('long') {
        <div class="narrow" lang="uz-Latn">
          <ave-card>
            <h3 aveCardTitle>Oʻzbekiston Respublikasi Vazirlar Mahkamasining qarori bilan tasdiqlangan shartnoma</h3>
            <ave-badge aveCardEnd variant="warning">Muddati tugaydi</ave-badge>
            <p>Shartnoma 2026-yil 31-dekabrgacha amal qiladi. Uni uzaytiring yoki yangisini tayyorlang.</p>
            <div aveCardFooter>
              <button aveButton type="button">Arxivga oʻtkazish</button>
              <button aveButton type="button" variant="primary">Muddatini uzaytirish</button>
            </div>
          </ave-card>
        </div>
      }
      @default {
        <ave-card lang="ru">
          <h3 aveCardTitle>Поставка офисной мебели</h3>
          <ave-badge aveCardEnd variant="success">Подписан</ave-badge>
          <dl class="facts">
            <div>
              <dt>Контрагент</dt>
              <dd>ООО «Мебель Сервис»</dd>
            </div>
            <div>
              <dt>Сумма без НДС</dt>
              <dd class="sum">48 500 000,00 сум</dd>
            </div>
            <div>
              <dt>Действует до</dt>
              <dd>31.12.2026</dd>
            </div>
          </dl>
          <div aveCardFooter>
            <button aveButton type="button">Продлить</button>
            <a aveButton variant="primary" routerLink="/contracts/114">Открыть договор</a>
          </div>
        </ave-card>
      }
    }
  `,
  styleUrl: './card.stories.css',
})
class CardStories {
  readonly view = input<View>('default');
  protected readonly contracts = [
    {
      number: 'ДК-2025/114',
      subject: 'Поставка офисной мебели',
      counterparty: 'ООО «Мебель Сервис»',
      status: 'Подписан',
      variant: 'success',
    },
    {
      number: 'ДК-2025/112',
      subject: 'Аренда склада в Сергелийском районе',
      counterparty: 'ИП Каримов А.',
      status: 'Истекает',
      variant: 'warning',
    },
    {
      number: 'ДК-2025/109',
      subject: 'Лицензии на систему документооборота',
      counterparty: 'ООО «Софт Лайн»',
      status: 'Истёк',
      variant: 'danger',
    },
  ] as const;
}

type Story = StoryObj<CardStories>;

function frame(view: View): NonNullable<Story['render']> {
  return () => ({
    props: { view },
    template: `<ave-card-stories [view]="view" />`,
    moduleMetadata: { imports: [CardStories] },
  });
}

function source(...lines: readonly string[]): NonNullable<Story['parameters']> {
  return { docs: { source: { code: lines.join('\n'), language: 'html' } } };
}

const meta: Meta<CardStories> = {
  title: 'Components/Card',
  component: CardStories,
  decorators: [
    applicationConfig({
      providers: [{ provide: LOCALE_ID, useValue: 'ru' }, provideRouter([], withHashLocation())],
    }),
  ],
};
export default meta;

/** One contract: its title and status, its facts, and its actions at the foot. */
export const Default: Story = {
  tags: ['forced-colors'],
  render: frame('default'),
  parameters: source(
    '<ave-card>',
    '  <h3 aveCardTitle>Поставка офисной мебели</h3>',
    '  <ave-badge aveCardEnd variant="success">Подписан</ave-badge>',
    '  <dl>…</dl>',
    '  <div aveCardFooter>',
    '    <button aveButton type="button">Продлить</button>',
    '    <a aveButton variant="primary" routerLink="/contracts/114">Открыть договор</a>',
    '  </div>',
    '</ave-card>',
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { name: 'Поставка офисной мебели', level: 3 })).toBeVisible();
    const card = canvasElement.querySelector('ave-card');
    await expect(getComputedStyle(card ?? canvasElement).boxShadow).toBe('none');
    const status = canvasElement.querySelector('ave-badge')?.getBoundingClientRect();
    const title = canvas.getByRole('heading').getBoundingClientRect();
    await expect(status?.top).toBe(title.top);
  },
};

/** Cards in a grid that wraps, each linking its contract from its title. */
export const Grid: Story = {
  render: frame('grid'),
  parameters: source(
    '<li>',
    '  <ave-card>',
    '    <h3 aveCardTitle><a aveLink routerLink="/contracts/114">Поставка офисной мебели</a></h3>',
    '    <ave-badge aveCardEnd variant="success">Подписан</ave-badge>',
    '    <p>ДК-2025/114 · ООО «Мебель Сервис»</p>',
    '  </ave-card>',
    '</li>',
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(within(canvas.getByRole('list')).getAllByRole('listitem')).toHaveLength(3);
    await expect(canvas.getByRole('link', { name: 'Поставка офисной мебели' })).toBeVisible();
  },
};

/** A long Uzbek title wraps under its status; the actions wrap at the foot. */
export const LongText: Story = {
  name: 'Long text',
  render: frame('long'),
  play: async ({ canvasElement }) => {
    const card = canvasElement.querySelector('ave-card');
    await expect(card?.scrollWidth).toBe(card?.clientWidth);
    await expect((card?.getBoundingClientRect().height ?? 0) % 4).toBe(0);
  },
};
