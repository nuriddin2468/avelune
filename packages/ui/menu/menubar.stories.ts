import { Component, LOCALE_ID, input, signal } from '@angular/core';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { lucideFileDown, lucideFilePlus, lucidePrinter, lucideSave, lucideSearch } from '@avelune/icons/lucide';
import { provideAveIcons } from '@avelune/ui/icon';
import { AveMenubar, type AveMenubarMenu } from '@avelune/ui/menu';

type View = 'default' | 'long';

const menus: readonly AveMenubarMenu<string>[] = [
  {
    label: 'Файл',
    items: [
      { value: 'new', label: 'Новый шаблон', icon: 'file-plus' },
      { value: 'save', label: 'Сохранить', icon: 'save' },
      { value: 'export', label: 'Выгрузить в PDF', icon: 'file-down' },
      { value: 'print', label: 'Печать', icon: 'printer' },
      { separator: true },
      { value: 'close', label: 'Закрыть шаблон' },
    ],
  },
  {
    label: 'Правка',
    items: [
      { value: 'undo', label: 'Отменить' },
      { value: 'redo', label: 'Повторить', disabled: true },
      { separator: true },
      { value: 'find', label: 'Найти и заменить', icon: 'search' },
    ],
  },
  {
    label: 'Вставка',
    items: [
      { value: 'counterparty', label: 'Поле контрагента' },
      { value: 'amount', label: 'Поле суммы' },
      { value: 'date', label: 'Дата подписания' },
    ],
  },
  {
    label: 'Вид',
    items: [
      { value: 'fields', label: 'Показать поля' },
      { value: 'preview', label: 'Предпросмотр' },
    ],
  },
];

const long: readonly AveMenubarMenu<string>[] = [
  {
    label: 'Fayl',
    items: [
      { value: 'save', label: 'Shablonni saqlash', icon: 'save' },
      {
        value: 'export',
        label: 'Oʻzbekiston Respublikasi vazirliklari uchun PDF formatida yuklab olish',
        icon: 'file-down',
      },
    ],
  },
  {
    label: 'Maʼlumotnomalar',
    items: [
      { value: 'counterparty', label: 'Вставить реквизиты контрагента из справочника организаций' },
      { value: 'bank', label: 'Bank rekvizitlari' },
    ],
  },
];

/** The frame the stories draw menubars in: the top of a template editor. Styled with tokens only. */
@Component({
  selector: 'ave-menubar-stories',
  imports: [AveMenubar],
  providers: [provideAveIcons([lucideFileDown, lucideFilePlus, lucidePrinter, lucideSave, lucideSearch])],
  template: `
    @if (view() === 'long') {
      <ave-menubar label="Shablon" [menus]="long" lang="uz-Latn" (itemSelected)="chosen.set($event)" />
    } @else {
      <ave-menubar label="Шаблон договора" [menus]="menus" (itemSelected)="chosen.set($event)" />
    }
    <p class="status" role="status">{{ chosen() }}</p>
  `,
  styleUrl: './menubar.stories.css',
})
class MenubarStories {
  readonly view = input<View>('default');
  protected readonly menus = menus;
  protected readonly long = long;
  protected readonly chosen = signal('');
}

type Story = StoryObj<MenubarStories>;

function frame(view: View): NonNullable<Story['render']> {
  return () => ({
    props: { view },
    template: `<ave-menubar-stories [view]="view" />`,
    moduleMetadata: { imports: [MenubarStories] },
  });
}

/** The open menu, if any. */
function openMenu(): HTMLElement | null {
  return document.querySelector<HTMLElement>('[role="menu"]');
}

const meta: Meta<MenubarStories> = {
  title: 'Components/Menubar',
  component: AveMenubar,
  decorators: [applicationConfig({ providers: [{ provide: LOCALE_ID, useValue: 'ru' }] })],
};
export default meta;

