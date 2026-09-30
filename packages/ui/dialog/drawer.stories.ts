import { Component, LOCALE_ID, input, signal } from '@angular/core';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { AveButton } from '@avelune/ui/button';
import { AveDialogActions, AveDrawer, type AveDrawerSide, type AveDrawerSize } from '@avelune/ui/dialog';
import { AveFormField } from '@avelune/ui/form-field';
import { AveInput } from '@avelune/ui/input';

type View = 'details' | 'form' | 'long';

/** The frame the stories draw drawers in: a list with the button that opens one. Styled with tokens only. */
@Component({
  selector: 'ave-drawer-stories',
  imports: [AveButton, AveDialogActions, AveDrawer, AveFormField, AveInput],
  template: `
    <div class="page" lang="ru">
      <p class="muted">Договоры подразделения.</p>
      <button aveButton type="button" (click)="open.set(true)">{{ opener() }}</button>
    </div>
    @switch (view()) {
      @case ('form') {
        <dialog aveDrawer heading="Новый контрагент" [side]="side()" [size]="size()" [(open)]="open" lang="ru">
          <form class="fields" id="counterparty" (submit)="save($event)">
            <ave-form-field label="Название"><input aveInput type="text" /></ave-form-field>
            <ave-form-field label="ИНН"><input aveInput type="text" inputmode="numeric" /></ave-form-field>
            <ave-form-field label="Город"><input aveInput type="text" /></ave-form-field>
          </form>
          <div aveDialogActions>
            <button aveButton type="button" (click)="open.set(false)">Отмена</button>
            <button aveButton type="submit" variant="primary" form="counterparty">Добавить контрагента</button>
          </div>
        </dialog>
      }
      @case ('long') {
        <dialog
          aveDrawer
          heading="Samarqand viloyati sogʻliqni saqlash boshqarmasi bilan tuzilgan shartnoma"
          [(open)]="open"
          lang="uz-Latn"
        >
          @for (line of lines; track line) {
            <p>{{ line }}. Shartnoma shartlari tomonlar tomonidan belgilangan muddatlarda bajariladi.</p>
          }
          <div aveDialogActions>
            <button aveButton type="button" variant="primary" (click)="open.set(false)">Yopish</button>
          </div>
        </dialog>
      }
      @default {
        <dialog aveDrawer heading="Договор ДК-2026/114" [side]="side()" [size]="size()" [(open)]="open" lang="ru">
          <dl class="facts">
            <dt>Предмет</dt>
            <dd>Поставка серверного оборудования для центра обработки данных</dd>
            <dt>Контрагент</dt>
            <dd>ООО «Альфа Технологии»</dd>
            <dt>Сумма</dt>
            <dd>1 250 000 000 сум</dd>
            <dt>Срок действия</dt>
            <dd>до 31.12.2026</dd>
          </dl>
          <div aveDialogActions>
            <button aveButton type="button" variant="primary" (click)="open.set(false)">Изменить договор</button>
          </div>
        </dialog>
      }
    }
  `,
  styleUrl: './dialog.stories.css',
})
class DrawerStories {
  readonly view = input<View>('details');
  readonly side = input<AveDrawerSide>('end');
  readonly size = input<AveDrawerSize>('md');
  readonly opener = input('Открыть договор');
  protected readonly open = signal(false);
  protected readonly lines = Array.from({ length: 24 }, (_, index) => `${String(index + 1)}-band`);

  protected save(event: Event): void {
    event.preventDefault();
    this.open.set(false);
  }
}

type Story = StoryObj<DrawerStories>;

function frame(
  view: View,
  options: { side?: AveDrawerSide; size?: AveDrawerSize; opener?: string } = {},
): NonNullable<Story['render']> {
  return () => ({
    props: {
      view,
      side: options.side ?? 'end',
      size: options.size ?? 'md',
      opener: options.opener ?? 'Открыть договор',
    },
    template: `<ave-drawer-stories [view]="view" [side]="side" [size]="size" [opener]="opener" />`,
    moduleMetadata: { imports: [DrawerStories] },
  });
}

