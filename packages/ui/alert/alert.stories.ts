import { Component, LOCALE_ID, input, signal } from '@angular/core';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, within } from 'storybook/test';
import { AveAlert, AveAlertActions, type AveAlertVariant } from '@avelune/ui/alert';
import { AveButton } from '@avelune/ui/button';

type View = 'default' | 'variants' | 'plain' | 'actions' | 'long';

const variants = [
  {
    variant: 'info',
    heading: 'Договор ждёт согласования',
    message: 'Юридический отдел ответит до конца рабочего дня.',
  },
  { variant: 'success', heading: 'Договор подписан', message: 'Экземпляр с подписями сохранён в приложениях.' },
  {
    variant: 'warning',
    heading: 'Срок действия истекает',
    message: 'Договор действует до 26.03.2026. Продлите его или подготовьте новый.',
  },
  {
    variant: 'danger',
    heading: 'Договор не отправлен',
    message: 'Сервер согласования не ответил. Проверьте подключение и отправьте договор ещё раз.',
  },
] as const satisfies readonly { variant: AveAlertVariant; heading: string; message: string }[];

/** The frame the stories draw alerts in. Styled with tokens only. */
@Component({
  selector: 'ave-alert-stories',
  imports: [AveAlert, AveAlertActions, AveButton],
  template: `
    @switch (view()) {
      @case ('variants') {
        @for (item of variants; track item.variant) {
          <ave-alert [variant]="item.variant" [heading]="item.heading" lang="ru">{{ item.message }}</ave-alert>
        }
      }
      @case ('plain') {
        <ave-alert lang="ru">Изменения сохраняются автоматически каждые две минуты.</ave-alert>
        <ave-alert variant="danger" lang="ru">Файл больше 20 МБ. Выберите файл поменьше.</ave-alert>
      }
      @case ('actions') {
        <ave-alert variant="danger" heading="Список контрагентов не загрузился" lang="ru">
          Сервер справочника не ответил за 30 секунд.
          <div aveAlertActions><button aveButton type="button" size="sm">Повторить</button></div>
        </ave-alert>
        <ave-alert variant="warning" lang="ru">
          ИНН контрагента не найден в реестре налоговой.
          <div aveAlertActions><a href="#counterparty">Открыть карточку контрагента</a></div>
        </ave-alert>
      }
      @case ('long') {
        <ave-alert
          variant="warning"
          heading="Oʻzbekiston Respublikasi Vazirlar Mahkamasining qarori bilan tasdiqlangan shakl"
          lang="uz-Latn"
        >
          Hujjat shakli 2026-yil 1-apreldan boshlab yangilanadi. Eski shakldagi shartnomalarni qayta rasmiylashtiring.
        </ave-alert>
        <ave-alert variant="info" lang="ru">
          Договоры, отправленные на согласование после 18:00, юридический отдел рассматривает на следующий рабочий день,
          а договоры с суммой больше одного миллиарда сумов дополнительно согласует финансовый директор.
        </ave-alert>
      }
      @default {
        <ave-alert variant="warning" heading="Контрагент не прошёл проверку" lang="ru">
          Налоговый номер не найден в реестре. <a href="#counterparty">Проверьте ИНН</a> или выберите другого
          контрагента.
        </ave-alert>
      }
    }
  `,
  styleUrl: './alert.stories.css',
})
class AlertStories {
  readonly view = input<View>('default');
  protected readonly variants = variants;
}

/** A form that fails to send: the alert appears above its actions, and is announced as it appears. */
@Component({
  selector: 'ave-alert-appearing',
  imports: [AveAlert, AveButton],
  template: `
    <div class="form" lang="ru">
      @if (failed()) {
        <ave-alert variant="danger" heading="Договор не отправлен">
          Сервер согласования не ответил. Отправьте договор ещё раз.
        </ave-alert>
      }
      <button aveButton type="button" variant="primary" (click)="failed.set(true)">Отправить на согласование</button>
    </div>
  `,
  styleUrl: './alert.stories.css',
})
class AlertAppearing {
  protected readonly failed = signal(false);
}

type Story = StoryObj<AlertStories>;

function frame(view: View): NonNullable<Story['render']> {
  return () => ({
    props: { view },
    template: `<ave-alert-stories [view]="view" />`,
    moduleMetadata: { imports: [AlertStories] },
  });
}

/** The kit's own words (the icons' kinds, Close) in the stories' language. */
function locale(value: string): ReturnType<typeof applicationConfig> {
  return applicationConfig({ providers: [{ provide: LOCALE_ID, useValue: value }] });
}

const meta: Meta<AlertStories> = {
  title: 'Components/Alert',
  component: AveAlert,
  decorators: [locale('ru')],
};
export default meta;

