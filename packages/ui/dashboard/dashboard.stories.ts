import { Component, LOCALE_ID, input } from '@angular/core';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, within } from 'storybook/test';
import { AveCount } from '@avelune/ui/badge';
import { AveButton } from '@avelune/ui/button';
import { AveCard, AveCardEnd, AveCardTitle } from '@avelune/ui/card';
import { AveDashboard, AveDashboardActions, AveDashboardMetric, AveDashboardWide } from '@avelune/ui/dashboard';

type View = 'default' | 'plain' | 'long';

const groups = [
  { id: 'approval', title: 'Ждут согласования', rows: ['ДК-2026/114 · Поставка серверного оборудования'] },
  { id: 'drafts', title: 'Черновики', rows: ['ДК-2026/111 · Консультационные услуги'] },
  {
    id: 'expired',
    title: 'Истекли',
    rows: ['ДК-2025/109 · Ремонт кровли', 'ДК-2025/104 · Охрана здания'],
  },
] as const;

/** The frame the stories draw dashboards in: a department's overview. Styled with tokens only. */
@Component({
  selector: 'ave-dashboard-stories',
  imports: [
    AveButton,
    AveCard,
    AveCardEnd,
    AveCardTitle,
    AveCount,
    AveDashboard,
    AveDashboardActions,
    AveDashboardMetric,
    AveDashboardWide,
  ],
  template: `
    @switch (view()) {
      @case ('plain') {
        <ave-dashboard heading="Мои задачи" lang="ru">
          @for (group of groups; track group.id) {
            <ave-card>
              <h2 aveCardTitle>{{ group.title }}</h2>
              <p>{{ group.rows[0] }}</p>
            </ave-card>
          }
        </ave-dashboard>
      }
      @case ('long') {
        <ave-dashboard
          heading="Yuridik departamentning shartnomalari boʻyicha umumiy koʻrinish"
          description="Oʻzbekiston Respublikasi hududiy boshqarmalari bilan tuzilgan shartnomalar"
          lang="uz-Latn"
        >
          <ave-dashboard-metric
            label="Kelishuv jarayonidagi shartnomalar"
            value="1 204"
            note="ulardan 12 tasi sizni kutmoqda"
          />
          <ave-dashboard-metric label="Amaldagi" value="3,8 mlrd soʻm" />
          <ave-card>
            <h2 aveCardTitle>Muddati tugagan va uzaytirilishi kerak boʻlgan shartnomalar</h2>
            <p>DK-2025/109 · Maʼmuriy binoning tomini taʼmirlash</p>
          </ave-card>
        </ave-dashboard>
      }
      @default {
        <ave-dashboard
          heading="Обзор"
          description="Договоры юридического департамента на сегодня"
          metricsLabel="Договоры в цифрах"
          lang="ru"
        >
          <div aveDashboardActions>
            <button aveButton type="button">Реестр договоров</button>
            <button aveButton type="button" variant="primary">Новый договор</button>
          </div>
          <ave-dashboard-metric label="Действующие" value="33" note="на 3,8 млрд сум" />
          <ave-dashboard-metric label="На согласовании" value="1" note="ждут согласующих" />
          <ave-dashboard-metric label="Черновики" value="1" note="ещё не отправлены" />
          <ave-dashboard-metric label="Истекли" value="2" note="продлите или закройте" />
          @for (group of groups; track group.id) {
            <ave-card>
              <h2 aveCardTitle>{{ group.title }}</h2>
              <ave-count aveCardEnd [value]="group.rows.length" />
              <ul class="rows">
                @for (row of group.rows; track row) {
                  <li>{{ row }}</li>
                }
              </ul>
            </ave-card>
          }
          <div aveDashboardWide>
            <ave-card>
              <h2 aveCardTitle>Подписаны недавно</h2>
              <ul class="rows">
                <li>ДК-2026/113 · Перевозка грузов по железной дороге · 02.03.2026</li>
                <li>ДК-2026/112 · Аренда складского помещения в Самарканде · 14.02.2026</li>
              </ul>
            </ave-card>
          </div>
        </ave-dashboard>
      }
    }
  `,
  styleUrl: './dashboard.stories.css',
})
class DashboardStories {
  readonly view = input<View>('default');
  protected readonly groups = groups;
}

type Story = StoryObj<DashboardStories>;

function frame(view: View): NonNullable<Story['render']> {
  return () => ({
    props: { view },
    template: `<ave-dashboard-stories [view]="view" />`,
    moduleMetadata: { imports: [DashboardStories] },
  });
}

/** How many columns the dashboard's cards stand in. */
function columns(canvasElement: HTMLElement): number {
  const tiles = canvasElement.querySelector('ave-dashboard .tiles');
  return tiles === null ? 0 : getComputedStyle(tiles).gridTemplateColumns.split(' ').length;
}

