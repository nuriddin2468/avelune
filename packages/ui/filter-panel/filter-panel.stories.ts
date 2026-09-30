import { Component, LOCALE_ID, computed, input, signal, type OnInit } from '@angular/core';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { AveCheckbox, AveChoice } from '@avelune/ui/checkbox';
import {
  AveAppliedFilters,
  AveFilterPanel,
  AveFilterPanelContent,
  type AveAppliedFilter,
} from '@avelune/ui/filter-panel';
import { AveChoiceGroup } from '@avelune/ui/form-field';
import { AveInput } from '@avelune/ui/input';
import { AveList, AveListItem } from '@avelune/ui/list';
import { AveSearchHeader, AveSearchHeaderSearch } from '@avelune/ui/search-header';

type View = 'default' | 'collapsed' | 'drawer' | 'long';

type Status = 'draft' | 'approval' | 'signed' | 'expired';

const statuses: Record<Status, string> = {
  draft: 'Черновик',
  approval: 'На согласовании',
  signed: 'Подписан',
  expired: 'Истёк',
};

const uzStatuses: Record<Status, string> = {
  draft: 'Qoralama',
  approval: 'Kelishuv jarayonida boʻlgan shartnomalar',
  signed: 'Imzolangan va roʻyxatdan oʻtkazilgan',
  expired: 'Muddati tugagan',
};

const contracts: readonly { number: string; subject: string; status: Status }[] = [
  { number: 'ДК-2025/114', subject: 'Поставка офисной мебели', status: 'signed' },
  { number: 'ДК-2025/113', subject: 'Обслуживание серверного оборудования', status: 'approval' },
  { number: 'ДК-2025/112', subject: 'Аренда склада в Сергелийском районе', status: 'signed' },
  { number: 'ДК-2025/109', subject: 'Лицензии на систему документооборота', status: 'expired' },
];

/** The frame the stories draw the filters in: a register's header, its applied filters, the column and the list. */
@Component({
  selector: 'ave-filter-panel-stories',
  imports: [
    AveAppliedFilters,
    AveCheckbox,
    AveChoice,
    AveChoiceGroup,
    AveFilterPanel,
    AveFilterPanelContent,
    AveInput,
    AveList,
    AveListItem,
    AveSearchHeader,
    AveSearchHeaderSearch,
  ],
  template: `
    <div class="page" [attr.data-narrow]="view() === 'drawer' ? '' : null" [lang]="uz() ? 'uz-Latn' : 'ru'">
      <ave-search-header
        [heading]="uz() ? 'Shartnomalar' : 'Договоры'"
        [summary]="summary()"
        [searchLabel]="searchLabel()"
        [filters]="panel"
      >
        <input aveInput aveSearchHeaderSearch type="search" [attr.aria-label]="searchLabel()" />
      </ave-search-header>
      <ave-applied-filters [filters]="applied()" (remove)="remove($event)" (clear)="clear()" />
      <div class="layout" [attr.data-filters]="panel.open() && !panel.modal() ? 'open' : null">
        <ave-filter-panel
          #panel
          [label]="uz() ? 'Filtrlar' : 'Фильтры'"
          [count]="applied().length"
          [(open)]="open"
          (clear)="clear()"
        >
          <ng-template aveFilterPanelContent>
            <fieldset aveChoiceGroup [legend]="uz() ? 'Holati' : 'Статус'">
              @for (status of list; track status) {
                <label aveChoice>
                  <input type="checkbox" aveCheckbox [checked]="shown().has(status)" (change)="toggle(status)" />
                  {{ names()[status] }}
                </label>
              }
            </fieldset>
          </ng-template>
        </ave-filter-panel>
        <ave-list [label]="uz() ? 'Shartnomalar' : 'Договоры'">
          @for (contract of rows(); track contract.number) {
            <ave-list-item>
              {{ contract.subject }}
              <span class="muted">{{ contract.number }} · {{ names()[contract.status] }}</span>
            </ave-list-item>
          }
        </ave-list>
      </div>
    </div>
  `,
  styleUrl: './filter-panel.stories.css',
})
class FilterPanelStories implements OnInit {
  readonly view = input<View>('default');
  protected readonly list = Object.keys(statuses) as Status[];
  protected readonly shown = signal<ReadonlySet<Status>>(new Set(['approval', 'signed']));
  protected readonly open = signal(false);
  protected readonly uz = computed(() => this.view() === 'long');
  protected readonly names = computed(() => (this.uz() ? uzStatuses : statuses));
  protected readonly searchLabel = computed(
    () =>
      ({
        default: 'Поиск договоров',
        collapsed: 'Поиск по реестру',
        drawer: 'Поиск в архиве',
        long: 'Shartnomalarni qidirish',
      })[this.view()],
  );
  protected readonly rows = computed(() => contracts.filter((contract) => this.shown().has(contract.status)));
  protected readonly summary = computed(() =>
    this.uz() ? `${String(this.rows().length)} ta shartnoma` : `${String(this.rows().length)} договора`,
  );
  /** A narrowed status filter, one tag a status, while it leaves some out. */
  protected readonly applied = computed<readonly AveAppliedFilter[]>(() =>
    this.shown().size === this.list.length
      ? []
      : this.list
          .filter((status) => this.shown().has(status))
          .map((status) => ({
            key: status,
            label: `${this.uz() ? 'Holati' : 'Статус'}: ${this.names()[status]}`,
          })),
  );