/** A warning about one field, with a heading and a link in its message. */
export const Default: Story = {
  render: frame('default'),
  parameters: {
    docs: {
      source: {
        code: `<ave-alert variant="warning" heading="Контрагент не прошёл проверку">
  Налоговый номер не найден в реестре. <a href="…">Проверьте ИНН</a> или выберите другого контрагента.
</ave-alert>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const alert = within(canvasElement).getByRole('alert');
    await expect(within(alert).getByRole('img', { name: 'Предупреждение' })).toBeVisible();
    const link = within(alert).getByRole('link', { name: 'Проверьте ИНН' });
    await expect(link).toBeVisible();
    // The link is part of the sentence: the words after it go on from the line it ends on.
    const after = document.createRange();
    after.selectNodeContents(link.nextSibling ?? link);
    await expect(Math.round(after.getClientRects()[0]?.top ?? 0)).toBe(
      Math.round([...link.getClientRects()].at(-1)?.top ?? -1),
    );
  },
};

/** Information, success, a warning and an error, each with its icon and fill. */
export const Variants: Story = {
  tags: ['forced-colors'],
  render: frame('variants'),
  parameters: {
    docs: {
      source: {
        code: `<ave-alert heading="Договор ждёт согласования">…</ave-alert>
<ave-alert variant="success" heading="Договор подписан">…</ave-alert>
<ave-alert variant="warning" heading="Срок действия истекает">…</ave-alert>
<ave-alert variant="danger" heading="Договор не отправлен">…</ave-alert>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole('status')).toHaveLength(2);
    await expect(canvas.getAllByRole('alert')).toHaveLength(2);
    for (const name of ['Информация', 'Успешно', 'Предупреждение', 'Ошибка']) {
      await expect(canvas.getByRole('img', { name })).toBeVisible();
    }
  },
};

/** Without a heading: the message alone, the icon level with its first line. */
export const WithoutHeading: Story = {
  name: 'Without heading',
  render: frame('plain'),
  parameters: {
    docs: {
      source: {
        code: `<ave-alert>Изменения сохраняются автоматически каждые две минуты.</ave-alert>
<ave-alert variant="danger">Файл больше 20 МБ. Выберите файл поменьше.</ave-alert>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    for (const alert of canvasElement.querySelectorAll('ave-alert')) {
      const icon = alert.querySelector('.icon')?.getBoundingClientRect();
      const message = alert.querySelector('.message')?.getBoundingClientRect();
      await expect(icon?.top).toBe(message?.top);
    }
  },
};

/** A message with a button to try again, and one that ends with a link. */
export const WithActions: Story = {
  name: 'With actions',
  render: frame('actions'),
  parameters: {
    docs: {
      source: {
        code: `<ave-alert variant="danger" heading="Список контрагентов не загрузился">
  Сервер справочника не ответил за 30 секунд.
  <div aveAlertActions><button aveButton type="button" size="sm" (click)="reload()">Повторить</button></div>
</ave-alert>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    // The actions have a row of their own, 8px under the message.
    const [first] = canvasElement.querySelectorAll('ave-alert');
    const message = first?.querySelector('.message')?.getBoundingClientRect();
    const actions = first?.querySelector('[aveAlertActions]')?.getBoundingClientRect();
    await expect(actions?.top).toBe((message?.bottom ?? 0) + 8);
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'Повторить' })).toHaveFocus();
    await userEvent.tab();
    await expect(canvas.getByRole('link', { name: 'Открыть карточку контрагента' })).toHaveFocus();
  },
};

/** Long Uzbek and Russian text wraps inside the box; the icon stays on the first line. */
export const LongText: Story = {
  name: 'Long text',
  render: frame('long'),
  parameters: {
    docs: {
      source: {
        code: `<ave-alert variant="warning" heading="Oʻzbekiston Respublikasi Vazirlar Mahkamasining qarori bilan tasdiqlangan shakl">
  Hujjat shakli 2026-yil 1-apreldan boshlab yangilanadi. Eski shakldagi shartnomalarni qayta rasmiylashtiring.
</ave-alert>
<ave-alert>
  Договоры, отправленные на согласование после 18:00, юридический отдел рассматривает на следующий рабочий день, …
</ave-alert>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    for (const alert of canvasElement.querySelectorAll('ave-alert')) {
      await expect(alert.scrollWidth).toBe(alert.clientWidth);
      await expect(alert.getBoundingClientRect().height % 4).toBe(0);
    }
  },
};

/** An alert that appears after an action is announced: a live region that interrupts. */
export const Appearing: Story = {
  render: () => ({ template: '<ave-alert-appearing />', moduleMetadata: { imports: [AlertAppearing] } }),
  parameters: {
    docs: {
      source: {
        code: `@if (failed()) {
  <ave-alert variant="danger" heading="Договор не отправлен">
    Сервер согласования не ответил. Отправьте договор ещё раз.
  </ave-alert>
}
<button aveButton type="button" variant="primary" (click)="send()">Отправить на согласование</button>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole('alert')).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: 'Отправить на согласование' }));
    await expect(canvas.getByRole('alert')).toHaveTextContent('Договор не отправлен');
    (document.activeElement as HTMLElement | null)?.blur();
  },
};
