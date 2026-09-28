import { Component, input, signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, within } from 'storybook/test';
import { lucideCloudOff, lucideFileText, lucideInbox, lucideSearch } from '@avelune/icons/lucide';
import { AveButton } from '@avelune/ui/button';
import { AveEmptyState, AveEmptyStateActions } from '@avelune/ui/empty-state';
import { provideAveIcons } from '@avelune/ui/icon';
import { AveInput } from '@avelune/ui/input';

type View = 'default' | 'search' | 'kinds' | 'long';

/** The frame the stories draw empty states in: the panel an empty list leaves. Styled with tokens only. */
@Component({
  selector: 'ave-empty-state-stories',
  imports: [AveButton, AveEmptyState, AveEmptyStateActions],
  providers: [provideAveIcons([lucideCloudOff, lucideFileText, lucideInbox, lucideSearch])],
  template: `
    @switch (view()) {
      @case ('kinds') {
        <div class="grid" lang="ru">
          <section class="panel" aria-label="Входящие">
            <ave-empty-state icon="inbox" heading="Все документы рассмотрены">
              <p>Новые документы на согласование появятся здесь.</p>
            </ave-empty-state>
          </section>
          <section class="panel" aria-label="Архив">
            <ave-empty-state icon="cloud-off" heading="Архив недоступен">
              <p>Сервер архива не отвечает. Документы на месте; попробуйте открыть архив позже.</p>
              <div aveEmptyStateActions><button aveButton type="button">Повторить</button></div>
            </ave-empty-state>
          </section>
        </div>
      }
      @case ('long') {
        <section class="panel" aria-label="Hujjatlar" lang="uz-Latn">
          <ave-empty-state
            icon="file-text"
            heading="Oʻzbekiston Respublikasi Vazirlar Mahkamasining qarorlari topilmadi"
          >
            <p>
              Tanlangan davr uchun hech qanday qaror roʻyxatga olinmagan. Davrni oʻzgartiring yoki qidiruv soʻzini
              tekshiring.
            </p>
            <div aveEmptyStateActions>
              <button aveButton type="button">Filtrlarni tozalash</button>
              <button aveButton type="button" variant="primary">Yangi qaror qoʻshish</button>
            </div>
          </ave-empty-state>
        </section>
      }
      @default {
        <section class="panel" aria-label="Договоры" lang="ru">
          <ave-empty-state icon="file-text" heading="Договоров пока нет">
            <p>Здесь появятся договоры подразделения. Создайте первый или загрузите подписанный скан.</p>
            <div aveEmptyStateActions>
              <button aveButton type="button">Загрузить скан</button>
              <button aveButton type="button" variant="primary">Создать договор</button>
            </div>
          </ave-empty-state>
        </section>
      }
    }
  `,
  styleUrl: './empty-state.stories.css',
})
class EmptyStateStories {
  readonly view = input<View>('default');
}

/** A search that finds nothing: the empty state says so and resets the search. */
@Component({
  selector: 'ave-empty-state-search',
  imports: [AveButton, AveEmptyState, AveEmptyStateActions, AveInput],
  providers: [provideAveIcons([lucideSearch])],
  template: `
    <section class="panel" aria-label="Контрагенты" lang="ru">
      <input aveInput type="search" aria-label="Поиск контрагента" [value]="query()" (input)="typed($event)" />
      @if (found().length > 0) {
        <ul class="rows">
          @for (name of found(); track name) {
            <li>{{ name }}</li>
          }
        </ul>
      } @else {
        <ave-empty-state icon="search" heading="Ничего не найдено">
          <p>Нет контрагентов с «{{ query() }}» в названии или ИНН.</p>
          <div aveEmptyStateActions>
            <button aveButton type="button" (click)="query.set('')">Сбросить поиск</button>
          </div>
        </ave-empty-state>
      }
    </section>
  `,
  styleUrl: './empty-state.stories.css',
})
class EmptyStateSearch {
  private readonly names = ['ООО «Альфа Технологии»', 'АО «Узбекнефтегаз»', 'ООО «Бета Логистик»'];
  protected readonly query = signal('Гамма');
  protected readonly found = (): readonly string[] =>
    this.names.filter((name) => name.toLowerCase().includes(this.query().toLowerCase()));

  protected typed(event: Event): void {
    if (event.target instanceof HTMLInputElement) this.query.set(event.target.value);
  }
}

type Story = StoryObj<EmptyStateStories>;

function frame(view: View): NonNullable<Story['render']> {
  return () => ({
    props: { view },
    template: `<ave-empty-state-stories [view]="view" />`,
    moduleMetadata: { imports: [EmptyStateStories] },
  });
}

function source(...lines: readonly string[]): NonNullable<Story['parameters']> {
  return { docs: { source: { code: lines.join('\n'), language: 'html' } } };
}

const meta: Meta<EmptyStateStories> = {
  title: 'Components/Empty state',
  component: EmptyStateStories,
};
export default meta;

/** A list with nothing in it yet: why it is empty, and the two ways to fill it. */
export const Default: Story = {
  tags: ['forced-colors'],
  render: frame('default'),
  parameters: source(
    '<ave-empty-state icon="file-text" heading="Договоров пока нет">',
    '  <p>Здесь появятся договоры подразделения. Создайте первый или загрузите подписанный скан.</p>',
    '  <div aveEmptyStateActions>',
    '    <button aveButton type="button">Загрузить скан</button>',
    '    <button aveButton type="button" variant="primary">Создать договор</button>',
    '  </div>',
    '</ave-empty-state>',
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Договоров пока нет')).toBeVisible();
    const [upload, create] = canvas.getAllByRole('button');
    await expect(upload?.getBoundingClientRect().top).toBe(create?.getBoundingClientRect().top);
  },
};

/** Nothing matches the search: the empty state names it and resets it. */
export const NoResults: Story = {
  name: 'No results',
  render: () => ({ template: '<ave-empty-state-search />', moduleMetadata: { imports: [EmptyStateSearch] } }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText('Нет контрагентов с «Гамма» в названии или ИНН.')).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'Сбросить поиск' }));
    await expect(canvas.getAllByRole('listitem')).toHaveLength(3);
    await userEvent.type(canvas.getByRole('searchbox', { name: 'Поиск контрагента' }), 'Гамма');
    await expect(canvas.getByText('Ничего не найдено')).toBeVisible();
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

/** A queue that is done, and a place that could not load: each says why, one offers to try again. */
export const Kinds: Story = {
  render: frame('kinds'),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll('ave-empty-state')).toHaveLength(2);
  },
};

/** Long Uzbek text wraps in short, centred lines; the actions wrap under each other on a phone. */
export const LongText: Story = {
  name: 'Long text',
  render: frame('long'),
  play: async ({ canvasElement }) => {
    const state = canvasElement.querySelector('ave-empty-state');
    await expect(state?.scrollWidth).toBe(state?.clientWidth);
    await expect((state?.getBoundingClientRect().width ?? 0) <= 480).toBe(true);
  },
};
