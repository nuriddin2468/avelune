import { Component, LOCALE_ID, input, signal } from '@angular/core';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { AveButton } from '@avelune/ui/button';
import { AveDialog, AveDialogActions, type AveDialogSize } from '@avelune/ui/dialog';
import { AveFormField, AveHint } from '@avelune/ui/form-field';
import { AveInput } from '@avelune/ui/input';
import { AveTextarea } from '@avelune/ui/textarea';

type View = 'form' | 'long' | 'text';

/** The frame the stories draw dialogs in: a page with the button that opens one. Styled with tokens only. */
@Component({
  selector: 'ave-dialog-stories',
  imports: [AveButton, AveDialog, AveDialogActions, AveFormField, AveHint, AveInput, AveTextarea],
  template: `
    <div class="page" lang="ru">
      <p class="muted">Карточка контрагента ООО «Альфа Технологии».</p>
      <button aveButton type="button" (click)="open.set(true)">{{ opener() }}</button>
    </div>
    @switch (view()) {
      @case ('long') {
        <dialog aveDialog heading="Условия договора" [size]="size()" [(open)]="open" lang="ru">
          @for (section of sections; track section) {
            <p>
              {{ section }}. Стороны обязуются исполнять условия настоящего договора добросовестно, в сроки и в объёме,
              установленные спецификацией, и уведомлять друг друга о любых обстоятельствах, препятствующих исполнению.
            </p>
          }
          <div aveDialogActions>
            <button aveButton type="button" (click)="open.set(false)">Закрыть</button>
            <button aveButton type="button" variant="primary" (click)="open.set(false)">Принять условия</button>
          </div>
        </dialog>
      }
      @case ('text') {
        <dialog
          aveDialog
          size="sm"
          heading="Oʻzbekiston Respublikasi Vazirlar Mahkamasining qarorini kelishuvchilarga yuborish"
          [(open)]="open"
          lang="uz-Latn"
        >
          <p>Qaror barcha boʻlim boshliqlariga yuboriladi; har biri besh ish kuni ichida javob berishi kerak.</p>
          <div aveDialogActions>
            <button aveButton type="button" (click)="open.set(false)">Bekor qilish</button>
            <button aveButton type="button" variant="primary" (click)="open.set(false)">Kelishuvga yuborish</button>
          </div>
        </dialog>
      }
      @default {
        <dialog aveDialog heading="Изменить контрагента" [size]="size()" [(open)]="open" lang="ru">
          <form class="fields" id="counterparty" (submit)="save($event)">
            <ave-form-field label="Название">
              <input aveInput type="text" value="ООО «Альфа Технологии»" />
            </ave-form-field>
            <ave-form-field label="ИНН">
              <input aveInput type="text" inputmode="numeric" value="305112845" />
              <p aveHint>Девять цифр, без пробелов.</p>
            </ave-form-field>
            <ave-form-field label="Примечание">
              <textarea aveTextarea rows="3"></textarea>
            </ave-form-field>
          </form>
          <div aveDialogActions>
            <button aveButton type="button" (click)="open.set(false)">Отмена</button>
            <button aveButton type="submit" variant="primary" form="counterparty">Сохранить изменения</button>
          </div>
        </dialog>
      }
    }
  `,
  styleUrl: './dialog.stories.css',
})
class DialogStories {
  readonly view = input<View>('form');
  readonly size = input<AveDialogSize>('md');
  readonly opener = input('Изменить');
  protected readonly open = signal(false);
  protected readonly sections = [
    '1. Предмет',
    '2. Сроки',
    '3. Цена',
    '4. Порядок оплаты',
    '5. Поставка',
    '6. Приёмка',
    '7. Гарантии',
    '8. Качество',
    '9. Ответственность',
    '10. Форс-мажор',
    '11. Конфиденциальность',
    '12. Споры',
    '13. Изменения',
    '14. Срок действия',
  ];

  protected save(event: Event): void {
    event.preventDefault();
    this.open.set(false);
  }
}

type Story = StoryObj<DialogStories>;

function frame(view: View, size: AveDialogSize = 'md', opener = 'Изменить'): NonNullable<Story['render']> {
  return () => ({
    props: { view, size, opener },
    template: `<ave-dialog-stories [view]="view" [size]="size" [opener]="opener" />`,
    moduleMetadata: { imports: [DialogStories] },
  });
}