/** An editor's menus: the arrows along the bar, a menu opened by Down, following the arrows while it is open. */
export const Default: Story = {
  render: frame('default'),
  parameters: {
    docs: {
      source: {
        code: `import { Component, signal } from '@angular/core';
import { lucideFileDown, lucideFilePlus, lucidePrinter, lucideSave, lucideSearch } from '@avelune/icons/lucide';
import { provideAveIcons } from '@avelune/ui/icon';
import { AveMenubar, type AveMenubarMenu } from '@avelune/ui/menu';

type Command =
  | 'new' | 'save' | 'export' | 'print' | 'close'
  | 'undo' | 'redo' | 'find'
  | 'counterparty' | 'amount' | 'date'
  | 'fields' | 'preview';

@Component({
  selector: 'app-template-menubar',
  imports: [AveMenubar],
  providers: [provideAveIcons([lucideFileDown, lucideFilePlus, lucidePrinter, lucideSave, lucideSearch])],
  template: \`
    <ave-menubar label="Шаблон договора" [menus]="menus" (itemSelected)="chosen.set($event)" />
    <p role="status">{{ chosen() }}</p>
  \`,
})
export class TemplateMenubar {
  protected readonly menus: readonly AveMenubarMenu<Command>[] = [
    {
      label: 'Файл',
      items: [
        { value: 'new', label: 'Новый шаблон', icon: 'file-plus' },
        { value: 'save', label: 'Сохранить', icon: 'save' },
        { value: 'export', label: 'Выгрузить в PDF', icon: 'file-down' },
        { value: 'print', label: 'Печать', icon: 'printer' },
        { separator: true },
        { value: 'close', label: 'Закрыть шаблон' },
      ],
    },
    {
      label: 'Правка',
      items: [
        { value: 'undo', label: 'Отменить' },
        { value: 'redo', label: 'Повторить', disabled: true },
        { separator: true },
        { value: 'find', label: 'Найти и заменить', icon: 'search' },
      ],
    },
    {
      label: 'Вставка',
      items: [
        { value: 'counterparty', label: 'Поле контрагента' },
        { value: 'amount', label: 'Поле суммы' },
        { value: 'date', label: 'Дата подписания' },
      ],
    },
    {
      label: 'Вид',
      items: [
        { value: 'fields', label: 'Показать поля' },
        { value: 'preview', label: 'Предпросмотр' },
      ],
    },
  ];
  protected readonly chosen = signal<Command | ''>('');
}`,
        language: 'typescript',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const bar = within(canvas.getByRole('menubar', { name: 'Шаблон договора' }));
    await userEvent.tab();
    await expect(bar.getByRole('menuitem', { name: 'Файл' })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(bar.getByRole('menuitem', { name: 'Правка' })).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(openMenu()).not.toBeNull());
    await expect(within(openMenu() ?? canvasElement).getByRole('menuitem', { name: 'Отменить' })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() =>
      expect(within(openMenu() ?? canvasElement).getByRole('menuitem', { name: 'Поле контрагента' })).toHaveFocus(),
    );
    await userEvent.keyboard('{Enter}');
    await expect(canvas.getByRole('status')).toHaveTextContent('counterparty');
    await waitFor(() => expect(openMenu()).toBeNull());
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

/** The file menu open from the keyboard: the kit's popup under its item, with icons, a separator and the item that closes. */
export const Open: Story = {
  tags: ['forced-colors'],
  render: frame('default'),
  parameters: {
    docs: {
      source: {
        code: `import { Component, signal } from '@angular/core';
import { lucideFileDown, lucideFilePlus, lucidePrinter, lucideSave, lucideSearch } from '@avelune/icons/lucide';
import { provideAveIcons } from '@avelune/ui/icon';
import { AveMenubar, type AveMenubarMenu } from '@avelune/ui/menu';

type Command =
  | 'new' | 'save' | 'export' | 'print' | 'close'
  | 'undo' | 'redo' | 'find'
  | 'counterparty' | 'amount' | 'date'
  | 'fields' | 'preview';

@Component({
  selector: 'app-template-menubar',
  imports: [AveMenubar],
  providers: [provideAveIcons([lucideFileDown, lucideFilePlus, lucidePrinter, lucideSave, lucideSearch])],
  template: \`
    <ave-menubar label="Шаблон договора" [menus]="menus" (itemSelected)="chosen.set($event)" />
    <p role="status">{{ chosen() }}</p>
  \`,
})
export class TemplateMenubar {
  protected readonly menus: readonly AveMenubarMenu<Command>[] = [
    {
      label: 'Файл',
      items: [
        { value: 'new', label: 'Новый шаблон', icon: 'file-plus' },
        { value: 'save', label: 'Сохранить', icon: 'save' },
        { value: 'export', label: 'Выгрузить в PDF', icon: 'file-down' },
        { value: 'print', label: 'Печать', icon: 'printer' },
        { separator: true },
        { value: 'close', label: 'Закрыть шаблон' },
      ],
    },
    {
      label: 'Правка',
      items: [
        { value: 'undo', label: 'Отменить' },
        { value: 'redo', label: 'Повторить', disabled: true },
        { separator: true },
        { value: 'find', label: 'Найти и заменить', icon: 'search' },
      ],
    },
    {
      label: 'Вставка',
      items: [
        { value: 'counterparty', label: 'Поле контрагента' },
        { value: 'amount', label: 'Поле суммы' },
        { value: 'date', label: 'Дата подписания' },
      ],
    },
    {
      label: 'Вид',
      items: [
        { value: 'fields', label: 'Показать поля' },
        { value: 'preview', label: 'Предпросмотр' },
      ],
    },
  ];
  protected readonly chosen = signal<Command | ''>('');
}`,
        language: 'typescript',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const bar = within(within(canvasElement).getByRole('menubar'));
    // Opened from the keyboard, as a script opens it: focus moves to the first item and draws its ring there.
    await userEvent.tab();
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(openMenu()).not.toBeNull());
    const menu = within(openMenu() ?? canvasElement);
    await waitFor(() => expect(menu.getByRole('menuitem', { name: 'Новый шаблон' })).toHaveFocus());
    await expect(menu.getAllByRole('menuitem')).toHaveLength(5);
    await expect(menu.getByRole('separator')).toBeInTheDocument();
    await expect(bar.getByRole('menuitem', { name: 'Файл' })).toHaveAttribute('aria-expanded', 'true');
  },
};

/** Long Uzbek and Russian items wrap inside the menu's 320px; the bar's words stay on one line each. */
export const LongText: Story = {
  name: 'Long text',
  render: frame('long'),
  parameters: {
    docs: {
      source: {
        code: `import { Component, signal } from '@angular/core';
import { lucideFileDown, lucideSave } from '@avelune/icons/lucide';
import { provideAveIcons } from '@avelune/ui/icon';
import { AveMenubar, type AveMenubarMenu } from '@avelune/ui/menu';

type Command = 'save' | 'export' | 'counterparty' | 'bank';

@Component({
  selector: 'app-template-menubar',
  imports: [AveMenubar],
  providers: [provideAveIcons([lucideFileDown, lucideSave])],
  template: \`
    <ave-menubar label="Shablon" [menus]="menus" lang="uz-Latn" (itemSelected)="chosen.set($event)" />
    <p role="status">{{ chosen() }}</p>
  \`,
})
export class TemplateMenubar {
  protected readonly menus: readonly AveMenubarMenu<Command>[] = [
    {
      label: 'Fayl',
      items: [
        { value: 'save', label: 'Shablonni saqlash', icon: 'save' },
        {
          value: 'export',
          label: 'Oʻzbekiston Respublikasi vazirliklari uchun PDF formatida yuklab olish',
          icon: 'file-down',
        },
      ],
    },
    {
      label: 'Maʼlumotnomalar',
      items: [
        { value: 'counterparty', label: 'Вставить реквизиты контрагента из справочника организаций' },
        { value: 'bank', label: 'Bank rekvizitlari' },
      ],
    },
  ];
  protected readonly chosen = signal<Command | ''>('');
}`,
        language: 'typescript',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const bar = within(within(canvasElement).getByRole('menubar'));
    await userEvent.tab();
    await userEvent.keyboard('{ArrowRight}');
    await expect(bar.getByRole('menuitem', { name: 'Maʼlumotnomalar' })).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(openMenu()).not.toBeNull());
    const menu = openMenu();
    await expect(menu?.getBoundingClientRect().width).toBeLessThanOrEqual(320);
    await expect(menu?.scrollWidth).toBe(menu?.clientWidth);
  },
};
