import { Component, LOCALE_ID, input, signal } from '@angular/core';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import {
  lucideCopy,
  lucideDownload,
  lucideEllipsis,
  lucidePencil,
  lucidePrinter,
  lucideRedo2,
  lucideTrash,
  lucideUndo2,
} from '@avelune/icons/lucide';
import { AveButton, AveIconButton } from '@avelune/ui/button';
import { AveIcon, provideAveIcons } from '@avelune/ui/icon';
import { AveMenu, type AveMenuEntry } from '@avelune/ui/menu';
import { AveToolbar, AveToolbarItem, AveToolbarSeparator } from '@avelune/ui/toolbar';
import { AveTooltip } from '@avelune/ui/tooltip';

type View = 'default' | 'editor' | 'narrow';

/** The frame the stories draw toolbars in: over a contract, or over a template's text. Styled with tokens only. */
@Component({
  selector: 'ave-toolbar-stories',
  imports: [AveButton, AveIcon, AveIconButton, AveMenu, AveToolbar, AveToolbarItem, AveToolbarSeparator, AveTooltip],
  providers: [
    provideAveIcons([
      lucideCopy,
      lucideDownload,
      lucideEllipsis,
      lucidePencil,
      lucidePrinter,
      lucideRedo2,
      lucideTrash,
      lucideUndo2,
    ]),
  ],
  template: `
    @switch (view()) {
      @case ('editor') {
        <div aveToolbar label="Правка шаблона">
          <button
            aveIconButton
            aveToolbarItem
            type="button"
            variant="ghost"
            icon="undo-2"
            label="Отменить"
            aveTooltip="Отменить"
          ></button>
          <button
            aveIconButton
            aveToolbarItem
            type="button"
            variant="ghost"
            icon="redo-2"
            label="Повторить"
            aveTooltip="Повторить"
            disabled
            disabledInteractive
          ></button>
          <span aveToolbarSeparator></span>
          <ave-menu label="Вставить поле" variant="ghost" [items]="fields" (itemSelected)="chosen.set($event)" />
          <span aveToolbarSeparator></span>
          <button aveButton aveToolbarItem type="button" variant="ghost">Проверить шаблон</button>
        </div>
        <p class="status" role="status">{{ chosen() }}</p>
      }
      @case ('narrow') {
        <div class="narrow">
          <div aveToolbar label="Действия с договором">
            <button aveButton aveToolbarItem type="button" variant="ghost">Изменить договор</button>
            <button aveButton aveToolbarItem type="button" variant="ghost">Отправить на согласование</button>
            <button aveButton aveToolbarItem type="button" variant="ghost">Выгрузить в PDF</button>
            <ave-menu label="Ещё действия" icon="ellipsis" variant="ghost" [items]="more" />
          </div>
        </div>
      }
      @default {
        <div aveToolbar label="Действия с договором">
          <button aveButton aveToolbarItem type="button" variant="ghost">
            <ave-icon name="pencil" decorative />Изменить
          </button>
          <button aveButton aveToolbarItem type="button" variant="ghost" disabled disabledInteractive>
            Отправить на согласование
          </button>
          <span aveToolbarSeparator></span>
          <button
            aveIconButton
            aveToolbarItem
            type="button"
            variant="ghost"
            icon="copy"
            label="Дублировать"
            aveTooltip="Дублировать"
          ></button>
          <button
            aveIconButton
            aveToolbarItem
            type="button"
            variant="ghost"
            icon="printer"
            label="Печать"
            aveTooltip="Печать"
          ></button>
          <ave-menu
            label="Ещё действия"
            icon="ellipsis"
            variant="ghost"
            [items]="more"
            (itemSelected)="chosen.set($event)"
          />
        </div>
        <p class="status" role="status">{{ chosen() }}</p>
      }
    }
  `,
  styleUrl: './toolbar.stories.css',
})
class ToolbarStories {
  readonly view = input<View>('default');
  protected readonly chosen = signal('');
  protected readonly more: readonly AveMenuEntry<string>[] = [
    { value: 'download', label: 'Выгрузить в PDF', icon: 'download' },
    { separator: true },
    { value: 'delete', label: 'Удалить договор', icon: 'trash', danger: true },
  ];
  protected readonly fields: readonly AveMenuEntry<string>[] = [
    { value: 'counterparty', label: 'Контрагент' },
    { value: 'amount', label: 'Сумма договора' },
    { value: 'date', label: 'Дата подписания' },
  ];
}

