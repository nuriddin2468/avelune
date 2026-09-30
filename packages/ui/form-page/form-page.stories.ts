import { Component, LOCALE_ID, input, signal } from '@angular/core';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, within } from 'storybook/test';
import { lucideCircleCheck } from '@avelune/icons/lucide';
import { AveButton } from '@avelune/ui/button';
import { AveCheckbox, AveChoice } from '@avelune/ui/checkbox';
import { AveChoiceGroup, AveFormField, AveHint } from '@avelune/ui/form-field';
import { AveFormPage, AveFormPageActions, AveFormPageActionsStart } from '@avelune/ui/form-page';
import { AveIcon, provideAveIcons } from '@avelune/ui/icon';
import { AveInput } from '@avelune/ui/input';
import { AveRadio } from '@avelune/ui/radio';
import { AveTextarea } from '@avelune/ui/textarea';

type View = 'default' | 'short' | 'long';

/** The frame the stories draw form pages in: a new contract, as an application writes it. Styled with tokens only. */
@Component({
  selector: 'ave-form-page-stories',
  imports: [
    AveButton,
    AveCheckbox,
    AveChoice,
    AveChoiceGroup,
    AveFormField,
    AveFormPage,
    AveFormPageActions,
    AveFormPageActionsStart,
    AveHint,
    AveIcon,
    AveInput,
    AveRadio,
    AveTextarea,
  ],
  providers: [provideAveIcons([lucideCircleCheck])],
  template: `
    @switch (view()) {
      @case ('short') {
        <form aveFormPage heading="Новый контрагент" lang="ru" novalidate (submit)="$event.preventDefault()">
          <div class="fields">
            <ave-form-field label="Название организации"><input aveInput type="text" /></ave-form-field>
            <ave-form-field label="ИНН"><input aveInput type="text" inputmode="numeric" /></ave-form-field>
          </div>
          <div aveFormPageActions>
            <button aveButton type="button">Отмена</button>
            <button aveButton type="submit" variant="primary">Добавить контрагента</button>
          </div>
        </form>
      }
      @case ('long') {
        <form
          aveFormPage
          heading="Yangi shartnomani roʻyxatdan oʻtkazish"
          description="* — majburiy maydonlar"
          lang="uz-Latn"
          novalidate
          (submit)="$event.preventDefault()"
        >
          <div class="fields">
            <ave-form-field label="Oʻzbekiston Respublikasi hududidagi yetkazib berish manzili">
              <input aveInput type="text" />
            </ave-form-field>
            <ave-form-field label="Shartnoma raqami"><input aveInput type="text" /></ave-form-field>
          </div>
          <div aveFormPageActions>
            <button aveButton aveFormPageActionsStart type="button" variant="ghost">Qoralama sifatida saqlash</button>
            <button aveButton type="button">Bekor qilish</button>
            <button aveButton type="submit" variant="primary">Kelishuvga yuborish</button>
          </div>
        </form>
      }
      @default {
        <form
          aveFormPage
          heading="Новый договор"
          description="* — обязательные поля"
          lang="ru"
          novalidate
          (submit)="$event.preventDefault()"
        >
          <div class="fields">
            <ave-form-field label="Номер договора">
              <input aveInput type="text" required />
              <p aveHint>Как в подписанном экземпляре, например ДК-2026/114.</p>
            </ave-form-field>
            <ave-form-field label="Контрагент"><input aveInput type="text" required /></ave-form-field>
            <ave-form-field label="Дата подписания"><input aveInput type="text" /></ave-form-field>
            <ave-form-field label="Сумма договора, сум"
              ><input aveInput type="text" inputmode="decimal"
            /></ave-form-field>
            <ave-form-field class="wide" label="Предмет договора">
              <textarea aveTextarea rows="4"></textarea>
              <p aveHint>Кратко: что поставляется или выполняется, куда и в какие сроки.</p>
            </ave-form-field>
            <ave-form-field label="Почта для уведомлений"><input aveInput type="email" /></ave-form-field>
            <ave-form-field label="Телефон контрагента"><input aveInput type="tel" /></ave-form-field>
          </div>
          <fieldset aveChoiceGroup legend="Форма подписания">
            <label aveChoice
              ><input type="radio" aveRadio name="signing" value="digital" checked /> Электронная подпись</label
            >
            <label aveChoice><input type="radio" aveRadio name="signing" value="paper" /> На бумаге</label>
          </fieldset>
          <fieldset aveChoiceGroup legend="Перед отправкой">
            <label aveChoice>
              <input type="checkbox" aveCheckbox />
              Подтверждаю, что данные договора сверены с подписанным экземпляром
            </label>
          </fieldset>
          <div aveFormPageActions>
            <button aveButton aveFormPageActionsStart type="button" variant="ghost" (click)="saved.set(true)">
              Сохранить черновик
            </button>
            <p aveFormPageActionsStart class="status" role="status">
              @if (saved()) {
                <ave-icon name="circle-check" decorative />
                Черновик сохранён.
              }
            </p>
            <button aveButton type="button">Отмена</button>
            <button aveButton type="submit" variant="primary">Отправить на согласование</button>
          </div>
        </form>
      }
    }
  `,
  styleUrl: './form-page.stories.css',
})
class FormPageStories {
  readonly view = input<View>('default');
  protected readonly saved = signal(false);
}