/** Opens the story's dialog with its button and waits until it shows. */
async function openDialog(canvasElement: HTMLElement, opener: string): Promise<HTMLDialogElement> {
  await userEvent.click(within(canvasElement).getByRole('button', { name: opener }));
  const dialog = canvasElement.querySelector('dialog');
  if (dialog === null) throw new Error('No dialog');
  await waitFor(() => expect(dialog.open).toBe(true));
  return dialog;
}

const meta: Meta<DialogStories> = {
  title: 'Components/Dialog',
  component: AveDialog,
  decorators: [applicationConfig({ providers: [{ provide: LOCALE_ID, useValue: 'ru' }] })],
};
export default meta;

/** A short form in a dialog: focus goes to its first field, and returns to the button when it closes. */
export const Default: Story = {
  render: frame('form'),
  parameters: {
    docs: {
      source: {
        code: `<dialog aveDialog heading="Изменить контрагента" [(open)]="editing">
  <form id="counterparty" (submit)="save($event)">
    <ave-form-field label="Название">
      <input aveInput type="text" value="ООО «Альфа Технологии»" />
    </ave-form-field>
    <ave-form-field label="ИНН">
      <input aveInput type="text" inputmode="numeric" value="305112845" />
      <p aveHint>Девять цифр, без пробелов.</p>
    </ave-form-field>
    <ave-form-field label="Примечание">
      <textarea aveTextarea rows="3"></textarea>
    </ave-form-field>
  </form>
  <div aveDialogActions>
    <button aveButton type="button" (click)="editing.set(false)">Отмена</button>
    <button aveButton type="submit" variant="primary" form="counterparty">Сохранить изменения</button>
  </div>
</dialog>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const opener = within(canvasElement).getByRole('button', { name: 'Изменить' });
    const dialog = await openDialog(canvasElement, 'Изменить');
    await expect(within(canvasElement).getByRole('dialog', { name: 'Изменить контрагента' })).toBe(dialog);
    await waitFor(() => expect(within(dialog).getByRole('textbox', { name: 'Название' })).toHaveFocus());
    // A story's keys are synthetic and do not reach the browser's Escape; the close button closes it as Escape does.
    await userEvent.click(within(dialog).getByRole('button', { name: 'Закрыть' }));
    await waitFor(() => expect(dialog.open).toBe(false));
    await expect(opener).toHaveFocus();
    await openDialog(canvasElement, 'Изменить');
  },
};

/** A small dialog, 480px at most. */
export const Small: Story = {
  render: frame('form', 'sm'),
  parameters: {
    docs: {
      source: {
        code: `<dialog aveDialog size="sm" heading="Изменить контрагента" [(open)]="editing">
  <form id="counterparty" (submit)="save($event)">
    <ave-form-field label="Название">
      <input aveInput type="text" value="ООО «Альфа Технологии»" />
    </ave-form-field>
    <ave-form-field label="ИНН">
      <input aveInput type="text" inputmode="numeric" value="305112845" />
      <p aveHint>Девять цифр, без пробелов.</p>
    </ave-form-field>
    <ave-form-field label="Примечание">
      <textarea aveTextarea rows="3"></textarea>
    </ave-form-field>
  </form>
  <div aveDialogActions>
    <button aveButton type="button" (click)="editing.set(false)">Отмена</button>
    <button aveButton type="submit" variant="primary" form="counterparty">Сохранить изменения</button>
  </div>
</dialog>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const dialog = await openDialog(canvasElement, 'Изменить');
    await expect(dialog.querySelector('.panel')?.getBoundingClientRect().width).toBeLessThanOrEqual(480);
  },
};

/** Long content scrolls between the heading and the actions, which stay in view; the body can take focus. */
export const LongContent: Story = {
  name: 'Long content',
  render: frame('long', 'md', 'Условия'),
  parameters: {
    docs: {
      source: {
        code: `<dialog aveDialog heading="Условия договора" [(open)]="reading">
  <p>1. Предмет. Стороны обязуются исполнять условия настоящего договора добросовестно, в сроки и в объёме, установленные спецификацией, и уведомлять друг друга о любых обстоятельствах, препятствующих исполнению.</p>
  <p>2. Сроки. Стороны обязуются исполнять условия настоящего договора добросовестно, в сроки и в объёме, установленные спецификацией, и уведомлять друг друга о любых обстоятельствах, препятствующих исполнению.</p>
  <p>3. Цена. Стороны обязуются исполнять условия настоящего договора добросовестно, в сроки и в объёме, установленные спецификацией, и уведомлять друг друга о любых обстоятельствах, препятствующих исполнению.</p>
  <p>4. Порядок оплаты. Стороны обязуются исполнять условия настоящего договора добросовестно, в сроки и в объёме, установленные спецификацией, и уведомлять друг друга о любых обстоятельствах, препятствующих исполнению.</p>
  <p>5. Поставка. Стороны обязуются исполнять условия настоящего договора добросовестно, в сроки и в объёме, установленные спецификацией, и уведомлять друг друга о любых обстоятельствах, препятствующих исполнению.</p>
  <p>6. Приёмка. Стороны обязуются исполнять условия настоящего договора добросовестно, в сроки и в объёме, установленные спецификацией, и уведомлять друг друга о любых обстоятельствах, препятствующих исполнению.</p>
  <p>7. Гарантии. Стороны обязуются исполнять условия настоящего договора добросовестно, в сроки и в объёме, установленные спецификацией, и уведомлять друг друга о любых обстоятельствах, препятствующих исполнению.</p>
  <p>8. Качество. Стороны обязуются исполнять условия настоящего договора добросовестно, в сроки и в объёме, установленные спецификацией, и уведомлять друг друга о любых обстоятельствах, препятствующих исполнению.</p>
  <p>9. Ответственность. Стороны обязуются исполнять условия настоящего договора добросовестно, в сроки и в объёме, установленные спецификацией, и уведомлять друг друга о любых обстоятельствах, препятствующих исполнению.</p>
  <p>10. Форс-мажор. Стороны обязуются исполнять условия настоящего договора добросовестно, в сроки и в объёме, установленные спецификацией, и уведомлять друг друга о любых обстоятельствах, препятствующих исполнению.</p>
  <p>11. Конфиденциальность. Стороны обязуются исполнять условия настоящего договора добросовестно, в сроки и в объёме, установленные спецификацией, и уведомлять друг друга о любых обстоятельствах, препятствующих исполнению.</p>
  <p>12. Споры. Стороны обязуются исполнять условия настоящего договора добросовестно, в сроки и в объёме, установленные спецификацией, и уведомлять друг друга о любых обстоятельствах, препятствующих исполнению.</p>
  <p>13. Изменения. Стороны обязуются исполнять условия настоящего договора добросовестно, в сроки и в объёме, установленные спецификацией, и уведомлять друг друга о любых обстоятельствах, препятствующих исполнению.</p>
  <p>14. Срок действия. Стороны обязуются исполнять условия настоящего договора добросовестно, в сроки и в объёме, установленные спецификацией, и уведомлять друг друга о любых обстоятельствах, препятствующих исполнению.</p>
  <div aveDialogActions>
    <button aveButton type="button" (click)="reading.set(false)">Закрыть</button>
    <button aveButton type="button" variant="primary" (click)="accept()">Принять условия</button>
  </div>
</dialog>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const dialog = await openDialog(canvasElement, 'Условия');
    const body = dialog.querySelector('.body');
    await expect((body?.scrollHeight ?? 0) > (body?.clientHeight ?? 0)).toBe(true);
    // It scrolls, so it takes keyboard focus to be scrolled.
    await waitFor(() => expect(body).toHaveAttribute('tabindex', '0'));
    const actions = dialog.querySelector('[aveDialogActions]')?.getBoundingClientRect();
    await expect((actions?.bottom ?? 0) <= window.innerHeight).toBe(true);
  },
};

/** A long Uzbek heading wraps beside the close button; nothing truncates. */
export const LongText: Story = {
  name: 'Long text',
  render: frame('text', 'sm', 'Yuborish'),
  parameters: {
    docs: {
      source: {
        code: `<dialog aveDialog size="sm" heading="Oʻzbekiston Respublikasi Vazirlar Mahkamasining qarorini kelishuvchilarga yuborish"
  [(open)]="sending">
  <p>Qaror barcha boʻlim boshliqlariga yuboriladi; har biri besh ish kuni ichida javob berishi kerak.</p>
  <div aveDialogActions>
    <button aveButton type="button" (click)="sending.set(false)">Bekor qilish</button>
    <button aveButton type="button" variant="primary" (click)="send()">Kelishuvga yuborish</button>
  </div>
</dialog>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const dialog = await openDialog(canvasElement, 'Yuborish');
    const heading = dialog.querySelector('.heading');
    await expect((heading?.getBoundingClientRect().height ?? 0) > 28).toBe(true);
    await expect(heading?.scrollWidth).toBe(heading?.clientWidth);
  },
};
