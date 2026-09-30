import { Component, LOCALE_ID, input, signal } from '@angular/core';
import { RouterLink, provideRouter, withHashLocation } from '@angular/router';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, within } from 'storybook/test';
import { AveButton } from '@avelune/ui/button';
import { AveInput } from '@avelune/ui/input';
import {
  AveSearchHeader,
  AveSearchHeaderActions,
  AveSearchHeaderSearch,
  type AveSearchFilters,
} from '@avelune/ui/search-header';

type View = 'default' | 'plain' | 'loading' | 'long';

/** Filters that keep the header's contract, as FilterPanel will: two applied, a column beside the list. */
class StoryFilters implements AveSearchFilters {
  private readonly shown = signal(false);
  readonly label: AveSearchFilters['label'];
  readonly count = signal(2).asReadonly();
  readonly open = this.shown.asReadonly();
  readonly modal = signal(false).asReadonly();
  constructor(
    readonly id: string,
    label: string,
  ) {
    this.label = signal(label).asReadonly();
  }
  toggle(): void {
    this.shown.update((shown) => !shown);
  }
}

/** The frame the stories draw headers in: the top of a list page. Styled with tokens only. */
@Component({
  selector: 'ave-search-header-stories',
  imports: [AveButton, AveInput, AveSearchHeader, AveSearchHeaderActions, AveSearchHeaderSearch, RouterLink],
  template: `
    @switch (view()) {
      @case ('plain') {
        <ave-search-header heading="Контрагенты" summary="1 204 организации" searchLabel="Поиск контрагентов" lang="ru">
          <div aveSearchHeaderActions>
            <a aveButton variant="primary" routerLink="/counterparties/new">Добавить контрагента</a>
          </div>
          <input
            aveInput
            aveSearchHeaderSearch
            type="search"
            aria-label="Поиск контрагентов"
            placeholder="Название или ИНН"
          />
        </ave-search-header>
      }
      @case ('loading') {
        <ave-search-header heading="Договоры" summary="Загрузка договоров…" [filters]="filters" lang="ru">
          <div aveSearchHeaderActions>
            <a aveButton variant="primary" routerLink="/contracts/new">Новый договор</a>
          </div>
          <input aveInput aveSearchHeaderSearch type="search" aria-label="Поиск договоров" />
        </ave-search-header>
        <p class="filters" [id]="filters.id" [hidden]="!filters.open()">Здесь колонка фильтров: FilterPanel.</p>
      }
      @case ('long') {
        <ave-search-header
          heading="Oʻzbekiston Respublikasi hududiy boshqarmalari bilan tuzilgan shartnomalar"
          summary="1 204 ta shartnoma"
          searchLabel="Shartnomalarni qidirish"
          [filters]="uzFilters"
          lang="uz-Latn"
        >
          <div aveSearchHeaderActions>
            <button aveButton type="button">Excel faylga yuklab olish</button>
            <a aveButton variant="primary" routerLink="/contracts/new">Yangi shartnoma</a>
          </div>
          <input aveInput aveSearchHeaderSearch type="search" aria-label="Shartnomalarni qidirish" />
        </ave-search-header>
        <p class="filters" [id]="uzFilters.id" [hidden]="!uzFilters.open()">Bu yerda filtrlar ustuni: FilterPanel.</p>
      }
      @default {
        <ave-search-header
          heading="Договоры"
          summary="34 договора"
          searchLabel="Поиск договоров"
          [filters]="filters"
          lang="ru"
        >
          <div aveSearchHeaderActions>
            <button aveButton type="button">Выгрузить в Excel</button>
            <a aveButton variant="primary" routerLink="/contracts/new">Новый договор</a>
          </div>
          <input
            aveInput
            aveSearchHeaderSearch
            type="search"
            aria-label="Поиск договоров"
            placeholder="Номер, предмет или контрагент"
          />
        </ave-search-header>
        <p class="filters" [id]="filters.id" [hidden]="!filters.open()">Здесь колонка фильтров: FilterPanel.</p>
      }
    }
  `,
  styleUrl: './search-header.stories.css',
})
class SearchHeaderStories {
  readonly view = input<View>('default');
  protected readonly filters = new StoryFilters('story-filters', 'Фильтры');
  protected readonly uzFilters = new StoryFilters('story-filters-uz', 'Filtrlar');
}

type Story = StoryObj<SearchHeaderStories>;

function frame(view: View): NonNullable<Story['render']> {
  return () => ({
    props: { view },
    template: `<ave-search-header-stories [view]="view" />`,
    moduleMetadata: { imports: [SearchHeaderStories] },
  });
}

