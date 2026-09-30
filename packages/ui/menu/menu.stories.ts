import { Component, LOCALE_ID, input, signal } from '@angular/core';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import {
  lucideArchive,
  lucideCopy,
  lucideDownload,
  lucideEllipsis,
  lucideFileText,
  lucidePencil,
  lucideTrash,
} from '@avelune/icons/lucide';
import { provideAveIcons } from '@avelune/ui/icon';
import { AveMenu, type AveMenuEntry } from '@avelune/ui/menu';

type Action = 'open' | 'edit' | 'copy' | 'export' | 'archive' | 'delete';
type View = 'default' | 'icon' | 'variants' | 'long' | 'row';

const actions: readonly AveMenuEntry<Action>[] = [
  { value: 'open', label: 'Открыть', icon: 'file-text' },
  { value: 'edit', label: 'Изменить', icon: 'pencil' },
  { value: 'copy', label: 'Дублировать', icon: 'copy' },
  { separator: true },
  { value: 'export', label: 'Выгрузить в PDF', icon: 'download' },
  { value: 'archive', label: 'Перенести в архив', icon: 'archive', disabled: true },
  { separator: true },
  { value: 'delete', label: 'Удалить договор', icon: 'trash', danger: true },
];

const plain: readonly AveMenuEntry<Action>[] = [
  { value: 'open', label: 'Открыть' },
  { value: 'copy', label: 'Дублировать' },
  { value: 'delete', label: 'Удалить', danger: true },
];

const long: readonly AveMenuEntry<Action>[] = [
  { value: 'open', label: 'Отправить договор на повторное согласование юридическому отделу' },
  { value: 'copy', label: 'Hujjatni boʻlim boshligʻiga kelishish uchun yuborish' },
  { value: 'delete', label: 'Удалить черновик договора без возможности восстановления', danger: true },
];

/** The frame the stories draw menus in. Styled with tokens only. */
@Component({
  selector: 'ave-menu-stories',
  imports: [AveMenu],
  providers: [
    provideAveIcons([
      lucideArchive,
      lucideCopy,
      lucideDownload,
      lucideEllipsis,
      lucideFileText,
      lucidePencil,
      lucideTrash,
    ]),
  ],
  template: `
    @switch (view()) {
      @case ('icon') {
        <ave-menu label="Действия с договором" icon="ellipsis" variant="ghost" [items]="actions" />
      }
      @case ('variants') {
        <div class="row">
          <ave-menu label="Действия" [items]="plain" />
          <ave-menu label="Действия" variant="ghost" [items]="plain" />
          <ave-menu label="Создать" variant="primary" [items]="plain" />
          <ave-menu label="Действия" size="sm" [items]="plain" />
          <ave-menu label="Действия" size="lg" [items]="plain" />
          <ave-menu label="Действия" disabled [items]="plain" />
        </div>
      }
      @case ('long') {
        <ave-menu label="Действия" [items]="long" />
      }
      @case ('row') {
        <ul class="rows" aria-label="Договоры">
          @for (number of numbers; track number) {
            <li class="line">
              <span>{{ number }}</span>
              <ave-menu
                [label]="'Действия с договором ' + number"
                icon="ellipsis"
                variant="ghost"
                size="sm"
                [items]="actions"
                (itemSelected)="chosen.set(number + ': ' + $event)"
              />
            </li>
          }
        </ul>
        <p class="status" role="status">{{ chosen() }}</p>
      }
      @default {
        <ave-menu label="Действия" [items]="actions" (itemSelected)="chosen.set($event)" />
        <p class="status" role="status">{{ chosen() }}</p>
      }
    }
  `,
  styleUrl: './menu.stories.css',
})
class MenuStories {
  readonly view = input<View>('default');
  protected readonly actions = actions;
  protected readonly plain = plain;
  protected readonly long = long;
  protected readonly numbers = ['ДК-2026/114', 'ДК-2026/113', 'ДК-2026/112'];
  protected readonly chosen = signal('');
}

type Story = StoryObj<MenuStories>;

function frame(view: View): NonNullable<Story['render']> {
  return () => ({
    props: { view },
    template: `<ave-menu-stories [view]="view" />`,
    moduleMetadata: { imports: [MenuStories] },
  });
}

/** The open menu, if any. */
function openMenu(): HTMLElement | null {
  return document.querySelector<HTMLElement>('[role="menu"]');
}

const meta: Meta<MenuStories> = {
  title: 'Components/Menu',
  component: AveMenu,
  decorators: [applicationConfig({ providers: [{ provide: LOCALE_ID, useValue: 'ru' }] })],
};
export default meta;

