import { Component, LOCALE_ID, computed, input, signal, type OnInit } from '@angular/core';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, within } from 'storybook/test';
import { lucideBuilding, lucideNetwork } from '@avelune/icons/lucide';
import { AveBadge } from '@avelune/ui/badge';
import { AveCard, AveCardEnd, AveCardTitle } from '@avelune/ui/card';
import { AveEmptyState } from '@avelune/ui/empty-state';
import { provideAveIcons } from '@avelune/ui/icon';
import { AveListDetail, AveListDetailDetail, AveListDetailList } from '@avelune/ui/list-detail';
import { AveTree, type AveTreeNode } from '@avelune/ui/tree';

type View = 'default' | 'detail' | 'empty' | 'long';

interface Department {
  readonly name: string;
  readonly head: string;
  readonly staff: number;
}

const departments: Record<string, Department> = {
  board: { name: 'Правление', head: 'Рустам Назаров', staff: 2 },
  legal: { name: 'Юридический департамент', head: 'Азиза Каримова', staff: 2 },
  contracts: { name: 'Отдел договоров', head: 'Бахтиёр Рахимов', staff: 3 },
  finance: { name: 'Финансовый департамент', head: 'Малика Хасанова', staff: 1 },
};

const nodes: readonly AveTreeNode<string>[] = [
  {
    value: 'board',
    label: 'Правление',
    icon: 'building',
    expanded: true,
    children: [
      {
        value: 'legal',
        label: 'Юридический департамент',
        children: [{ value: 'contracts', label: 'Отдел договоров' }],
      },
      { value: 'finance', label: 'Финансовый департамент' },
    ],
  },
];

const uzNodes: readonly AveTreeNode<string>[] = [
  {
    value: 'board',
    label: 'Oʻzbekiston Respublikasi Moliya vazirligi huzuridagi Gʻaznachilik qoʻmitasi',
    icon: 'building',
    expanded: true,
    children: [{ value: 'legal', label: 'Huquqiy taʼminot va shartnomalar bilan ishlash boshqarmasi' }],
  },
];

/** The frame the stories draw a list–detail page in: a department tree beside the chosen one's card. */
@Component({
  selector: 'ave-list-detail-stories',
  imports: [
    AveBadge,
    AveCard,
    AveCardEnd,
    AveCardTitle,
    AveEmptyState,
    AveListDetail,
    AveListDetailDetail,
    AveListDetailList,
    AveTree,
  ],
  providers: [provideAveIcons([lucideBuilding, lucideNetwork])],
  template: `
    <div class="frame" [attr.data-narrow]="view() === 'detail' ? '' : null">
      @if (view() === 'long') {
        <ave-list-detail
          heading="Tashkiliy tuzilma va boʻlinmalar"
          description="Tashkilotning boʻlinmalari, rahbarlari va xodimlari."
          backLabel="Barcha boʻlinmalar"
          lang="uz-Latn"
        >
          <ave-tree aveListDetailList label="Boʻlinmalar" [nodes]="uzNodes" [(selected)]="selected" />
          <ave-card aveListDetailDetail>
            <h2 aveCardTitle>Oʻzbekiston Respublikasi Moliya vazirligi huzuridagi Gʻaznachilik qoʻmitasi</h2>
            <ave-badge aveCardEnd>2 nafar xodim</ave-badge>
            <p>Rahbar: Rustam Nazarov</p>
          </ave-card>
        </ave-list-detail>
      } @else {
        <ave-list-detail
          heading="Подразделения"
          description="Структура организации и сотрудники подразделений."
          [(detail)]="reading"
          lang="ru"
        >
          <ave-tree
            aveListDetailList
            label="Подразделения"
            [nodes]="nodes"
            [(selected)]="selected"
            (selectedChange)="reading.set(true)"
          />
          @if (department(); as department) {
            <ave-card aveListDetailDetail>
              <h2 aveCardTitle>{{ department.name }}</h2>
              <ave-badge aveCardEnd>{{ department.staff }} сотр.</ave-badge>
              <p>Руководитель: {{ department.head }}</p>
            </ave-card>
          } @else {
            <ave-empty-state aveListDetailDetail icon="network" heading="Выберите подразделение">
              <p>Его руководитель, телефон и сотрудники появятся здесь.</p>
            </ave-empty-state>
          }
        </ave-list-detail>
      }
    </div>
  `,
  styleUrl: './list-detail.stories.css',
})
class ListDetailStories implements OnInit {
  readonly view = input<View>('default');
  protected readonly nodes = nodes;
  protected readonly uzNodes = uzNodes;
  protected readonly selected = signal<string | undefined>(undefined);
  protected readonly reading = signal(false);
  protected readonly department = computed(() => {
    const id = this.selected();
    return id === undefined ? undefined : departments[id];
  });

