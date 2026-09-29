import { Component, LOCALE_ID, input, signal, type OnInit } from '@angular/core';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { AvePagination } from '@avelune/ui/pagination';

type View = 'default' | 'few' | 'narrow' | 'long';

/** The frame the stories draw paginations in: under a list. Styled with tokens only. */
@Component({
  selector: 'ave-pagination-stories',
  imports: [AvePagination],
  template: `
    @switch (view()) {
      @case ('few') {
        <ave-pagination label="Страницы актов" [total]="45" [pageSize]="10" [(page)]="page" />
      }
      @case ('narrow') {
        <div class="narrow">
          <ave-pagination label="Страницы писем" [total]="134" [pageSize]="10" [(page)]="page" />
        </div>
      }
      @default {
        <ave-pagination [total]="134" [pageSize]="10" [(page)]="page" />
      }
    }
  `,
  styleUrl: './pagination.stories.css',
})
class PaginationStories implements OnInit {
  readonly view = input<View>('default');
  /** The page the story opens on. */
  readonly start = input(1);
  protected readonly page = signal(1);

  ngOnInit(): void {
    this.page.set(this.start());
  }
}

/** A long register in Uzbek, in Latin script: long numbers and the kit's Uzbek words. */
@Component({
  selector: 'ave-pagination-uzbek',
  imports: [AvePagination],
  providers: [{ provide: LOCALE_ID, useValue: 'uz-Latn' }],
  template: `<div lang="uz-Latn"><ave-pagination [total]="12345" [pageSize]="20" [(page)]="page" /></div>`,
  styleUrl: './pagination.stories.css',
})
class PaginationUzbek {
  protected readonly page = signal(614);
}

type Story = StoryObj<PaginationStories>;

function frame(view: View, start = 1): NonNullable<Story['render']> {
  return () => ({
    props: { view, start },
    template: `<ave-pagination-stories [view]="view" [start]="start" />`,
    moduleMetadata: { imports: [PaginationStories] },
  });
}

function source(...lines: readonly string[]): NonNullable<Story['parameters']> {
  return { docs: { source: { code: lines.join('\n'), language: 'html' } } };
}

const meta: Meta<PaginationStories> = {
  title: 'Components/Pagination',
  component: PaginationStories,
  decorators: [applicationConfig({ providers: [{ provide: LOCALE_ID, useValue: 'ru' }] })],
};
export default meta;

/** Fourteen pages on the fifth: the ends, the current page and its neighbours in seven places. */
export const Default: Story = {
  tags: ['forced-colors'],
  render: frame('default', 5),
  parameters: source('<ave-pagination [total]="134" [pageSize]="10" [(page)]="page" />'),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const nav = within(canvas.getByRole('navigation', { name: 'Страницы' }));
    await expect(canvas.getByRole('status')).toHaveTextContent('41–50 из 134');
    // The numbers from a small container (480px); on a phone the page of pages between the arrows.
    if ((canvasElement.querySelector('ave-pagination')?.clientWidth ?? 0) >= 480) {
      await expect(nav.getByRole('button', { name: 'Страница 5' })).toHaveAttribute('aria-current', 'page');
      await expect(nav.getAllByRole('listitem')).toHaveLength(5);
      await userEvent.click(nav.getByRole('button', { name: 'Страница 6' }));
      await waitFor(() => expect(nav.getByRole('button', { name: 'Страница 6' })).toHaveFocus());
    } else {
      await expect(nav.getByText('Страница 5 из 14')).toBeVisible();
      await userEvent.click(nav.getByRole('button', { name: 'Следующая страница' }));
    }
    await expect(canvas.getByRole('status')).toHaveTextContent('51–60 из 134');
    await userEvent.click(nav.getByRole('button', { name: 'Предыдущая страница' }));
    await expect(canvas.getByRole('status')).toHaveTextContent('41–50 из 134');
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

/** Five pages: every page shows, and there is no page before the first. Named apart (`label`), as a second one on a page is. */
export const FewPages: Story = {
  name: 'Few pages',
  render: frame('few'),
  play: async ({ canvasElement }) => {
    const nav = within(within(canvasElement).getByRole('navigation'));
    const wide = (canvasElement.querySelector('ave-pagination')?.clientWidth ?? 0) >= 480;
    await expect(nav.queryAllByRole('button', { name: /^Страница/ })).toHaveLength(wide ? 5 : 0);
    await expect(nav.getByRole('button', { name: 'Предыдущая страница' })).toHaveAttribute('aria-disabled', 'true');
  },
};

/** A narrow container: "Страница 3 из 14" between the arrows, and the range above them. */
export const Narrow: Story = {
  render: frame('narrow', 3),
  play: async ({ canvasElement }) => {
    const nav = within(within(canvasElement).getByRole('navigation'));
    await expect(nav.getByText('Страница 3 из 14')).toBeVisible();
    await expect(nav.queryAllByRole('button', { name: /^Страница/ })).toHaveLength(0);
    await userEvent.click(nav.getByRole('button', { name: 'Следующая страница' }));
    await expect(nav.getByText('Страница 4 из 14')).toBeVisible();
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

/** 12 345 items in Uzbek: long page numbers in their places, the range with the locale's separators. */
export const LongText: Story = {
  name: 'Long text',
  render: () => ({ template: '<ave-pagination-uzbek />', moduleMetadata: { imports: [PaginationUzbek] } }),
  play: async ({ canvasElement }) => {
    const nav = canvasElement.querySelector('nav');
    await expect(nav).toHaveAttribute('aria-label', 'Sahifalar');
    await expect(within(canvasElement).getByRole('status')).toHaveTextContent('12 261–12 280, jami 12 345');
    await expect(nav?.scrollWidth).toBe(nav?.clientWidth);
  },
};
