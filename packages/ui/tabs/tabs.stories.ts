import { Component, LOCALE_ID, input, signal } from '@angular/core';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { lucideClock, lucideInfo, lucidePaperclip, lucideRoute } from '@avelune/icons/lucide';
import { provideAveIcons } from '@avelune/ui/icon';
import { AveTab, AveTabs } from '@avelune/ui/tabs';

type View = 'default' | 'states' | 'long';

/** The frame the stories draw tabs in: a contract's page. Styled with tokens only. */
@Component({
  selector: 'ave-tabs-stories',
  imports: [AveTab, AveTabs],
  providers: [provideAveIcons([lucideClock, lucideInfo, lucidePaperclip, lucideRoute])],
  template: `
    @switch (view()) {
      @case ('states') {
        <ave-tabs label="Разделы договора" [(selected)]="selected">
          <ave-tab value="facts" label="Сведения" icon="info"><p>Контрагент, сумма и сроки договора.</p></ave-tab>
          <ave-tab value="route" label="Согласование" icon="route"><p>Юридический отдел согласовал.</p></ave-tab>
          <ave-tab value="files" label="Файлы" icon="paperclip"><p>Договор.pdf, Спецификация.xlsx</p></ave-tab>
          <ave-tab value="history" label="История" icon="clock" disabled><p>Создан черновик.</p></ave-tab>
        </ave-tabs>
      }
      @case ('long') {
        <div class="narrow">
          <ave-tabs label="Hujjat boʻlimlari" [(selected)]="selected">
            <ave-tab value="main" label="Asosiy maʼlumotlar"><p>Hujjatning asosiy maʼlumotlari.</p></ave-tab>
            <ave-tab value="route" label="Kelishish yoʻnalishi"><p>Kelishuvchilar roʻyxati.</p></ave-tab>
            <ave-tab value="links" label="Связанные документы министерств и ведомств"><p>Связей нет.</p></ave-tab>
            <ave-tab value="log" label="Oʻzgarishlar tarixi"><p>Oʻzgarishlar yoʻq.</p></ave-tab>
          </ave-tabs>
        </div>
      }
      @default {
        <ave-tabs label="Разделы договора" [(selected)]="selected">
          <ave-tab value="facts" label="Сведения"><p>Контрагент, сумма и сроки договора.</p></ave-tab>
          <ave-tab value="route" label="Согласование"
            ><p>Юридический отдел согласовал, финансовый рассматривает.</p></ave-tab
          >
          <ave-tab value="files" label="Файлы"><p>Договор.pdf, Спецификация.xlsx</p></ave-tab>
          <ave-tab value="history" label="История"><p>Создан черновик, отправлен на согласование.</p></ave-tab>
        </ave-tabs>
      }
    }
  `,
  styleUrl: './tabs.stories.css',
})
class TabsStories {
  readonly view = input<View>('default');
  protected readonly selected = signal<string | undefined>(undefined);
}

type Story = StoryObj<TabsStories>;

function frame(view: View): NonNullable<Story['render']> {
  return () => ({
    props: { view },
    template: `<ave-tabs-stories [view]="view" />`,
    moduleMetadata: { imports: [TabsStories] },
  });
}

function source(...lines: readonly string[]): NonNullable<Story['parameters']> {
  return { docs: { source: { code: lines.join('\n'), language: 'html' } } };
}

const meta: Meta<TabsStories> = {
  title: 'Components/Tabs',
  component: TabsStories,
  decorators: [applicationConfig({ providers: [{ provide: LOCALE_ID, useValue: 'ru' }] })],
};
export default meta;

/** A contract's sections: the first chosen, the arrows move between tabs and show each one's panel. */
export const Default: Story = {
  tags: ['forced-colors'],
  render: frame('default'),
  parameters: source(
    '<ave-tabs label="Разделы договора" [(selected)]="section">',
    '  <ave-tab value="facts" label="Сведения">…</ave-tab>',
    '  <ave-tab value="route" label="Согласование">…</ave-tab>',
    '  <ave-tab value="files" label="Файлы">…</ave-tab>',
    '  <ave-tab value="history" label="История">…</ave-tab>',
    '</ave-tabs>',
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const list = canvas.getByRole('tablist', { name: 'Разделы договора' });
    const tabs = within(list).getAllByRole('tab');
    await expect(tabs).toHaveLength(4);
    await expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    await expect(canvas.getByRole('tabpanel')).toHaveTextContent('Контрагент, сумма и сроки договора.');
    await userEvent.tab();
    await expect(tabs[0]).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(tabs[1]).toHaveFocus();
    await expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
    await expect(canvas.getByRole('tabpanel')).toHaveTextContent('Юридический отдел согласовал');
    await userEvent.keyboard('{ArrowLeft}');
    await expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    (document.activeElement as HTMLElement | null)?.blur();
    // The bar under the chosen tab, as wide as it.
    await waitFor(() =>
      expect(canvasElement.querySelector('.indicator')?.getBoundingClientRect().width).toBeCloseTo(
        tabs[0]?.getBoundingClientRect().width ?? 0,
        0,
      ),
    );
  },
};

/** Icons before the words, a tab chosen with the pointer, and a disabled tab that focus reaches but cannot choose. */
export const States: Story = {
  render: frame('states'),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('tab', { name: 'Файлы' }));
    await expect(canvas.getByRole('tab', { name: 'Файлы' })).toHaveAttribute('aria-selected', 'true');
    const history = canvas.getByRole('tab', { name: 'История' });
    await expect(history).toHaveAttribute('aria-disabled', 'true');
    await userEvent.keyboard('{ArrowRight}');
    await expect(history).toHaveFocus();
    await expect(history).toHaveAttribute('aria-selected', 'false');
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

/** Long Uzbek and Russian labels never wrap: the list scrolls sideways, and the chosen tab comes into view. */
export const LongText: Story = {
  name: 'Long text',
  render: frame('long'),
  play: async ({ canvasElement }) => {
    const list = within(canvasElement).getByRole('tablist');
    const tabs = within(list).getAllByRole('tab');
    await expect(new Set(tabs.map((tab) => tab.getBoundingClientRect().height)).size).toBe(1);
    await expect(list.scrollWidth).toBeGreaterThan(list.clientWidth);
    await userEvent.tab();
    await userEvent.keyboard('{End}');
    const last = tabs.at(-1);
    await expect(last).toHaveAttribute('aria-selected', 'true');
    await waitFor(() =>
      expect(last?.getBoundingClientRect().right).toBeLessThanOrEqual(list.getBoundingClientRect().right + 1),
    );
    await userEvent.keyboard('{Home}');
    await waitFor(() => expect(list.scrollLeft).toBe(0));
    (document.activeElement as HTMLElement | null)?.blur();
  },
};
