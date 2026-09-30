import { Component, LOCALE_ID, inject, input, signal } from '@angular/core';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { AveButton } from '@avelune/ui/button';
import { AveDialog, AveDialogActions } from '@avelune/ui/dialog';
import { AveFormField } from '@avelune/ui/form-field';
import { AveInput } from '@avelune/ui/input';
import { AveToaster, type AveToastOptions } from '@avelune/ui/toast';

type View = 'default' | 'variants' | 'undo' | 'queue' | 'long' | 'dialog';

const variants: readonly AveToastOptions[] = [
  { message: 'Выгрузка реестра началась. Файл появится в разделе «Загрузки».' },
  { message: 'Срок согласования договора ДК-2026/114 истекает завтра.', variant: 'warning' },
  {
    message: 'Не удалось отправить договор на согласование.',
    variant: 'danger',
    action: { label: 'Повторить', run: () => undefined },
  },
];

const queue = ['Договор ДК-2026/101', 'Договор ДК-2026/102', 'Договор ДК-2026/103', 'Договор ДК-2026/104'];

/** The frame the stories show toasts from: a page with the button that shows them. Styled with tokens only. */
@Component({
  selector: 'ave-toast-stories',
  imports: [AveButton, AveDialog, AveDialogActions, AveFormField, AveInput],
  template: `
    @switch (view()) {
      @case ('undo') {
        <ul class="rows" lang="ru">
          @for (row of rows(); track row) {
            <li class="row">
              <span>{{ row }}</span>
              <button aveButton type="button" size="sm" variant="ghost" (click)="remove(row)">Удалить</button>
            </li>
          }
        </ul>
      }
      @case ('dialog') {
        <div class="page" lang="ru">
          <p class="muted">Карточка контрагента ООО «Альфа Технологии».</p>
          <button aveButton type="button" (click)="editing.set(true)">Изменить реквизиты</button>
        </div>
        <dialog aveDialog heading="Реквизиты контрагента" size="sm" [(open)]="editing" lang="ru">
          <ave-form-field label="ИНН"
            ><input aveInput type="text" inputmode="numeric" value="305123456"
          /></ave-form-field>
          <div aveDialogActions>
            <button
              aveButton
              type="button"
              variant="primary"
              (click)="toaster.show({ message: 'Реквизиты сохранены', variant: 'success' })"
            >
              Сохранить
            </button>
          </div>
        </dialog>
      }
      @default {
        <div class="page" [lang]="view() === 'long' ? 'uz-Latn' : 'ru'">
          <p class="muted">{{ view() === 'long' ? 'Hujjatlar reyestri.' : 'Реестр договоров подразделения.' }}</p>
          <button aveButton type="button" (click)="show()">{{ opener() }}</button>
        </div>
      }
    }
  `,
  styleUrl: './toast.stories.css',
})
class ToastStories {
  readonly view = input<View>('default');
  readonly opener = input('Сохранить документ');
  protected readonly toaster = inject(AveToaster);
  protected readonly rows = signal(['Договор ДК-2026/112', 'Договор ДК-2026/113', 'Договор ДК-2026/114']);
  protected readonly editing = signal(false);

  protected show(): void {
    switch (this.view()) {
      case 'variants':
        for (const toast of variants) this.toaster.show(toast);
        break;
      case 'queue':
        for (const message of queue) this.toaster.show({ message: `${message} отправлен`, variant: 'success' });
        break;
      case 'long':
        this.toaster.show({
          message:
            'Samarqand viloyati sogʻliqni saqlash boshqarmasi bilan tuzilgan shartnoma kelishuv uchun yuridik boʻlimga yuborildi',
          variant: 'success',
          action: { label: 'Ochish', run: () => undefined },
        });
        break;
      default:
        this.toaster.show({ message: 'Документ сохранён', variant: 'success' });
    }
  }

  protected remove(row: string): void {
    const at = this.rows().indexOf(row);
    this.rows.update((rows) => rows.filter((candidate) => candidate !== row));
    this.toaster.show({
      message: `${row} удалён`,
      variant: 'success',
      action: {
        label: 'Отменить',
        run: () => {
          this.rows.update((rows) => [...rows.slice(0, at), row, ...rows.slice(at)]);
        },
      },
    });
  }
}

type Story = StoryObj<ToastStories>;