/** Opens the story's drawer with its button and waits until it shows. */
async function openDrawer(canvasElement: HTMLElement, opener: string): Promise<HTMLDialogElement> {
  await userEvent.click(within(canvasElement).getByRole('button', { name: opener }));
  const drawer = canvasElement.querySelector('dialog');
  if (drawer === null) throw new Error('No drawer');
  await waitFor(() => expect(drawer.open).toBe(true));
  return drawer;
}

const meta: Meta<DrawerStories> = {
  title: 'Components/Drawer',
  component: AveDrawer,
  decorators: [applicationConfig({ providers: [{ provide: LOCALE_ID, useValue: 'ru' }] })],
};
export default meta;

/** A contract's details beside the list: the drawer takes the inline end, the full height. */
export const Default: Story = {
  render: frame('details'),
  parameters: {
    docs: {
      source: {
        code: `<dialog aveDrawer heading="Договор ДК-2026/114" [(open)]="viewing">
  <dl>
    <dt>Предмет</dt>
    <dd>Поставка серверного оборудования для центра обработки данных</dd>
    <dt>Контрагент</dt>
    <dd>ООО «Альфа Технологии»</dd>
    <dt>Сумма</dt>
    <dd>1 250 000 000 сум</dd>
    <dt>Срок действия</dt>
    <dd>до 31.12.2026</dd>
  </dl>
  <div aveDialogActions>
    <button aveButton type="button" variant="primary" (click)="viewing.set(false)">Изменить договор</button>
  </div>
</dialog>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const opener = within(canvasElement).getByRole('button', { name: 'Открыть договор' });
    const drawer = await openDrawer(canvasElement, 'Открыть договор');
    await expect(within(canvasElement).getByRole('dialog', { name: 'Договор ДК-2026/114' })).toBe(drawer);
    // At the slide's first frame the panel is still beyond the inline end, and the dialog has not scrolled to it: the
    // panel slides in rather than standing at its place (ADR 0067, addendum).
    const slide = drawer.querySelector('.panel')?.getAnimations()[0];
    slide?.pause();
    if (slide !== undefined) slide.currentTime = 0;
    await expect(drawer.scrollLeft).toBe(0);
    slide?.play();
    await userEvent.click(within(drawer).getByRole('button', { name: 'Закрыть' }));
    await waitFor(() => expect(drawer.open).toBe(false));
    await expect(opener).toHaveFocus();
    await openDrawer(canvasElement, 'Открыть договор');
  },
};

/** A form in a drawer from the start edge, the small width: focus goes to its first field. */
export const FormFromStart: Story = {
  name: 'Form from the start',
  render: frame('form', { side: 'start', size: 'sm', opener: 'Новый контрагент' }),
  parameters: {
    docs: {
      source: {
        code: `<button aveButton type="button" (click)="adding.set(true)">Новый контрагент</button>
<dialog aveDrawer heading="Новый контрагент" side="start" size="sm" [(open)]="adding">
  <form id="counterparty" (submit)="save($event)">
    <ave-form-field label="Название"><input aveInput type="text" /></ave-form-field>
    <ave-form-field label="ИНН"><input aveInput type="text" inputmode="numeric" /></ave-form-field>
    <ave-form-field label="Город"><input aveInput type="text" /></ave-form-field>
  </form>
  <div aveDialogActions>
    <button aveButton type="button" (click)="adding.set(false)">Отмена</button>
    <button aveButton type="submit" variant="primary" form="counterparty">Добавить контрагента</button>
  </div>
</dialog>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const drawer = await openDrawer(canvasElement, 'Новый контрагент');
    await waitFor(() => expect(within(drawer).getByRole('textbox', { name: 'Название' })).toHaveFocus());
    // Once it has slid in.
    await waitFor(() => expect(drawer.querySelector('.panel')?.getBoundingClientRect().left).toBe(0));
  },
};

/** Long content scrolls; the heading and the actions stay in view. */
export const LongContent: Story = {
  name: 'Long content',
  render: frame('long', { opener: 'Shartnomani ochish' }),
  parameters: {
    docs: {
      source: {
        code: `<button aveButton type="button" (click)="reading.set(true)">Shartnomani ochish</button>
<dialog aveDrawer heading="Samarqand viloyati sogʻliqni saqlash boshqarmasi bilan tuzilgan shartnoma"
  [(open)]="reading">
  <p>1-band. Shartnoma shartlari tomonlar tomonidan belgilangan muddatlarda bajariladi.</p>
  <p>2-band. Shartnoma shartlari tomonlar tomonidan belgilangan muddatlarda bajariladi.</p>
  <p>3-band. Shartnoma shartlari tomonlar tomonidan belgilangan muddatlarda bajariladi.</p>
  <p>4-band. Shartnoma shartlari tomonlar tomonidan belgilangan muddatlarda bajariladi.</p>
  <p>5-band. Shartnoma shartlari tomonlar tomonidan belgilangan muddatlarda bajariladi.</p>
  <p>6-band. Shartnoma shartlari tomonlar tomonidan belgilangan muddatlarda bajariladi.</p>
  <p>7-band. Shartnoma shartlari tomonlar tomonidan belgilangan muddatlarda bajariladi.</p>
  <p>8-band. Shartnoma shartlari tomonlar tomonidan belgilangan muddatlarda bajariladi.</p>
  <p>9-band. Shartnoma shartlari tomonlar tomonidan belgilangan muddatlarda bajariladi.</p>
  <p>10-band. Shartnoma shartlari tomonlar tomonidan belgilangan muddatlarda bajariladi.</p>
  <p>11-band. Shartnoma shartlari tomonlar tomonidan belgilangan muddatlarda bajariladi.</p>
  <p>12-band. Shartnoma shartlari tomonlar tomonidan belgilangan muddatlarda bajariladi.</p>
  <p>13-band. Shartnoma shartlari tomonlar tomonidan belgilangan muddatlarda bajariladi.</p>
  <p>14-band. Shartnoma shartlari tomonlar tomonidan belgilangan muddatlarda bajariladi.</p>
  <p>15-band. Shartnoma shartlari tomonlar tomonidan belgilangan muddatlarda bajariladi.</p>
  <p>16-band. Shartnoma shartlari tomonlar tomonidan belgilangan muddatlarda bajariladi.</p>
  <p>17-band. Shartnoma shartlari tomonlar tomonidan belgilangan muddatlarda bajariladi.</p>
  <p>18-band. Shartnoma shartlari tomonlar tomonidan belgilangan muddatlarda bajariladi.</p>
  <p>19-band. Shartnoma shartlari tomonlar tomonidan belgilangan muddatlarda bajariladi.</p>
  <p>20-band. Shartnoma shartlari tomonlar tomonidan belgilangan muddatlarda bajariladi.</p>
  <p>21-band. Shartnoma shartlari tomonlar tomonidan belgilangan muddatlarda bajariladi.</p>
  <p>22-band. Shartnoma shartlari tomonlar tomonidan belgilangan muddatlarda bajariladi.</p>
  <p>23-band. Shartnoma shartlari tomonlar tomonidan belgilangan muddatlarda bajariladi.</p>
  <p>24-band. Shartnoma shartlari tomonlar tomonidan belgilangan muddatlarda bajariladi.</p>
  <div aveDialogActions>
    <button aveButton type="button" variant="primary" (click)="reading.set(false)">Yopish</button>
  </div>
</dialog>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const drawer = await openDrawer(canvasElement, 'Shartnomani ochish');
    const body = drawer.querySelector('.body');
    await waitFor(() => expect(body).toHaveAttribute('tabindex', '0'));
    const actions = drawer.querySelector('[aveDialogActions]')?.getBoundingClientRect();
    await expect(Math.round(actions?.bottom ?? 0)).toBe(window.innerHeight);
  },
};