type Story = StoryObj<ToolbarStories>;

function frame(view: View): NonNullable<Story['render']> {
  return () => ({
    props: { view },
    template: `<ave-toolbar-stories [view]="view" />`,
    moduleMetadata: { imports: [ToolbarStories] },
  });
}

function source(...lines: readonly string[]): NonNullable<Story['parameters']> {
  return { docs: { source: { code: lines.join('\n'), language: 'html' } } };
}

// No `component`: Storybook instantiates a meta's component outside an injection context to read its defaults, and with
// this frame that failed on an injection of `ElementRef` (NG0203), as a `model()` does in the select family's stories.
const meta: Meta<ToolbarStories> = {
  title: 'Components/Toolbar',
  decorators: [applicationConfig({ providers: [{ provide: LOCALE_ID, useValue: 'ru' }] })],
};
export default meta;

/** A contract's actions: one Tab stop, the arrows between the items, the disabled one reached too, a menu last. */
export const Default: Story = {
  tags: ['forced-colors'],
  render: frame('default'),
  parameters: source(
    '<div aveToolbar label="Действия с договором">',
    '  <button aveButton aveToolbarItem type="button" variant="ghost">Изменить</button>',
    '  <button aveButton aveToolbarItem type="button" variant="ghost" disabled disabledInteractive>',
    '    Отправить на согласование',
    '  </button>',
    '  <span aveToolbarSeparator></span>',
    '  <button aveIconButton aveToolbarItem type="button" variant="ghost" icon="copy" label="Дублировать" aveTooltip="Дублировать"></button>',
    '  <ave-menu label="Ещё действия" icon="ellipsis" variant="ghost" [items]="more" />',
    '</div>',
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toolbar = within(canvas.getByRole('toolbar', { name: 'Действия с договором' }));
    await userEvent.tab();
    await expect(toolbar.getByRole('button', { name: 'Изменить' })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(toolbar.getByRole('button', { name: 'Отправить на согласование' })).toHaveFocus();
    await userEvent.keyboard('{End}');
    const more = toolbar.getByRole('button', { name: 'Ещё действия' });
    await expect(more).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(document.querySelector('[role="menu"]')).not.toBeNull());
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(document.querySelector('[role="menu"]')).toBeNull());
    await expect(more).toHaveFocus();
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

/** A template editor: icon buttons, a menu with words and a button, in groups. */
export const Editor: Story = {
  render: frame('editor'),
  play: async ({ canvasElement }) => {
    const toolbar = within(within(canvasElement).getByRole('toolbar', { name: 'Правка шаблона' }));
    await expect(toolbar.getAllByRole('separator')).toHaveLength(2);
    await expect(toolbar.getByRole('button', { name: 'Повторить' })).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(toolbar.getByRole('button', { name: 'Вставить поле' }));
    await waitFor(() => expect(document.querySelector('[role="menu"]')).not.toBeNull());
    await userEvent.click(
      within(document.querySelector<HTMLElement>('[role="menu"]') ?? canvasElement).getByRole('menuitem', {
        name: 'Сумма договора',
      }),
    );
    await expect(within(canvasElement).getByRole('status')).toHaveTextContent('amount');
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

/** A narrow panel: the items wrap onto another row, and nothing is cut. */
export const Narrow: Story = {
  render: frame('narrow'),
  play: async ({ canvasElement }) => {
    const toolbar = within(canvasElement).getByRole('toolbar');
    const tops = new Set(
      within(toolbar)
        .getAllByRole('button')
        .map((button) => button.getBoundingClientRect().top),
    );
    await expect(tops.size).toBeGreaterThan(1);
    await expect(toolbar.scrollWidth).toBe(toolbar.clientWidth);
  },
};