  ngOnInit(): void {
    this.open.set(this.view() === 'default' || this.view() === 'long');
  }

  protected toggle(status: Status): void {
    this.shown.update((shown) => {
      const next = new Set(shown);
      if (!next.delete(status)) next.add(status);
      return next;
    });
  }

  protected remove(key: string): void {
    this.shown.update((shown) => new Set([...shown].filter((status) => status !== key)));
  }

  protected clear(): void {
    this.shown.set(new Set(this.list));
  }
}

type Story = StoryObj<FilterPanelStories>;

function frame(view: View): NonNullable<Story['render']> {
  return () => ({
    props: { view },
    template: `<ave-filter-panel-stories [view]="view" />`,
    moduleMetadata: { imports: [FilterPanelStories] },
  });
}

/** Waits until an open drawer has played its entry, so a baseline shows it at rest. */
async function settled(): Promise<void> {
  const dialog = await within(document.body).findByRole('dialog');
  await waitFor(() => expect(dialog.getAnimations({ subtree: true })).toHaveLength(0));
}

/** Whether the panel is a column in the story's width, or a drawer. */
function drawer(canvasElement: HTMLElement): boolean {
  return canvasElement.querySelector('ave-filter-panel')?.getAttribute('data-mode') === 'drawer';
}

const meta: Meta<FilterPanelStories> = {
  title: 'Patterns/Filter panel',
  component: AveFilterPanel,
  decorators: [applicationConfig({ providers: [{ provide: LOCALE_ID, useValue: 'ru' }] })],
};
export default meta;