const meta: Meta<DashboardStories> = {
  title: 'Patterns/Dashboard',
  component: AveDashboard,
  decorators: [applicationConfig({ providers: [{ provide: LOCALE_ID, useValue: 'ru' }] })],
};
export default meta;

/** A department's overview: four key figures, three cards of what waits, and a wide card of what was signed last. */
export const Default: Story = {
  tags: ['forced-colors'],
  render: frame('default'),
  parameters: {
    docs: {
      source: {
        code: `<ave-dashboard heading="Обзор" description="Договоры юридического департамента на сегодня" metricsLabel="Договоры в цифрах">
  <div aveDashboardActions>
    <button aveButton type="button">Реестр договоров</button>
    <button aveButton type="button" variant="primary">Новый договор</button>
  </div>
  <ave-dashboard-metric label="Действующие" value="33" note="на 3,8 млрд сум" />
  <ave-dashboard-metric label="На согласовании" value="1" note="ждут согласующих" />
  <ave-dashboard-metric label="Черновики" value="1" note="ещё не отправлены" />
  <ave-dashboard-metric label="Истекли" value="2" note="продлите или закройте" />
  <ave-card>
    <h2 aveCardTitle>Ждут согласования</h2>
    <ave-count aveCardEnd [value]="1" />
    <ul>
      <li>ДК-2026/114 · Поставка серверного оборудования</li>
    </ul>
  </ave-card>
  <ave-card>
    <h2 aveCardTitle>Черновики</h2>
    <ave-count aveCardEnd [value]="1" />
    <ul>
      <li>ДК-2026/111 · Консультационные услуги</li>
    </ul>
  </ave-card>
  <ave-card>
    <h2 aveCardTitle>Истекли</h2>
    <ave-count aveCardEnd [value]="2" />
    <ul>
      <li>ДК-2025/109 · Ремонт кровли</li>
      <li>ДК-2025/104 · Охрана здания</li>
    </ul>
  </ave-card>
  <div aveDashboardWide>
    <ave-card>
      <h2 aveCardTitle>Подписаны недавно</h2>
      <ul>
        <li>ДК-2026/113 · Перевозка грузов по железной дороге · 02.03.2026</li>
        <li>ДК-2026/112 · Аренда складского помещения в Самарканде · 14.02.2026</li>
      </ul>
    </ave-card>
  </div>
</ave-dashboard>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { level: 1, name: 'Обзор' })).toBeVisible();
    const figures = canvas.getByRole('list', { name: 'Договоры в цифрах' });
    await expect(within(figures).getAllByRole('listitem')).toHaveLength(4);
    const width = canvasElement.querySelector('ave-dashboard')?.getBoundingClientRect().width ?? 0;
    await expect(columns(canvasElement)).toBe(width >= 960 ? 3 : width >= 640 ? 2 : 1);
  },
};

/** Cards without key figures: no row is left for them. */
export const WithoutFigures: Story = {
  name: 'Without figures',
  render: frame('plain'),
  parameters: {
    docs: {
      source: {
        code: `<ave-dashboard heading="Мои задачи">
  <ave-card>
    <h2 aveCardTitle>Ждут согласования</h2>
    <p>ДК-2026/114 · Поставка серверного оборудования</p>
  </ave-card>
  <ave-card>
    <h2 aveCardTitle>Черновики</h2>
    <p>ДК-2026/111 · Консультационные услуги</p>
  </ave-card>
  <ave-card>
    <h2 aveCardTitle>Истекли</h2>
    <p>ДК-2025/109 · Ремонт кровли</p>
  </ave-card>
</ave-dashboard>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const metrics = canvasElement.querySelector('ave-dashboard .metrics');
    await expect(metrics ? getComputedStyle(metrics).display : '').toBe('none');
  },
};

/** Long Uzbek headings, labels and figures wrap; nothing scrolls sideways. */
export const LongText: Story = {
  name: 'Long text',
  render: frame('long'),
  parameters: {
    docs: {
      source: {
        code: `<ave-dashboard
  heading="Yuridik departamentning shartnomalari boʻyicha umumiy koʻrinish"
  description="Oʻzbekiston Respublikasi hududiy boshqarmalari bilan tuzilgan shartnomalar"
  lang="uz-Latn"
>
  <ave-dashboard-metric
    label="Kelishuv jarayonidagi shartnomalar"
    value="1 204"
    note="ulardan 12 tasi sizni kutmoqda"
  />
  <ave-dashboard-metric label="Amaldagi" value="3,8 mlrd soʻm" />
  <ave-card>
    <h2 aveCardTitle>Muddati tugagan va uzaytirilishi kerak boʻlgan shartnomalar</h2>
    <p>DK-2025/109 · Maʼmuriy binoning tomini taʼmirlash</p>
  </ave-card>
</ave-dashboard>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const page = canvasElement.querySelector('ave-dashboard');
    await expect(page?.scrollWidth).toBe(page?.clientWidth);
  },
};