  ngOnInit(): void {
    if (this.view() !== 'empty') this.selected.set(this.view() === 'long' ? 'board' : 'contracts');
    this.reading.set(this.view() === 'detail');
  }
}

type Story = StoryObj<ListDetailStories>;

function frame(view: View): NonNullable<Story['render']> {
  return () => ({
    props: { view },
    template: `<ave-list-detail-stories [view]="view" />`,
    moduleMetadata: { imports: [ListDetailStories] },
  });
}

/** Whether the story's page is narrower than container.md, where one pane shows at a time. */
function narrow(canvasElement: HTMLElement): boolean {
  const list = canvasElement.querySelector('ave-list-detail .list');
  return list !== null && getComputedStyle(list).display === 'none';
}

const snippet = `<ave-list-detail heading="Подразделения" description="Структура организации и сотрудники подразделений." [(detail)]="reading">
  <ave-tree aveListDetailList label="Подразделения" [nodes]="nodes" [(selected)]="selected" (selectedChange)="reading.set(true)" />
  <ave-card aveListDetailDetail>
    <h2 aveCardTitle>{{ department().name }}</h2>
    …
  </ave-card>
</ave-list-detail>`;

const meta: Meta<ListDetailStories> = {
  title: 'Patterns/List–detail',
  component: AveListDetail,
  decorators: [applicationConfig({ providers: [{ provide: LOCALE_ID, useValue: 'ru' }] })],
};
export default meta;

/** The department tree beside the chosen department's card; on a phone, the tree until a department is chosen. */
export const Default: Story = {
  tags: ['forced-colors'],
  render: frame('default'),
  parameters: { docs: { source: { code: snippet, language: 'html' } } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { level: 1, name: 'Подразделения' })).toBeVisible();
    await expect(canvas.getByRole('tree', { name: 'Подразделения' })).toBeVisible();
    const card = canvasElement.querySelector('ave-card');
    const tree = canvasElement.querySelector('ave-tree');
    if (!narrow(canvasElement)) {
      await expect(card?.getBoundingClientRect().top).toBe(tree?.getBoundingClientRect().top);
    }
  },
};

/** On a narrow page the chosen department shows alone, under the way back; the button returns to the tree. */
export const Detail: Story = {
  name: 'Record on a phone',
  render: frame('detail'),
  parameters: {
    docs: {
      source: {
        code: `<!-- Below container.md: the record under "Назад к списку" while detail is true. -->
<ave-list-detail heading="Подразделения" [(detail)]="reading" (detailChange)="back($event)">
  <ave-tree aveListDetailList label="Подразделения" [nodes]="nodes" [(selected)]="selected" (selectedChange)="reading.set(true)" />
  <ave-card aveListDetailDetail>…</ave-card>
</ave-list-detail>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(narrow(canvasElement)).toBe(true);
    await expect(canvas.getByRole('heading', { level: 2, name: 'Отдел договоров' })).toBeVisible();
    const back = canvas.getByRole('button', { name: 'Назад к списку' });
    await userEvent.click(back);
    await expect(canvas.getByRole('tree', { name: 'Подразделения' })).toBeVisible();
    // The tree tells of a new choice only: another department opens the record again.
    await userEvent.click(canvas.getByRole('treeitem', { name: 'Финансовый департамент' }));
    await expect(canvas.getByRole('heading', { level: 2, name: 'Финансовый департамент' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Назад к списку' })).toHaveFocus();
  },
};

/** Nothing chosen yet: the record's place says what will show there. */
export const Empty: Story = {
  name: 'Nothing chosen',
  render: frame('empty'),
  parameters: {
    docs: {
      source: {
        code: `<ave-list-detail heading="Подразделения">
  <ave-tree aveListDetailList label="Подразделения" [nodes]="nodes" [(selected)]="selected" />
  <ave-empty-state aveListDetailDetail icon="network" heading="Выберите подразделение">…</ave-empty-state>
</ave-list-detail>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    if (narrow(canvasElement)) return;
    await expect(within(canvasElement).getByText('Выберите подразделение')).toBeVisible();
  },
};

/** Long Uzbek names wrap in the tree and in the card's title; nothing scrolls sideways. */
export const LongText: Story = {
  name: 'Long text',
  render: frame('long'),
  parameters: {
    docs: {
      source: {
        code: `<ave-list-detail heading="Tashkiliy tuzilma va boʻlinmalar" backLabel="Barcha boʻlinmalar" lang="uz-Latn">
  <ave-tree aveListDetailList label="Boʻlinmalar" [nodes]="nodes" [(selected)]="selected" />
  <ave-card aveListDetailDetail>…</ave-card>
</ave-list-detail>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const page = canvasElement.querySelector('ave-list-detail');
    await expect(page?.scrollWidth).toBe(page?.clientWidth);
  },
};