function frame(view: View, opener = 'Сохранить документ'): NonNullable<Story['render']> {
  return () => ({
    props: { view, opener },
    template: `<ave-toast-stories [view]="view" [opener]="opener" />`,
    moduleMetadata: { imports: [ToastStories] },
  });
}

/** The kit's own words (the icons' kinds, Close, the region's name) in the stories' language. */
function locale(value: string): ReturnType<typeof applicationConfig> {
  return applicationConfig({ providers: [{ provide: LOCALE_ID, useValue: value }] });
}

/** The toasts on screen, not those leaving. */
function toasts(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>('[data-ave-toast]:not(.ave-motion-toast-exit)')];
}

function notifications(): HTMLElement {
  return within(document.body).getByRole('region', { name: /^(Уведомления|Bildirishnomalar) \(F8\)$/ });
}

/**
 * Shows the story's toasts with its button and waits until they have entered; the pointer then rests on them, which
 * stops their clocks, so they stay for the screenshot as they do while someone reads them.
 */
async function showToasts(canvasElement: HTMLElement, opener: string, count: number): Promise<void> {
  await userEvent.click(within(canvasElement).getByRole('button', { name: opener }));
  await waitFor(() => expect(toasts()).toHaveLength(count));
  await rest();
}

/** Rests the pointer on the notifications once every toast has entered. */
async function rest(): Promise<void> {
  await waitFor(() => expect(notifications().getAnimations({ subtree: true })).toHaveLength(0));
  await userEvent.hover(notifications());
}

const meta: Meta<ToastStories> = {
  title: 'Components/Toast',
  decorators: [locale('ru')],
};
export default meta;

/** A confirmation of what the person just did, at the bottom of the screen: 48px tall. */
export const Default: Story = {
  render: frame('default'),
  parameters: {
    docs: {
      source: {
        code: `private readonly toaster = inject(AveToaster);

this.toaster.show({ message: 'Документ сохранён', variant: 'success' });`,
        language: 'typescript',
      },
    },
  },
  play: async ({ canvasElement }) => {
    await showToasts(canvasElement, 'Сохранить документ', 1);
    const [toast] = toasts();
    await expect(within(notifications()).getByRole('listitem')).toBe(toast);
    await expect(within(notifications()).getByRole('img', { name: 'Успешно' })).toBeVisible();
    await expect(toast?.getBoundingClientRect().height).toBe(48);
  },
};

/** Information, a warning and an error with an action: each variant's icon, the newest nearest the edge. */
export const Variants: Story = {
  tags: ['forced-colors'],
  render: frame('variants', 'Показать уведомления'),
  parameters: {
    docs: {
      source: {
        code: `this.toaster.show({ message: 'Выгрузка реестра началась. Файл появится в разделе «Загрузки».' });
this.toaster.show({ message: 'Срок согласования договора ДК-2026/114 истекает завтра.', variant: 'warning' });
this.toaster.show({
  message: 'Не удалось отправить договор на согласование.',
  variant: 'danger',
  action: { label: 'Повторить', run: () => this.send(contract) },
});`,
        language: 'typescript',
      },
    },
  },
  play: async ({ canvasElement }) => {
    await showToasts(canvasElement, 'Показать уведомления', 3);
    const [first, , last] = toasts();
    await expect(first?.getBoundingClientRect().bottom).toBeLessThan(last?.getBoundingClientRect().top ?? 0);
    await expect(within(last ?? canvasElement).getByRole('button', { name: 'Повторить' })).toBeVisible();
  },
};