const meta: Meta<SearchHeaderStories> = {
  title: 'Patterns/Search header',
  component: AveSearchHeader,
  decorators: [
    applicationConfig({
      providers: [
        { provide: LOCALE_ID, useValue: 'ru' },
        provideRouter([{ path: '**', children: [] }], withHashLocation()),
      ],
    }),
  ],
};
export default meta;

/** The register's header: the heading and its count, two actions, the search and the filters with two applied. */
export const Default: Story = {
  render: frame('default'),
  parameters: {
    docs: {
      source: {
        code: `<ave-search-header heading="Договоры" [summary]="summary()" searchLabel="Поиск договоров" [filters]="filters">
  <div aveSearchHeaderActions>
    <button aveButton type="button">Выгрузить в Excel</button>
    <a aveButton variant="primary" routerLink="/contracts/new">Новый договор</a>
  </div>
  <input aveInput aveSearchHeaderSearch type="search" aria-label="Поиск договоров" placeholder="Номер, предмет или контрагент" (input)="search($event)" />
</ave-search-header>
<ave-filter-panel #filters …>…</ave-filter-panel>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { level: 1, name: 'Договоры' })).toBeVisible();
    await expect(canvas.getByRole('status')).toHaveTextContent('34 договора');
    // Testing Library's roles (aria-query 5.3) predate <search>, which axe and the browsers treat as the landmark.
    const search = canvasElement.querySelector('search') ?? canvasElement;
    await expect(search).toHaveAttribute('aria-label', 'Поиск договоров');
    const button = within(search).getByRole('button', { name: 'Фильтры 2' });
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(button).toHaveAttribute('aria-controls', 'story-filters');
    await userEvent.click(button);
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(button);
    (document.activeElement as HTMLElement | null)?.blur();
    const input = within(search).getByRole('searchbox', { name: 'Поиск договоров' });
    await expect(input.getBoundingClientRect().height).toBe(button.getBoundingClientRect().height);
  },
};

/** A list without filters: the search fills its row. */
export const WithoutFilters: Story = {
  name: 'Without filters',
  render: frame('plain'),
  parameters: {
    docs: {
      source: {
        code: `<ave-search-header heading="Контрагенты" summary="1 204 организации" searchLabel="Поиск контрагентов">
  <div aveSearchHeaderActions><a aveButton variant="primary" routerLink="/counterparties/new">Добавить контрагента</a></div>
  <input aveInput aveSearchHeaderSearch type="search" aria-label="Поиск контрагентов" placeholder="Название или ИНН" />
</ave-search-header>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const search = canvasElement.querySelector('search') ?? canvasElement;
    await expect(within(search).queryByRole('button')).toBeNull();
    const input = within(search).getByRole('searchbox');
    await expect(input.getBoundingClientRect().right).toBe(search.getBoundingClientRect().right);
  },
};

/** While the records load, the count says so; screen readers hear the count once it comes. */
export const Loading: Story = {
  render: frame('loading'),
  parameters: {
    docs: {
      source: {
        code: `<ave-search-header heading="Договоры" [summary]="loading() ? 'Загрузка договоров…' : summary()" [filters]="filters">
  …
</ave-search-header>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('status')).toHaveTextContent('Загрузка договоров…');
  },
};

/** A long Uzbek heading wraps and pushes its count down; the actions wrap under it; nothing scrolls sideways. */
export const LongText: Story = {
  name: 'Long text',
  render: frame('long'),
  parameters: {
    docs: {
      source: {
        code: `<ave-search-header heading="Oʻzbekiston Respublikasi hududiy boshqarmalari bilan tuzilgan shartnomalar" summary="1 204 ta shartnoma" searchLabel="Shartnomalarni qidirish" [filters]="filters" lang="uz-Latn">
  <div aveSearchHeaderActions>
    <button aveButton type="button">Excel faylga yuklab olish</button>
    <a aveButton variant="primary" routerLink="/contracts/new">Yangi shartnoma</a>
  </div>
  <input aveInput aveSearchHeaderSearch type="search" aria-label="Shartnomalarni qidirish" />
</ave-search-header>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const header = canvasElement.querySelector('ave-search-header');
    await expect(header?.scrollWidth).toBe(header?.clientWidth);
    await expect(within(canvasElement).getByRole('button', { name: 'Filtrlar 2' })).toBeVisible();
    const heading = within(canvasElement).getByRole('heading', { level: 1 });
    const primary = within(canvasElement).getByRole('link', { name: 'Yangi shartnoma' });
    await expect(primary.getBoundingClientRect().top).toBeGreaterThanOrEqual(heading.getBoundingClientRect().bottom);
  },
};
