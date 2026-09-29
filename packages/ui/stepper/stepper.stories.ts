import { Component, LOCALE_ID, input, signal } from '@angular/core';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, within } from 'storybook/test';
import { AveStepper, type AveStep } from '@avelune/ui/stepper';

type View = 'default' | 'route' | 'long';

const wizard: readonly AveStep[] = [
  { label: 'Стороны', description: 'Контрагент и подписанты' },
  { label: 'Условия', description: 'Сумма, сроки, оплата' },
  { label: 'Файлы', description: 'Договор и приложения' },
  { label: 'Проверка' },
];

const route: readonly AveStep[] = [
  { label: 'Юридический отдел', description: 'Согласовано 18.09.2026' },
  { label: 'Финансовый отдел', description: 'Вернул на доработку: нет графика платежей', error: true },
  { label: 'Служба безопасности', description: 'Ожидает' },
  { label: 'Директор', description: 'Подпись' },
];

const long: readonly AveStep[] = [
  { label: 'Hujjat taqdim etuvchi tashkilot maʼlumotlari' },
  { label: 'Oʻzbekiston Respublikasi vazirliklari bilan kelishish' },
  { label: 'Согласование с территориальными подразделениями министерства' },
];

/** The frame the stories draw steppers in: the top of a form, or a contract's approval. Styled with tokens only. */
@Component({
  selector: 'ave-stepper-stories',
  imports: [AveStepper],
  template: `
    @switch (view()) {
      @case ('route') {
        <section class="panel" aria-label="Согласование">
          <ave-stepper label="Маршрут согласования" orientation="vertical" [steps]="route" [current]="1" />
        </section>
      }
      @case ('long') {
        <ave-stepper label="Kelishish bosqichlari" lang="uz-Latn" [steps]="long" [current]="1" />
      }
      @default {
        <ave-stepper
          label="Оформление договора"
          selectable
          [steps]="wizard"
          [current]="current()"
          (stepSelected)="current.set($event)"
        />
        <p class="status" role="status">Шаг {{ current() + 1 }} из {{ wizard.length }}</p>
      }
    }
  `,
  styleUrl: './stepper.stories.css',
})
class StepperStories {
  readonly view = input<View>('default');
  protected readonly wizard = wizard;
  protected readonly route = route;
  protected readonly long = long;
  protected readonly current = signal(2);
}

type Story = StoryObj<StepperStories>;

function frame(view: View): NonNullable<Story['render']> {
  return () => ({
    props: { view },
    template: `<ave-stepper-stories [view]="view" />`,
    moduleMetadata: { imports: [StepperStories] },
  });
}

function source(...lines: readonly string[]): NonNullable<Story['parameters']> {
  return { docs: { source: { code: lines.join('\n'), language: 'html' } } };
}

const meta: Meta<StepperStories> = {
  title: 'Components/Stepper',
  component: StepperStories,
  decorators: [applicationConfig({ providers: [{ provide: LOCALE_ID, useValue: 'ru' }] })],
};
export default meta;

/** A form's steps: two done, the third current; a done step is a way back. */
export const Default: Story = {
  tags: ['forced-colors'],
  render: frame('default'),
  parameters: source(
    '<ave-stepper',
    '  label="Оформление договора"',
    '  selectable',
    '  [steps]="steps"',
    '  [current]="step()"',
    '  (stepSelected)="step.set($event)"',
    '/>',
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const list = canvas.getByRole('list', { name: 'Оформление договора' });
    const steps = within(list).getAllByRole('listitem');
    await expect(steps).toHaveLength(4);
    await expect(steps[2]).toHaveAttribute('aria-current', 'step');
    await expect(within(list).getAllByRole('img', { name: 'Выполнен' })).toHaveLength(2);
    await userEvent.click(within(list).getByRole('button', { name: /Условия/ }));
    await expect(canvas.getByRole('status')).toHaveTextContent('Шаг 2 из 4');
    await expect(within(list).getAllByRole('button')).toHaveLength(1);
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

/** A contract's approval route, in a column: one department agreed, the next returned it, two ahead. */
export const Route: Story = {
  render: frame('route'),
  play: async ({ canvasElement }) => {
    const list = within(canvasElement).getByRole('list', { name: 'Маршрут согласования' });
    await expect(within(list).getByRole('img', { name: 'Требует внимания' })).toBeVisible();
    await expect(within(list).queryAllByRole('button')).toHaveLength(0);
    const [first, second] = within(list).getAllByRole('listitem');
    await expect((second?.getBoundingClientRect().top ?? 0) >= (first?.getBoundingClientRect().bottom ?? 0)).toBe(true);
  },
};

/** Long Uzbek and Russian names wrap under their marks; in a narrow container the steps go into a column. */
export const LongText: Story = {
  name: 'Long text',
  render: frame('long'),
  play: async ({ canvasElement }) => {
    const list = within(canvasElement).getByRole('list');
    await expect(list.scrollWidth).toBe(list.clientWidth);
    for (const label of canvasElement.querySelectorAll('.label')) {
      await expect(label.scrollWidth).toBe(label.clientWidth);
    }
  },
};