/** Undo: the row goes at once, and the toast's action brings it back. */
export const Undo: Story = {
  render: frame('undo'),
  parameters: {
    docs: {
      source: {
        code: `this.toaster.show({
  message: \`\${contract.number} удалён\`,
  variant: 'success',
  action: { label: 'Отменить', run: () => this.restore(contract) },
});`,
        language: 'typescript',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const [first] = canvas.getAllByRole('button', { name: 'Удалить' });
    if (first !== undefined) await userEvent.click(first);
    await waitFor(() => expect(toasts()).toHaveLength(1));
    await expect(canvas.queryByText('Договор ДК-2026/112')).toBeNull();
    await userEvent.click(within(notifications()).getByRole('button', { name: 'Отменить' }));
    await expect(canvas.getByText('Договор ДК-2026/112')).toBeVisible();
    await waitFor(() => expect(toasts()).toHaveLength(0));

    const [again] = canvas.getAllByRole('button', { name: 'Удалить' });
    if (again !== undefined) await userEvent.click(again);
    await waitFor(() => expect(toasts()).toHaveLength(1));
    await rest();
  },
};

/** Four at once: three show, the fourth waits its turn and shows as soon as one is closed. */
export const Queue: Story = {
  render: frame('queue', 'Отправить на согласование'),
  parameters: {
    docs: {
      source: {
        code: `this.toaster.show({ message: 'Договор ДК-2026/101 отправлен', variant: 'success' });
this.toaster.show({ message: 'Договор ДК-2026/102 отправлен', variant: 'success' });
this.toaster.show({ message: 'Договор ДК-2026/103 отправлен', variant: 'success' });
this.toaster.show({ message: 'Договор ДК-2026/104 отправлен', variant: 'success' }); // waits its turn`,
        language: 'typescript',
      },
    },
  },
  play: async ({ canvasElement }) => {
    await showToasts(canvasElement, 'Отправить на согласование', 3);
    const [first] = toasts();
    if (first !== undefined) await userEvent.click(within(first).getByRole('button', { name: 'Закрыть' }));
    await waitFor(() =>
      expect(toasts().map((toast) => toast.querySelector('.message')?.textContent)).toContain(
        'Договор ДК-2026/104 отправлен',
      ),
    );
    await rest();
    await expect(toasts()).toHaveLength(3);
  },
};

/** A long message wraps; the icon, the action and the close button stay on its first line. */
export const LongText: Story = {
  name: 'Long text',
  decorators: [locale('uz-Latn')],
  render: frame('long', 'Kelishuvga yuborish'),
  parameters: {
    docs: {
      source: {
        code: `this.toaster.show({
  message: 'Samarqand viloyati sogʻliqni saqlash boshqarmasi bilan tuzilgan shartnoma kelishuv uchun yuridik boʻlimga yuborildi',
  variant: 'success',
  action: { label: 'Ochish', run: () => this.open(contract) },
});`,
        language: 'typescript',
      },
    },
  },
  play: async ({ canvasElement }) => {
    await showToasts(canvasElement, 'Kelishuvga yuborish', 1);
    const [toast] = toasts();
    const icon = toast?.querySelector('.icon')?.getBoundingClientRect();
    const close = toast?.querySelector('.close')?.getBoundingClientRect();
    await expect(close?.top).toBe((icon?.top ?? 0) - 6);
    await expect((toast?.getBoundingClientRect().height ?? 0) % 4).toBe(0);
    await expect(toast?.getBoundingClientRect().height).toBeGreaterThan(48);
  },
};

/** Over a modal dialog: the notifications move into it, where they can be used, and move back when it closes. */
export const OverADialog: Story = {
  name: 'Over a dialog',
  render: frame('dialog'),
  parameters: {
    docs: {
      source: {
        code: `// From a modal dialog: while it is open, the notifications show inside it.
this.toaster.show({ message: 'Реквизиты сохранены', variant: 'success' });`,
        language: 'typescript',
      },
    },
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Изменить реквизиты' }));
    const dialog = canvasElement.querySelector('dialog');
    await waitFor(() => expect(dialog?.open).toBe(true));
    await userEvent.click(within(dialog ?? canvasElement).getByRole('button', { name: 'Сохранить' }));
    await waitFor(() => expect(toasts()).toHaveLength(1));
    await expect(notifications().parentElement).toBe(dialog);
    await userEvent.keyboard('{F8}');
    await expect(notifications()).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    await expect(within(dialog ?? canvasElement).getByRole('button', { name: 'Сохранить' })).toHaveFocus();
    await expect(dialog?.open).toBe(true);
    await rest();
  },
};

/** Compact density, which the notifications take from the page: 44px tall, the close button one step down. */
export const Compact: Story = {
  globals: { density: 'compact' },
  render: frame('default'),
  parameters: {
    docs: {
      source: {
        code: `// <html data-density="compact">: the notifications take the page's density, 44px tall.
this.toaster.show({ message: 'Документ сохранён', variant: 'success' });`,
        language: 'typescript',
      },
    },
  },
  play: async ({ canvasElement }) => {
    await showToasts(canvasElement, 'Сохранить документ', 1);
    const [toast] = toasts();
    await expect(toast?.getBoundingClientRect().height).toBe(44);
  },
};