type Story = StoryObj<FormPageStories>;

function frame(view: View): NonNullable<Story['render']> {
  return () => ({
    props: { view },
    template: `<ave-form-page-stories [view]="view" />`,
    moduleMetadata: { imports: [FormPageStories] },
  });
}

/** The document's scroll padding at the bottom, which keeps a focused field above the bar: its one row. */
async function padded(): Promise<void> {
  const root = document.documentElement;
  const control = Number.parseFloat(getComputedStyle(root).getPropertyValue('--ave-control-height-md'));
  await expect(getComputedStyle(root).scrollPaddingBlockEnd).toBe(`${String(control + 12 * 2 + 1)}px`);
}

const meta: Meta<FormPageStories> = {
  title: 'Patterns/Form page',
  component: AveFormPage,
  decorators: [applicationConfig({ providers: [{ provide: LOCALE_ID, useValue: 'ru' }] })],
};
export default meta;

/** A new contract: the heading, two columns of fields, the choices, and the actions in a bar at the form's end. */
export const Default: Story = {
  tags: ['forced-colors'],
  render: frame('default'),
  parameters: {
    docs: {
      source: {
        code: `<form aveFormPage heading="Новый договор" description="* — обязательные поля" novalidate (submit)="send($event)">
  <div class="fields">
    <ave-form-field label="Номер договора"><input aveInput type="text" [formField]="contract.number" /></ave-form-field>
    …
  </div>
  <fieldset aveChoiceGroup legend="Форма подписания">…</fieldset>
  <div aveFormPageActions>
    <button aveButton aveFormPageActionsStart type="button" variant="ghost" (click)="saveDraft()">Сохранить черновик</button>
    <p aveFormPageActionsStart role="status">{{ status() }}</p>
    <button aveButton type="button" (click)="cancel()">Отмена</button>
    <button aveButton type="submit" variant="primary">Отправить на согласование</button>
  </div>
</form>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('form', { name: 'Новый договор' })).toBeVisible();
    const bar = canvasElement.querySelector('[aveFormPageActions]');
    await expect(bar ? getComputedStyle(bar).position : '').toBe('sticky');
    await padded();
    const send = canvas.getByRole('button', { name: 'Отправить на согласование' });
    const cancel = canvas.getByRole('button', { name: 'Отмена' });
    await expect(send.getBoundingClientRect().left).toBeGreaterThan(cancel.getBoundingClientRect().left);
  },
};

/** A form shorter than the window: the bar rests under its fields. */
export const Short: Story = {
  name: 'Short form',
  render: frame('short'),
  parameters: {
    docs: {
      source: {
        code: `<form aveFormPage heading="Новый контрагент" novalidate (submit)="add($event)">
  <div class="fields">…</div>
  <div aveFormPageActions>
    <button aveButton type="button">Отмена</button>
    <button aveButton type="submit" variant="primary">Добавить контрагента</button>
  </div>
</form>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const bar = canvasElement.querySelector('[aveFormPageActions]');
    const fields = canvasElement.querySelector('.fields');
    await expect((bar?.getBoundingClientRect().top ?? 0) - (fields?.getBoundingClientRect().bottom ?? 0)).toBe(24);
  },
};

/** The draft saved: the status says so at the bar's start, beside the action that saved it. */
export const Status: Story = {
  render: frame('default'),
  parameters: {
    docs: {
      source: {
        code: `<div aveFormPageActions>
  <button aveButton aveFormPageActionsStart type="button" variant="ghost" (click)="saveDraft()">Сохранить черновик</button>
  <p aveFormPageActionsStart role="status">Черновик сохранён.</p>
  …
</div>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Сохранить черновик' }));
    await expect(canvas.getByRole('status')).toHaveTextContent('Черновик сохранён.');
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

/** Long Uzbek labels and actions wrap; the bar's rows wrap; nothing scrolls sideways. */
export const LongText: Story = {
  name: 'Long text',
  render: frame('long'),
  parameters: {
    docs: {
      source: {
        code: `<form aveFormPage heading="Yangi shartnomani roʻyxatdan oʻtkazish" description="* — majburiy maydonlar" lang="uz-Latn" novalidate>
  …
  <div aveFormPageActions>
    <button aveButton aveFormPageActionsStart type="button" variant="ghost">Qoralama sifatida saqlash</button>
    <button aveButton type="button">Bekor qilish</button>
    <button aveButton type="submit" variant="primary">Kelishuvga yuborish</button>
  </div>
</form>`,
        language: 'html',
      },
    },
  },
  play: async () => {
    await expect(document.documentElement.scrollWidth).toBe(document.documentElement.clientWidth);
    await padded();
  },
};