/** The register's filters in a column beside the list on a wide page, two statuses applied as tags above it. */
export const Default: Story = {
  tags: ['forced-colors'],
  render: frame('default'),
  parameters: {
    docs: {
      source: {
        code: `<ave-search-header heading="Договоры" [summary]="summary()" [filters]="filters">
  <input aveInput aveSearchHeaderSearch type="search" aria-label="Поиск договоров" />
</ave-search-header>
<ave-applied-filters [filters]="applied()" (remove)="removeFilter($event)" (clear)="clearFilters()" />
<ave-filter-panel #filters [count]="applied().length" (clear)="clearFilters()">
  <ng-template aveFilterPanelContent>
    <fieldset aveChoiceGroup legend="Статус">
      <label aveChoice><input type="checkbox" aveCheckbox [checked]="shown().has('signed')" (change)="toggle('signed')" /> Подписан</label>
      …
    </fieldset>
  </ng-template>
</ave-filter-panel>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const tags = canvas.getByRole('list', { name: 'Применённые фильтры' });
    await expect(within(tags).getAllByRole('listitem')).toHaveLength(2);
    const button = canvas.getByRole('button', { name: 'Фильтры 2' });
    if (drawer(canvasElement)) {
      // Open from the start on a phone: the drawer shows the filters.
      await expect(button).toHaveAttribute('aria-haspopup', 'dialog');
      await settled();
      return;
    }
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    const region = canvas.getByRole('region', { name: 'Фильтры' });
    await expect(within(region).getByRole('group', { name: 'Статус' })).toBeVisible();
    await expect(region.getBoundingClientRect().width).toBe(256);
  },
};

/** Collapsed, as a list opens: the list takes the width, and the button shows the column. */
export const Collapsed: Story = {
  render: frame('collapsed'),
  parameters: {
    docs: {
      source: {
        code: `<ave-search-header heading="Договоры" [filters]="filters">…</ave-search-header>
<ave-filter-panel #filters [count]="applied().length" (clear)="clearFilters()">
  <ng-template aveFilterPanelContent>…</ng-template>
</ave-filter-panel>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole('region', { name: 'Фильтры' })).toBeNull();
    const list = canvas.getByRole('list', { name: 'Договоры' });
    const header = canvasElement.querySelector('ave-search-header');
    await expect(list.getBoundingClientRect().left).toBe(header?.getBoundingClientRect().left);
    if (drawer(canvasElement)) return;
    const button = canvas.getByRole('button', { name: 'Фильтры 2' });
    await userEvent.click(button);
    await expect(canvas.getByRole('region', { name: 'Фильтры' })).toBeVisible();
    await userEvent.click(button);
    await expect(canvas.queryByRole('region', { name: 'Фильтры' })).toBeNull();
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

/** On a narrow page the filters open in a drawer from the start; "Показать результаты" closes it over the list. */
export const Drawer: Story = {
  render: frame('drawer'),
  parameters: {
    docs: {
      source: {
        code: `<!-- The same panel: below container.lg it opens in a drawer, with "Сбросить фильтры" and "Показать результаты". -->
<ave-filter-panel #filters [count]="applied().length" (clear)="clearFilters()">
  <ng-template aveFilterPanelContent>…</ng-template>
</ave-filter-panel>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Фильтры 2' });
    await expect(button).toHaveAttribute('aria-haspopup', 'dialog');
    // From the keyboard, as a baseline should show it: a scripted click would draw the button's focus ring.
    button.focus();
    await userEvent.keyboard('{Enter}');
    const dialog = await within(document.body).findByRole('dialog', { name: 'Фильтры' });
    await settled();
    await expect(within(dialog).getByRole('group', { name: 'Статус' })).toBeVisible();
    await expect(within(dialog).getByRole('button', { name: 'Сбросить фильтры' })).toBeVisible();
    await expect(within(dialog).getByRole('button', { name: 'Показать результаты' })).toBeVisible();
  },
};

/** Long Uzbek statuses wrap in the column and in their tags; nothing scrolls sideways. */
export const LongText: Story = {
  name: 'Long text',
  render: frame('long'),
  parameters: {
    docs: {
      source: {
        code: `<ave-filter-panel #filters label="Filtrlar" [count]="applied().length" (clear)="clearFilters()">
  <ng-template aveFilterPanelContent>
    <fieldset aveChoiceGroup legend="Holati">…</fieldset>
  </ng-template>
</ave-filter-panel>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const page = canvasElement.querySelector('.page');
    await expect(page?.scrollWidth).toBe(page?.clientWidth);
    if (drawer(canvasElement)) await settled();
    await expect(within(canvasElement).getByRole('button', { name: 'Filtrlar 2' })).toBeVisible();
  },
};