/** The open menu: groups of actions with icons, a disabled one, and a destructive one last. */
export const Default: Story = {
  render: frame('default'),
  parameters: {
    docs: {
      source: {
        code: `import { Component, signal } from '@angular/core';
import { lucideArchive, lucideCopy, lucideDownload, lucideFileText, lucidePencil, lucideTrash } from '@avelune/icons/lucide';
import { provideAveIcons } from '@avelune/ui/icon';
import { AveMenu, type AveMenuEntry } from '@avelune/ui/menu';

type Action = 'open' | 'edit' | 'copy' | 'export' | 'archive' | 'delete';

@Component({
  selector: 'app-contract-actions',
  imports: [AveMenu],
  providers: [
    provideAveIcons([lucideArchive, lucideCopy, lucideDownload, lucideFileText, lucidePencil, lucideTrash]),
  ],
  template: \`
    <ave-menu label="Действия" [items]="actions" (itemSelected)="chosen.set($event)" />
    <p role="status">{{ chosen() }}</p>
  \`,
})
export class ContractActions {
  protected readonly actions: readonly AveMenuEntry<Action>[] = [
    { value: 'open', label: 'Открыть', icon: 'file-text' },
    { value: 'edit', label: 'Изменить', icon: 'pencil' },
    { value: 'copy', label: 'Дублировать', icon: 'copy' },
    { separator: true },
    { value: 'export', label: 'Выгрузить в PDF', icon: 'download' },
    { value: 'archive', label: 'Перенести в архив', icon: 'archive', disabled: true },
    { separator: true },
    { value: 'delete', label: 'Удалить договор', icon: 'trash', danger: true },
  ];
  protected readonly chosen = signal('');
}`,
        language: 'typescript',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: 'Действия' });
    await userEvent.click(button);
    await waitFor(() => expect(openMenu()).not.toBeNull());
    const menu = within(openMenu() ?? canvasElement);
    await expect(menu.getAllByRole('menuitem')).toHaveLength(6);
    await expect(menu.getAllByRole('separator')).toHaveLength(2);
    await waitFor(() => expect(menu.getByRole('menuitem', { name: 'Открыть' })).toHaveFocus());
    await userEvent.keyboard('{ArrowDown}');
    await expect(menu.getByRole('menuitem', { name: 'Изменить' })).toHaveFocus();
  },
};

/** An icon alone for a row's actions: named and titled by its label. */
export const IconOnly: Story = {
  name: 'Icon only',
  render: frame('icon'),
  parameters: {
    docs: {
      source: {
        code: '<ave-menu label="Действия с договором" icon="ellipsis" variant="ghost" [items]="actions" />',
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Действия с договором' });
    await userEvent.tab();
    await expect(button).toHaveFocus();
    await waitFor(() => expect(document.querySelector('ave-tooltip-panel')).toHaveTextContent('Действия с договором'));
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(openMenu()).not.toBeNull());
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(openMenu()).toBeNull());
    await expect(button).toHaveFocus();
  },
};

/** The button takes a Button's variants, sizes and disabled state. */
export const Variants: Story = {
  render: frame('variants'),
  parameters: {
    docs: {
      source: {
        code: `<ave-menu label="Действия" [items]="actions" />
<ave-menu label="Действия" variant="ghost" [items]="actions" />
<ave-menu label="Создать" variant="primary" [items]="actions" />
<ave-menu label="Действия" size="sm" [items]="actions" />
<ave-menu label="Действия" size="lg" [items]="actions" />
<ave-menu label="Действия" disabled [items]="actions" />`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const buttons = within(canvasElement).getAllByRole('button');
    await expect(buttons.map((button) => button.getBoundingClientRect().height)).toEqual([36, 36, 36, 32, 40, 36]);
    await expect(buttons.at(-1)).toBeDisabled();
  },
};

/** Row actions at the end of each row: the menu ends at its button's end without room, and the choice names its row. */
export const RowActions: Story = {
  name: 'Row actions',
  render: frame('row'),
  parameters: {
    docs: {
      source: {
        code: `<ul aria-label="Договоры">
  @for (number of numbers; track number) {
    <li>
      <span>{{ number }}</span>
      <ave-menu
        [label]="'Действия с договором ' + number"
        icon="ellipsis"
        variant="ghost"
        size="sm"
        [items]="actions"
        (itemSelected)="run(number, $event)"
      />
    </li>
  }
</ul>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: 'Действия с договором ДК-2026/113' });
    await userEvent.click(button);
    await waitFor(() => expect(openMenu()).not.toBeNull());
    // From the button's start where there is room, ending at its end where there is not (a phone).
    const menu = openMenu()?.getBoundingClientRect();
    const box = button.getBoundingClientRect();
    await expect(menu?.left === box.left || menu?.right === box.right).toBe(true);
    await userEvent.click(within(openMenu() ?? canvasElement).getByRole('menuitem', { name: 'Дублировать' }));
    await expect(canvas.getByRole('status')).toHaveTextContent('ДК-2026/113: copy');
    await waitFor(() => expect(openMenu()).toBeNull());
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

/** Long Russian and Uzbek items wrap inside the menu's 320px; nothing truncates. */
export const LongText: Story = {
  name: 'Long text',
  render: frame('long'),
  parameters: {
    docs: {
      source: {
        code: `import { Component } from '@angular/core';
import { AveMenu, type AveMenuEntry } from '@avelune/ui/menu';

type Action = 'open' | 'copy' | 'delete';

@Component({
  selector: 'app-contract-actions',
  imports: [AveMenu],
  template: \`<ave-menu label="Действия" [items]="actions" />\`,
})
export class ContractActions {
  protected readonly actions: readonly AveMenuEntry<Action>[] = [
    { value: 'open', label: 'Отправить договор на повторное согласование юридическому отделу' },
    { value: 'copy', label: 'Hujjatni boʻlim boshligʻiga kelishish uchun yuborish' },
    { value: 'delete', label: 'Удалить черновик договора без возможности восстановления', danger: true },
  ];
}`,
        language: 'typescript',
      },
    },
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Действия' }));
    await waitFor(() => expect(openMenu()).not.toBeNull());
    const menu = openMenu();
    await expect(menu?.getBoundingClientRect().width).toBeLessThanOrEqual(320);
    await expect(menu?.scrollWidth).toBe(menu?.clientWidth);
  },
};
