import { Component, input, signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { AveButton } from '@avelune/ui/button';
import { AveSkeleton } from '@avelune/ui/skeleton';

type View = 'default' | 'shapes' | 'compact';

/** The frame the stories draw skeletons in. Styled with tokens only. */
@Component({
  selector: 'ave-skeleton-stories',
  imports: [AveSkeleton],
  template: `
    @switch (view()) {
      @case ('shapes') {
        <div class="grid">
          <figure class="sample">
            <ave-skeleton />
            <figcaption>One line of text</figcaption>
          </figure>
          <figure class="sample">
            <ave-skeleton lines="4" />
            <figcaption>A paragraph: four lines, the last shorter</figcaption>
          </figure>
          <figure class="sample">
            <ave-skeleton shape="block" />
            <figcaption>A block as tall as a control</figcaption>
          </figure>
          <figure class="sample">
            <ave-skeleton shape="block" class="chart" />
            <figcaption>A block the page makes 160px tall, for a chart</figcaption>
          </figure>
        </div>
      }
      @case ('compact') {
        <div data-density="compact">
          <article class="card" aria-busy="true" aria-label="Договор загружается">
            <ave-skeleton class="heading" />
            <ave-skeleton lines="3" />
            <ave-skeleton shape="block" />
          </article>
        </div>
      }
      @default {
        <article class="card" aria-busy="true" aria-label="Договор загружается">
          <ave-skeleton class="heading" />
          <ave-skeleton lines="3" />
          <ave-skeleton shape="block" />
        </article>
      }
    }
  `,
  styleUrl: './skeleton.stories.css',
})
class SkeletonStories {
  readonly view = input<View>('default');
}

/** A list that loads: skeleton rows of the rows to come, then the rows; the region is busy until they are in. */
@Component({
  selector: 'ave-skeleton-list',
  imports: [AveButton, AveSkeleton],
  template: `
    <button aveButton type="button" (click)="reload()">Обновить список</button>
    <section class="card" lang="ru" aria-labelledby="list-title" [attr.aria-busy]="loading() ? 'true' : null">
      <h2 class="title" id="list-title">Договоры на согласовании</h2>
      <p class="status" role="status">{{ loading() ? 'Загрузка договоров…' : '' }}</p>
      <ul class="rows">
        @if (loading()) {
          @for (row of placeholders; track row) {
            <li class="row" data-placeholder>
              <ave-skeleton class="line" />
              <ave-skeleton class="short" />
            </li>
          }
        } @else {
          @for (row of rows; track row.number) {
            <li class="row">
              <span class="line">{{ row.subject }}</span>
              <span class="short muted">{{ row.number }}</span>
            </li>
          }
        }
      </ul>
    </section>
  `,
  styleUrl: './skeleton.stories.css',
})
class SkeletonList {
  protected readonly placeholders = [1, 2, 3];
  protected readonly rows = [
    { number: 'ДК-2026/114', subject: 'Поставка серверного оборудования' },
    { number: 'ДК-2026/111', subject: 'Консультационные услуги по внедрению ЭДО' },
    { number: 'ДК-2026/107', subject: 'Аренда складского помещения' },
  ];
  protected readonly loading = signal(true);

  constructor() {
    setTimeout(() => {
      this.loading.set(false);
    }, 600);
  }

  protected reload(): void {
    this.loading.set(true);
    setTimeout(() => {
      this.loading.set(false);
    }, 600);
  }
}

type Story = StoryObj<SkeletonStories>;

function frame(view: View): NonNullable<Story['render']> {
  return () => ({
    props: { view },
    template: `<ave-skeleton-stories [view]="view" />`,
    moduleMetadata: { imports: [SkeletonStories] },
  });
}

const meta: Meta<SkeletonStories> = {
  title: 'Components/Skeleton',
  component: AveSkeleton,
};
export default meta;

/** A card on its way: a heading, three lines of text and a block. */
export const Default: Story = {
  tags: ['forced-colors'],
  render: frame('default'),
  parameters: {
    docs: {
      source: {
        code: `<article aria-busy="true" aria-label="Договор загружается">
  <ave-skeleton />
  <ave-skeleton lines="3" />
  <ave-skeleton shape="block" />
</article>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    for (const skeleton of canvasElement.querySelectorAll('ave-skeleton')) {
      await expect(skeleton).toHaveAttribute('aria-hidden', 'true');
    }
    await expect(canvasElement.querySelectorAll('ave-skeleton .part')).toHaveLength(5);
  },
};

/** Lines of text, a paragraph, a block and a block the page sizes. */
export const Shapes: Story = {
  render: frame('shapes'),
  parameters: {
    docs: {
      source: {
        code: `<ave-skeleton />
<ave-skeleton lines="4" />
<ave-skeleton shape="block" />
<!-- A block the application's CSS makes taller, such as 160px for a chart: the same element with a height rule. -->
<ave-skeleton shape="block" />`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const heights = [...canvasElement.querySelectorAll('ave-skeleton')].map(
      (skeleton) => skeleton.getBoundingClientRect().height,
    );
    await expect(heights).toEqual([20, 80, 36, 160]);
  },
};

/** Compact density changes controls, not text: the lines keep the height of body text. */
export const Compact: Story = {
  render: frame('compact'),
  parameters: {
    docs: {
      source: {
        code: `<div data-density="compact">
  <article aria-busy="true" aria-label="Договор загружается">
    <ave-skeleton />
    <ave-skeleton lines="3" />
    <ave-skeleton shape="block" />
  </article>
</div>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const [heading, paragraph] = canvasElement.querySelectorAll('ave-skeleton');
    await expect(heading?.getBoundingClientRect().height).toBe(20);
    await expect(paragraph?.getBoundingClientRect().height).toBe(60);
  },
};

/** A list that loads, then shows its rows in the places the skeleton held; the status says it loads. */
export const Loading: Story = {
  render: () => ({ template: '<ave-skeleton-list />', moduleMetadata: { imports: [SkeletonList] } }),
  parameters: {
    docs: {
      source: {
        code: `<section aria-labelledby="list-title" [attr.aria-busy]="loading() ? 'true' : null">
  <h2 id="list-title">Договоры на согласовании</h2>
  <p role="status">{{ loading() ? 'Загрузка договоров…' : '' }}</p>
  <ul>
    @if (loading()) {
      @for (row of placeholders; track row) {
        <li><ave-skeleton /><ave-skeleton /></li>
      }
    } @else {
      @for (contract of contracts(); track contract.number) {
        <li>{{ contract.subject }} <span>{{ contract.number }}</span></li>
      }
    }
  </ul>
</section>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const region = canvas.getByRole('region', { name: 'Договоры на согласовании' });
    // The pretend server answers after 600ms; emulated amd64 in the visual suite may need longer.
    await waitFor(() => expect(region).not.toHaveAttribute('aria-busy'), { timeout: 3000 });
    await expect(canvas.getAllByRole('listitem')).toHaveLength(3);
    await userEvent.click(canvas.getByRole('button', { name: 'Обновить список' }));
    // The list renders its placeholders on the next change detection.
    await waitFor(() => expect(region).toHaveAttribute('aria-busy', 'true'));
    await waitFor(() => expect(canvasElement.querySelectorAll('[data-placeholder]')).toHaveLength(3));
    await waitFor(() => expect(canvas.getByText('Поставка серверного оборудования')).toBeVisible(), { timeout: 3000 });
    (document.activeElement as HTMLElement | null)?.blur();
  },
};
