import { Component, LOCALE_ID, input, signal } from '@angular/core';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { lucideFileText, lucidePaperclip, lucideX } from '@avelune/icons/lucide';
import { AveAvatar } from '@avelune/ui/avatar';
import { AveBadge } from '@avelune/ui/badge';
import { AveButton, AveIconButton } from '@avelune/ui/button';
import { AveIcon, provideAveIcons } from '@avelune/ui/icon';
import { AveList, AveListItem } from '@avelune/ui/list';

type View = 'default' | 'files' | 'long';

/** The frame the stories draw lists in: an approval route and a contract's files. Styled with tokens only. */
@Component({
  selector: 'ave-list-stories',
  imports: [AveAvatar, AveBadge, AveButton, AveIcon, AveIconButton, AveList, AveListItem],
  template: `
    @switch (view()) {
      @case ('files') {
        <div class="stack" lang="ru">
          <ave-list label="Файлы договора">
            @for (file of files(); track file.name) {
              <ave-list-item>
                <ave-icon aveListStart name="file-text" decorative />
                <span>{{ file.name }}</span>
                <span class="muted">{{ file.size }}</span>
                <button
                  aveIconButton
                  aveListEnd
                  type="button"
                  variant="ghost"
                  size="sm"
                  icon="x"
                  [label]="'Открепить ' + file.name"
                  (click)="detach(file.name)"
                ></button>
              </ave-list-item>
            }
          </ave-list>
          <button aveButton type="button" (click)="attach()">
            <ave-icon name="paperclip" decorative />Прикрепить акты
          </button>
        </div>
      }
      @case ('long') {
        <div class="narrow" lang="uz-Latn">
          <ave-list label="Kelishuv yoʻnalishi">
            <ave-list-item>
              <ave-avatar aveListStart name="Oʻktam Aliyev" decorative />
              <span>Oʻktam Aliyev</span>
              <span class="muted"
                >Oʻzbekiston Respublikasi Moliya vazirligi huzuridagi Davlat moliyaviy nazorati departamenti</span
              >
              <ave-badge aveListEnd variant="info">Koʻrib chiqilmoqda</ave-badge>
            </ave-list-item>
          </ave-list>
        </div>
      }
      @default {
        <ave-list label="Маршрут согласования" lang="ru">
          @for (person of route; track person.name) {
            <ave-list-item>
              <ave-avatar aveListStart decorative [name]="person.name" />
              <span>{{ person.name }}</span>
              <span class="muted">{{ person.role }}</span>
              <ave-badge aveListEnd [variant]="person.variant">{{ person.status }}</ave-badge>
            </ave-list-item>
          }
        </ave-list>
      }
    }
  `,
  styleUrl: './list.stories.css',
})
class ListStories {
  readonly view = input<View>('default');
  protected readonly route = [
    { name: 'Азиза Каримова', role: 'Юридический департамент', status: 'Согласовала', variant: 'success' },
    { name: 'Малика Хасанова', role: 'Финансовый департамент', status: 'На рассмотрении', variant: 'info' },
    { name: 'Рустам Назаров', role: 'Правление', status: 'Ожидает', variant: 'neutral' },
  ] as const;
  protected readonly files = signal([
    { name: 'Договор поставки.pdf', size: '1,2 МБ' },
    { name: 'Спецификация оборудования.xlsx', size: '86 КБ' },
  ]);

  protected attach(): void {
    this.files.update((files) => [
      ...files,
      { name: `Акт сверки ${String(files.length + 1)}.pdf`, size: '240 КБ' },
      { name: `Акт приёмки ${String(files.length + 1)}.pdf`, size: '310 КБ' },
    ]);
  }

  protected detach(name: string): void {
    this.files.update((files) => files.filter((file) => file.name !== name));
  }
}

type Story = StoryObj<ListStories>;

function frame(view: View): NonNullable<Story['render']> {
  return () => ({
    props: { view },
    template: `<ave-list-stories [view]="view" />`,
    moduleMetadata: { imports: [ListStories] },
  });
}

function source(...lines: readonly string[]): NonNullable<Story['parameters']> {
  return { docs: { source: { code: lines.join('\n'), language: 'html' } } };
}

const meta: Meta<ListStories> = {
  title: 'Components/List',
  component: ListStories,
  decorators: [
    applicationConfig({
      providers: [{ provide: LOCALE_ID, useValue: 'ru' }, provideAveIcons([lucideFileText, lucidePaperclip, lucideX])],
    }),
  ],
};
export default meta;

/** An approval route: each approver's avatar, name and department, and where they stand. */
export const Default: Story = {
  tags: ['forced-colors'],
  render: frame('default'),
  parameters: source(
    '<ave-list label="Маршрут согласования">',
    '  <ave-list-item>',
    '    <ave-avatar aveListStart name="Азиза Каримова" decorative />',
    '    <span>Азиза Каримова</span>',
    '    <span>Юридический департамент</span>',
    '    <ave-badge aveListEnd variant="success">Согласовала</ave-badge>',
    '  </ave-list-item>',
    '</ave-list>',
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const list = canvas.getByRole('list', { name: 'Маршрут согласования' });
    await expect(within(list).getAllByRole('listitem')).toHaveLength(3);
    // The rows the list holds as it first renders stay still.
    for (const item of canvasElement.querySelectorAll('ave-list-item')) {
      await expect(item.classList.contains('ave-motion-list-enter')).toBe(false);
    }
  },
};

/** Files attached and taken away: new rows fade in and open, one after the other; a row taken away closes. */
export const AddingAndRemoving: Story = {
  name: 'Adding and removing',
  render: frame('files'),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Прикрепить акты' }));
    await waitFor(() => expect(canvas.getAllByRole('listitem')).toHaveLength(4));
    const [, , third, fourth] = canvasElement.querySelectorAll<HTMLElement>('ave-list-item');
    await expect(third?.style.getPropertyValue('--ave-motion-order')).toBe('0');
    await expect(fourth?.style.getPropertyValue('--ave-motion-order')).toBe('1');
    await userEvent.click(canvas.getByRole('button', { name: 'Открепить Договор поставки.pdf' }));
    await waitFor(() => expect(canvas.getAllByRole('listitem')).toHaveLength(3));
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

/** A long Uzbek department wraps between the avatar and the status, which stay centred on it. */
export const LongText: Story = {
  name: 'Long text',
  render: frame('long'),
  play: async ({ canvasElement }) => {
    const item = canvasElement.querySelector('ave-list-item');
    await expect(item?.scrollWidth).toBe(item?.clientWidth);
    const content = item?.querySelector('.content')?.getBoundingClientRect();
    const badge = item?.querySelector('ave-badge')?.getBoundingClientRect();
    await expect(Math.round((badge?.top ?? 0) + (badge?.height ?? 0) / 2)).toBe(
      Math.round((content?.top ?? 0) + (content?.height ?? 0) / 2),
    );
  },
};
