import { Component, LOCALE_ID, input, signal } from '@angular/core';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { AveButton } from '@avelune/ui/button';
import { AveConfirmDialog } from '@avelune/ui/dialog';

type View = 'delete' | 'send' | 'long';

/** The frame the stories draw confirmations in: a page with the button that asks. Styled with tokens only. */
@Component({
  selector: 'ave-confirm-dialog-stories',
  imports: [AveButton, AveConfirmDialog],
  template: `
    @switch (view()) {
      @case ('send') {
        <div class="page" lang="ru">
          <button aveButton type="button" variant="primary" (click)="open.set(true)">Отправить на согласование</button>
          <p class="muted" role="status">{{ result() }}</p>
        </div>
        <dialog
          aveConfirmDialog
          variant="primary"
          heading="Отправить договор на согласование?"
          action="Отправить на согласование"
          [(open)]="open"
          (confirm)="result.set('Договор отправлен.')"
          lang="ru"
        >
          Юридический и финансовый отделы получат договор и ответят в течение пяти рабочих дней.
        </dialog>
      }
      @case ('long') {
        <div class="page" lang="uz-Latn">
          <button aveButton type="button" variant="danger" (click)="open.set(true)">Oʻchirish</button>
          <p class="muted" role="status">{{ result() }}</p>
        </div>
        <dialog
          aveConfirmDialog
          heading="Oʻzbekiston Respublikasi Vazirlar Mahkamasining qarorlari arxivini oʻchirasizmi?"
          action="Arxivni butunlay oʻchirish"
          cancel="Bekor qilish"
          [(open)]="open"
          (confirm)="result.set('Arxiv oʻchirildi.')"
          lang="uz-Latn"
        >
          Arxivdagi barcha hujjatlar va ularning ilovalari qayta tiklash imkoniyatisiz oʻchiriladi.
        </dialog>
      }
      @default {
        <div class="page" lang="ru">
          <button aveButton type="button" (click)="open.set(true)">Удалить договор</button>
          <p class="muted" role="status">{{ result() }}</p>
        </div>
        <dialog
          aveConfirmDialog
          heading="Удалить договор ДК-2026/114?"
          action="Удалить договор"
          [(open)]="open"
          (confirm)="result.set('Договор удалён.')"
          lang="ru"
        >
          Договор <b>ДК-2026/114</b> и его приложения будут удалены без возможности восстановления.
        </dialog>
      }
    }
  `,
  styleUrl: './dialog.stories.css',
})
class ConfirmDialogStories {
  readonly view = input<View>('delete');
  protected readonly open = signal(false);
  protected readonly result = signal('');
}

type Story = StoryObj<ConfirmDialogStories>;

function frame(view: View): NonNullable<Story['render']> {
  return () => ({
    props: { view },
    template: `<ave-confirm-dialog-stories [view]="view" />`,
    moduleMetadata: { imports: [ConfirmDialogStories] },
  });
}

function source(...lines: readonly string[]): NonNullable<Story['parameters']> {
  return { docs: { source: { code: lines.join('\n'), language: 'html' } } };
}

/** Asks with the button, and waits until the confirmation shows. */
async function ask(canvasElement: HTMLElement, button: string): Promise<HTMLDialogElement> {
  await userEvent.click(within(canvasElement).getByRole('button', { name: button }));
  const dialog = canvasElement.querySelector('dialog');
  if (dialog === null) throw new Error('No confirmation');
  await waitFor(() => expect(dialog.open).toBe(true));
  return dialog;
}

const meta: Meta<ConfirmDialogStories> = {
  title: 'Components/Confirm dialog',
  component: ConfirmDialogStories,
  decorators: [applicationConfig({ providers: [{ provide: LOCALE_ID, useValue: 'ru' }] })],
};
export default meta;

/** Deleting: the question names the action, the danger button repeats it, and Cancel has focus. */
export const Default: Story = {
  render: frame('delete'),
  parameters: source(
    '<dialog aveConfirmDialog heading="Удалить договор ДК-2026/114?" action="Удалить договор"',
    '  [(open)]="asking" (confirm)="remove()">',
    '  Договор <b>ДК-2026/114</b> и его приложения будут удалены без возможности восстановления.',
    '</dialog>',
  ),
  play: async ({ canvasElement }) => {
    const opener = within(canvasElement).getByRole('button', { name: 'Удалить договор' });
    const dialog = await ask(canvasElement, 'Удалить договор');
    const confirm = within(canvasElement).getByRole('alertdialog', { name: 'Удалить договор ДК-2026/114?' });
    await expect(confirm).toBe(dialog);
    await expect(confirm).toHaveAccessibleDescription(
      'Договор ДК-2026/114 и его приложения будут удалены без возможности восстановления.',
    );
    // The number in bold is part of the sentence, on its first line (a line is 20px).
    const number = within(dialog).getByText('ДК-2026/114').getBoundingClientRect();
    const body = dialog.querySelector('.body')?.getBoundingClientRect();
    await expect(number.top - (body?.top ?? 0)).toBeLessThan(20);
    await waitFor(() => expect(within(dialog).getByRole('button', { name: 'Отмена' })).toHaveFocus());
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(dialog.open).toBe(false));
    await expect(within(canvasElement).getByRole('status')).toHaveTextContent('');
    await expect(opener).toHaveFocus();
    await ask(canvasElement, 'Удалить договор');
  },
};

/** An action that can be undone confirms with a primary button. */
export const Primary: Story = {
  render: frame('send'),
  play: async ({ canvasElement }) => {
    const dialog = await ask(canvasElement, 'Отправить на согласование');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Отправить на согласование' }));
    await waitFor(() => expect(dialog.open).toBe(false));
    await expect(within(canvasElement).getByRole('status')).toHaveTextContent('Договор отправлен.');
    await ask(canvasElement, 'Отправить на согласование');
  },
};

/** Long Uzbek text: the question wraps, and the buttons wrap under each other on a phone. */
export const LongText: Story = {
  name: 'Long text',
  render: frame('long'),
  play: async ({ canvasElement }) => {
    const dialog = await ask(canvasElement, 'Oʻchirish');
    const panel = dialog.querySelector('.panel');
    await expect(panel?.scrollWidth).toBe(panel?.clientWidth);
  },
};
