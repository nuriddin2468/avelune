import { Component, LOCALE_ID, input, signal } from '@angular/core';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, within } from 'storybook/test';
import { lucideBuilding, lucideFolder } from '@avelune/icons/lucide';
import { provideAveIcons } from '@avelune/ui/icon';
import { AveTree, type AveTreeNode } from '@avelune/ui/tree';

type View = 'default' | 'folders' | 'long';

const departments: readonly AveTreeNode<string>[] = [
  {
    value: 'board',
    label: 'Правление',
    icon: 'building',
    expanded: true,
    children: [
      {
        value: 'legal',
        label: 'Юридический департамент',
        children: [
          { value: 'contracts', label: 'Отдел договоров' },
          { value: 'claims', label: 'Отдел претензионной работы' },
        ],
      },
      {
        value: 'finance',
        label: 'Финансовый департамент',
        children: [
          { value: 'accounting', label: 'Бухгалтерия' },
          { value: 'treasury', label: 'Казначейство' },
        ],
      },
      { value: 'security', label: 'Служба безопасности' },
      { value: 'archive', label: 'Архив (закрыт)', disabled: true },
    ],
  },
];

const folders: readonly AveTreeNode<string>[] = [
  {
    value: '2026',
    label: 'Номенклатура дел 2026',
    icon: 'folder',
    expanded: true,
    children: [
      {
        value: '01',
        label: '01 Руководство',
        icon: 'folder',
        children: [{ value: '01-01', label: '01-01 Приказы по основной деятельности', icon: 'folder' }],
      },
      { value: '02', label: '02 Договорная работа', icon: 'folder' },
    ],
  },
];

const long: readonly AveTreeNode<string>[] = [
  {
    value: 'ministry',
    label: 'Oʻzbekiston Respublikasi Moliya vazirligi',
    expanded: true,
    children: [
      {
        value: 'department',
        label: 'Davlat moliyaviy nazorati departamentining Toshkent shahri boʻyicha boshqarmasi',
        expanded: true,
        children: [{ value: 'unit', label: 'Hisobga olish va hisobot boʻlimi' }],
      },
    ],
  },
];

/** The frame the stories draw trees in. Styled with tokens only. */
@Component({
  selector: 'ave-tree-stories',
  imports: [AveTree],
  template: `
    @switch (view()) {
      @case ('folders') {
        <ave-tree label="Номенклатура дел" lang="ru" [nodes]="folders" [(selected)]="folder" />
      }
      @case ('long') {
        <div class="narrow" lang="uz-Latn">
          <ave-tree label="Tashkilot tuzilmasi" [nodes]="long" selected="unit" />
        </div>
      }
      @default {
        <ave-tree label="Подразделения" lang="ru" [nodes]="departments" [(selected)]="department" />
        <p class="status" role="status">Выбрано: {{ department() ?? 'ничего' }}</p>
      }
    }
  `,
  styleUrl: './tree.stories.css',
})
class TreeStories {
  readonly view = input<View>('default');
  protected readonly departments = departments;
  protected readonly folders = folders;
  protected readonly long = long;
  protected readonly department = signal<string | undefined>(undefined);
  protected readonly folder = signal<string | undefined>('02');
}

type Story = StoryObj<TreeStories>;

function frame(view: View): NonNullable<Story['render']> {
  return () => ({
    props: { view },
    template: `<ave-tree-stories [view]="view" />`,
    moduleMetadata: { imports: [TreeStories] },
  });
}

const meta: Meta<TreeStories> = {
  title: 'Components/Tree',
  component: AveTree,
  decorators: [
    applicationConfig({
      providers: [{ provide: LOCALE_ID, useValue: 'ru' }, provideAveIcons([lucideBuilding, lucideFolder])],
    }),
  ],
};
export default meta;

/** An organisation's departments: the top open, one closed branch with a disabled node. */
export const Default: Story = {
  tags: ['forced-colors'],
  render: frame('default'),
  parameters: {
    docs: {
      source: {
        code: `{ value: 'legal', label: 'Юридический департамент', children: [ … ] }
<ave-tree label="Подразделения" [nodes]="departments" [(selected)]="department" />`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const tree = canvas.getByRole('tree', { name: 'Подразделения' });
    await expect(within(tree).getAllByRole('treeitem')).toHaveLength(5);
    await expect(canvas.getByRole('treeitem', { name: 'Правление' })).toHaveAttribute('aria-expanded', 'true');
    await expect(canvas.getByRole('treeitem', { name: 'Архив (закрыт)' })).toHaveAttribute('aria-disabled', 'true');
  },
};

/** The keyboard: Down, Right to open, Down into the branch, Enter to choose. */
export const Keyboard: Story = {
  render: frame('default'),
  parameters: {
    docs: {
      source: {
        code: '<ave-tree label="Подразделения" [nodes]="departments" [(selected)]="department" />',
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    await expect(canvas.getByRole('treeitem', { name: 'Правление' })).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}{ArrowRight}{ArrowDown}');
    const contracts = canvas.getByRole('treeitem', { name: 'Отдел договоров' });
    await expect(contracts).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(contracts).toHaveAttribute('aria-selected', 'true');
    await expect(canvas.getByRole('status')).toHaveTextContent('Выбрано: contracts');
  },
};

/** A register's folders with their icons; the chosen folder is marked with the accent bar. */
export const Folders: Story = {
  render: frame('folders'),
  parameters: {
    docs: {
      source: {
        code: `{ value: '2026', label: 'Номенклатура дел 2026', icon: 'folder', expanded: true, children: [ … ] }
<ave-tree label="Номенклатура дел" [nodes]="folders" [(selected)]="folder" />`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('treeitem', { name: '02 Договорная работа' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  },
};

/** Long Uzbek names wrap in a narrow column; the chosen node deep down opens the nodes above it. */
export const LongText: Story = {
  name: 'Long text',
  render: frame('long'),
  parameters: {
    docs: {
      source: {
        code: `{ value: 'department', label: 'Davlat moliyaviy nazorati departamentining Toshkent shahri boʻyicha boshqarmasi', children: [ … ] }
<ave-tree label="Tashkilot tuzilmasi" [nodes]="structure" selected="unit" />`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('treeitem', { name: 'Hisobga olish va hisobot boʻlimi' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    const tree = canvasElement.querySelector('ave-tree');
    await expect(tree?.scrollWidth).toBe(tree?.clientWidth);
  },
};
