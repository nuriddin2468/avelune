import { Component, input, signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { AveButton } from '@avelune/ui/button';
import { AveSpinner, type AveSpinnerSize } from '@avelune/ui/spinner';

type View = 'default' | 'sizes' | 'context';

const sizes = ['sm', 'md', 'lg'] as const satisfies readonly AveSpinnerSize[];

/** The frame the stories draw spinners in. Styled with tokens only. */
@Component({
  selector: 'ave-spinner-stories',
  imports: [AveSpinner],
  template: `
    @switch (view()) {
      @case ('sizes') {
        <div class="row">
          @for (size of sizes; track size) {
            <span class="sample" [attr.data-size]="size">
              <ave-spinner [size]="size" />
              <code>{{ size }}</code>
            </span>
          }
        </div>
      }
      @case ('context') {
        <section class="panel" aria-labelledby="contracts-title" aria-busy="true" lang="ru">
          <h2 class="title" id="contracts-title">Договоры подразделения</h2>
          <p class="waiting"><ave-spinner size="sm" label="Загрузка договоров" /> Загружаем договоры…</p>
        </section>
        <section class="panel" aria-labelledby="archive-title" aria-busy="true" lang="uz-Latn">
          <h2 class="title" id="archive-title">Hujjatlar arxivi</h2>
          <p class="waiting"><ave-spinner size="sm" label="Arxiv yuklanmoqda" /> Arxiv yuklanmoqda…</p>
        </section>
      }
      @default {
        <ave-spinner label="Loading documents" />
      }
    }
  `,
  styleUrl: './spinner.stories.css',
})
class SpinnerStories {
  readonly view = input<View>('default');
  protected readonly sizes = sizes;
}

/** A search that takes a moment: the spinner waits 300ms before it shows, then stays at least 500ms. */
@Component({
  selector: 'ave-spinner-delay',
  imports: [AveButton, AveSpinner],
  template: `
    <div class="row">
      <button aveButton type="button" (click)="search(150)">Quick search</button>
      <button aveButton type="button" (click)="search(1200)">Slow search</button>
      <ave-spinner [loading]="searching()" label="Searching" />
      <p class="status" role="status">{{ result() }}</p>
    </div>
  `,
  styleUrl: './spinner.stories.css',
})
class SpinnerDelay {
  protected readonly searching = signal(false);
  protected readonly result = signal('');

  protected search(time: number): void {
    this.result.set('');
    this.searching.set(true);
    setTimeout(() => {
      this.searching.set(false);
      this.result.set('Found 12 documents.');
    }, time);
  }
}

type Story = StoryObj<SpinnerStories>;

function frame(view: View): NonNullable<Story['render']> {
  return () => ({
    props: { view },
    template: `<ave-spinner-stories [view]="view" />`,
    moduleMetadata: { imports: [SpinnerStories] },
  });
}

function source(...lines: readonly string[]): NonNullable<Story['parameters']> {
  return { docs: { source: { code: lines.join('\n'), language: 'html' } } };
}

/** Every spinner in the canvas has shown: its delay has passed. */
async function shown(canvasElement: HTMLElement): Promise<void> {
  await waitFor(async () => {
    for (const spinner of canvasElement.querySelectorAll('ave-spinner')) {
      await expect(spinner).toHaveAttribute('data-shown');
    }
  });
}

const meta: Meta<SpinnerStories> = {
  title: 'Components/Spinner',
  component: SpinnerStories,
};
export default meta;

/** A spinner on its own: a progress bar named by what is being waited for. */
export const Default: Story = {
  render: frame('default'),
  parameters: source('<ave-spinner [loading]="documents.isLoading()" label="Loading documents" />'),
  play: async ({ canvasElement }) => {
    await shown(canvasElement);
    await expect(within(canvasElement).getByRole('progressbar', { name: 'Loading documents' })).toBeVisible();
  },
};

/** The three sizes, the icon sizes: 16, 20 (default) and 24px. */
export const Sizes: Story = {
  render: frame('sizes'),
  parameters: source('<ave-spinner size="sm" />', '<ave-spinner />', '<ave-spinner size="lg" />'),
  play: async ({ canvasElement }) => {
    await shown(canvasElement);
    const expected = { sm: 16, md: 20, lg: 24 } as const satisfies Record<AveSpinnerSize, number>;
    for (const size of sizes) {
      const box = canvasElement.querySelector(`[data-size="${size}"] ave-spinner`)?.getBoundingClientRect();
      await expect([box?.width, box?.height]).toEqual([expected[size], expected[size]]);
    }
  },
};

/** A quick search never shows the spinner; a slow one shows it after 300ms, for at least 500ms. */
export const Delay: Story = {
  render: () => ({ template: '<ave-spinner-delay />', moduleMetadata: { imports: [SpinnerDelay] } }),
  parameters: source('<ave-spinner [loading]="searching()" label="Searching" />'),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const spinner = canvasElement.querySelector('ave-spinner');
    const box = spinner?.getBoundingClientRect();
    await userEvent.click(canvas.getByRole('button', { name: 'Quick search' }));
    await expect(await canvas.findByText('Found 12 documents.')).toBeVisible();
    await expect(spinner).not.toHaveAttribute('data-shown');
    await userEvent.click(canvas.getByRole('button', { name: 'Slow search' }));
    await expect(spinner).not.toHaveAttribute('data-shown');
    await waitFor(() => expect(canvas.getByRole('progressbar', { name: 'Searching' })).toBeVisible());
    await expect(spinner?.getBoundingClientRect()).toEqual(box);
    await waitFor(() => expect(spinner).not.toHaveAttribute('data-shown'), { timeout: 3000 });
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

/** A part of the page that is loading: the region is busy, and the spinner sits on the first line of its words. */
export const InContext: Story = {
  name: 'In context',
  render: frame('context'),
  parameters: source(
    '<section aria-labelledby="contracts-title" aria-busy="true">',
    '  <h2 id="contracts-title">Договоры подразделения</h2>',
    '  <p><ave-spinner size="sm" label="Загрузка договоров" /> Загружаем договоры…</p>',
    '</section>',
  ),
  play: async ({ canvasElement }) => {
    await shown(canvasElement);
    for (const line of canvasElement.querySelectorAll('.waiting')) {
      const spinner = line.querySelector('ave-spinner')?.getBoundingClientRect();
      const text = line.getBoundingClientRect();
      await expect((spinner?.top ?? 0) - text.top).toBe((text.height - (spinner?.height ?? 0)) / 2);
    }
  },
};
