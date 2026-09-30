import { Component, input } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { AveAccordion, AveAccordionItem } from '@avelune/ui/accordion';

type View = 'default' | 'keyboard' | 'single' | 'long';

/** The frame the stories draw accordions in: a contract's terms. Styled with tokens only. */
@Component({
  selector: 'ave-accordion-stories',
  imports: [AveAccordion, AveAccordionItem],
  template: `
    @switch (view()) {
      @case ('single') {
        <ave-accordion [multiple]="false" lang="ru">
          <ave-accordion-item heading="Реквизиты поставщика" [expanded]="true">
            <p>ООО «Мебель Сервис», ИНН 305 118 427, р/с 2020 8000 1051 2345 6001.</p>
          </ave-accordion-item>
          <ave-accordion-item heading="Реквизиты покупателя">
            <p>АО «Узтелеком», ИНН 203 366 731, р/с 2021 0000 9001 1122 3004.</p>
          </ave-accordion-item>
        </ave-accordion>
      }
      @case ('long') {
        <div class="narrow">
          <ave-accordion lang="uz-Latn">
            <ave-accordion-item
              heading="Oʻzbekiston Respublikasi Vazirlar Mahkamasining qarori bilan tasdiqlangan shartlar"
              [expanded]="true"
            >
              <p>
                Shartnoma boʻyicha majburiyatlar bajarilmagan taqdirda tomonlar Oʻzbekiston Respublikasi qonunchiligiga
                muvofiq javobgar boʻladi.
              </p>
            </ave-accordion-item>
            <ave-accordion-item heading="Fors-major holatlari"
              ><p>Tomonlar javobgarlikdan ozod qilinadi.</p></ave-accordion-item
            >
          </ave-accordion>
        </div>
      }
      @case ('keyboard') {
        <ave-accordion lang="ru">
          <ave-accordion-item heading="Порядок оплаты" [expanded]="true">
            <p>Покупатель оплачивает поставку в течение 10 банковских дней после подписания акта приёмки.</p>
          </ave-accordion-item>
          <ave-accordion-item heading="Приёмка товара">
            <p>Товар принимается по количеству и качеству в день поставки, в присутствии представителей сторон.</p>
          </ave-accordion-item>
        </ave-accordion>
      }
      @default {
        <ave-accordion lang="ru" [level]="2">
          <ave-accordion-item heading="Штрафы и пени" [expanded]="true">
            <p>За каждый день просрочки поставки — пеня 0,1% от суммы договора, но не более 10%.</p>
          </ave-accordion-item>
          <ave-accordion-item heading="Форс-мажор">
            <p>
              Стороны освобождаются от ответственности за неисполнение обязательств из-за обстоятельств непреодолимой
              силы.
            </p>
          </ave-accordion-item>
          <ave-accordion-item heading="Конфиденциальность" disabled>
            <p>Условия договора не раскрываются третьим лицам.</p>
          </ave-accordion-item>
        </ave-accordion>
      }
    }
  `,
  styleUrl: './accordion.stories.css',
})
class AccordionStories {
  readonly view = input<View>('default');
}

type Story = StoryObj<AccordionStories>;

function frame(view: View): NonNullable<Story['render']> {
  return () => ({
    props: { view },
    template: `<ave-accordion-stories [view]="view" />`,
    moduleMetadata: { imports: [AccordionStories] },
  });
}

function source(...lines: readonly string[]): NonNullable<Story['parameters']> {
  return { docs: { source: { code: lines.join('\n'), language: 'html' } } };
}

const meta: Meta<AccordionStories> = {
  title: 'Components/Accordion',
  component: AccordionStories,
};
export default meta;

/** A contract's terms: one section open, one disabled. */
export const Default: Story = {
  tags: ['forced-colors'],
  render: frame('default'),
  parameters: source(
    '<ave-accordion [level]="2">',
    '  <ave-accordion-item heading="Штрафы и пени" [(expanded)]="fines">…</ave-accordion-item>',
    '  <ave-accordion-item heading="Форс-мажор">…</ave-accordion-item>',
    '  <ave-accordion-item heading="Конфиденциальность" disabled>…</ave-accordion-item>',
    '</ave-accordion>',
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const fines = canvas.getByRole('button', { name: 'Штрафы и пени' });
    await expect(fines).toHaveAttribute('aria-expanded', 'true');
    await expect(canvas.getByRole('heading', { level: 2, name: 'Форс-мажор' })).toBeVisible();
    await expect(canvas.getByRole('region', { name: 'Штрафы и пени' })).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Конфиденциальность' })).toHaveAttribute('aria-disabled', 'true');
  },
};

/** The keyboard: Down to the next heading, Enter to open it. */
export const Keyboard: Story = {
  render: frame('keyboard'),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'Порядок оплаты' })).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    const acceptance = canvas.getByRole('button', { name: 'Приёмка товара' });
    await expect(acceptance).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await expect(acceptance).toHaveAttribute('aria-expanded', 'true');
    await waitFor(() => expect(canvas.getByRole('region', { name: 'Приёмка товара' })).toBeVisible());
  },
};

/** One open at a time (`multiple` false): the supplier's and the buyer's details. */
export const Single: Story = {
  render: frame('single'),
  parameters: source('<ave-accordion [multiple]="false">…</ave-accordion>'),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Реквизиты покупателя' }));
    await expect(canvas.getByRole('button', { name: 'Реквизиты поставщика' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

/** A long Uzbek heading wraps beside its chevron, which stays on the first line. */
export const LongText: Story = {
  name: 'Long text',
  render: frame('long'),
  play: async ({ canvasElement }) => {
    const [first] = canvasElement.querySelectorAll('.trigger');
    const words = first?.querySelector('.words')?.getBoundingClientRect();
    const chevron = first?.querySelector('.chevron')?.getBoundingClientRect();
    await expect((words?.height ?? 0) > 20).toBe(true);
    await expect(Math.round((chevron?.top ?? 0) - (words?.top ?? 0))).toBe(2);
    await expect(canvasElement.querySelector('ave-accordion')?.scrollWidth).toBe(
      canvasElement.querySelector('ave-accordion')?.clientWidth,
    );
  },
};
