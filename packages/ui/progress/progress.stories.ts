import { Component, input, signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { AveButton } from '@avelune/ui/button';
import { aveNumberFormat } from '@avelune/ui/i18n';
import { AveProgress, type AveProgressSize, type AveProgressVariant } from '@avelune/ui/progress';

type View = 'default' | 'variants' | 'sizes' | 'list' | 'long' | 'edges';

interface Bar {
  readonly id: string;
  readonly label: string;
  readonly value: number;
  readonly variant: AveProgressVariant;
  readonly note: string;
  readonly lang?: string;
}

const percent = aveNumberFormat('ru', { style: 'percent' });

const variants: readonly Bar[] = [
  { id: 'sending', label: 'Договор поставки.pdf', value: 0.45, variant: 'accent', note: percent.format(0.45) },
  { id: 'sent', label: 'Приложение 1.xlsx', value: 1, variant: 'success', note: 'Загружено' },
  { id: 'failed', label: 'Скан паспорта.jpg', value: 0.7, variant: 'danger', note: 'Не загружено' },
];

const long: readonly Bar[] = [
  {
    id: 'ru',
    label: 'Выгрузка реестра договоров подразделения за второе полугодие в систему бухгалтерского учёта',
    value: 0.62,
    variant: 'accent',
    note: percent.format(0.62),
    lang: 'ru',
  },
  {
    id: 'uz',
    label: 'Oʻzbekiston Respublikasi Vazirlar Mahkamasining qarorlari arxivini yuklab olish',
    value: 0.18,
    variant: 'accent',
    note: aveNumberFormat('uz-Latn', { style: 'percent' }).format(0.18),
    lang: 'uz-Latn',
  },
];

const sizes = ['sm', 'md'] as const satisfies readonly AveProgressSize[];

/** The frame the stories draw progress bars in: a label row over each bar. Styled with tokens only. */
@Component({
  selector: 'ave-progress-stories',
  imports: [AveProgress],
  template: `
    @switch (view()) {
      @case ('default') {
        <div class="bar" lang="ru">
          <div class="head">
            <label for="bar-default">Договор поставки.pdf</label><span class="value">{{ format(0.45) }}</span>
          </div>
          <progress aveProgress id="bar-default" value="0.45"></progress>
        </div>
      }
      @case ('sizes') {
        @for (size of sizes; track size) {
          <div class="bar" lang="ru" [attr.data-size]="size">
            <div class="head">
              <label [for]="'bar-' + size">Импорт контрагентов · {{ size }}</label
              ><span class="value">{{ format(0.3) }}</span>
            </div>
            <progress aveProgress [id]="'bar-' + size" [size]="size" value="0.3"></progress>
          </div>
        }
      }
      @case ('list') {
        <ul class="list" lang="ru" aria-label="Файлы">
          @for (bar of bars(); track bar.id) {
            <li class="row">
              <div class="head">
                <label [for]="'bar-' + bar.id">{{ bar.label }}</label
                ><span class="value" [attr.data-variant]="bar.variant">{{ bar.note }}</span>
              </div>
              <progress
                aveProgress
                size="sm"
                [id]="'bar-' + bar.id"
                [variant]="bar.variant"
                [value]="bar.value"
              ></progress>
            </li>
          }
        </ul>
      }
      @case ('edges') {
        <div class="bar" lang="ru">
          <div class="head">
            <label for="bar-empty">Ожидает загрузки</label><span class="value">{{ format(0) }}</span>
          </div>
          <progress aveProgress id="bar-empty" value="0"></progress>
        </div>
        <div class="bar" lang="ru">
          <div class="head">
            <label for="bar-full">Проверено</label><span class="value">{{ format(1) }}</span>
          </div>
          <progress aveProgress id="bar-full" value="1"></progress>
        </div>
      }
      @default {
        @for (bar of bars(); track bar.id) {
          <div class="bar" [attr.lang]="bar.lang ?? 'ru'">
            <div class="head">
              <label [for]="'bar-' + bar.id">{{ bar.label }}</label
              ><span class="value" [attr.data-variant]="bar.variant">{{ bar.note }}</span>
            </div>
            <progress aveProgress [id]="'bar-' + bar.id" [variant]="bar.variant" [value]="bar.value"></progress>
          </div>
        }
      }
    }
  `,
  styleUrl: './progress.stories.css',
})
class ProgressStories {
  readonly view = input<View>('default');
  protected readonly sizes = sizes;
  readonly bars = input<readonly Bar[]>(variants);
  protected format(value: number): string {
    return percent.format(value);
  }
}

/** An import that advances: the bar fills and turns to success when it is done. */
@Component({
  selector: 'ave-progress-running',
  imports: [AveButton, AveProgress],
  template: `
    <div class="bar" lang="ru">
      <div class="head">
        <label for="bar-import">Импорт контрагентов</label
        ><span class="value" role="status">{{ done() === 1 ? 'Готово' : format(done()) }}</span>
      </div>
      <progress aveProgress id="bar-import" [value]="done()" [variant]="done() === 1 ? 'success' : 'accent'"></progress>
    </div>
    <button aveButton type="button" (click)="start()">Начать импорт</button>
  `,
  styleUrl: './progress.stories.css',
})
class ProgressRunning {
  protected readonly done = signal(0);

  protected format(value: number): string {
    return percent.format(value);
  }

  protected start(): void {
    this.done.set(0);
    const step = () => {
      this.done.set(Math.min(1, Math.round((this.done() + 0.25) * 100) / 100));
      if (this.done() < 1) setTimeout(step, 150);
    };
    setTimeout(step, 150);
  }
}

type Story = StoryObj<ProgressStories>;

function frame(view: View, bars?: readonly Bar[]): NonNullable<Story['render']> {
  return () => ({
    props: { view, bars: bars ?? variants },
    template: `<ave-progress-stories [view]="view" [bars]="bars" />`,
    moduleMetadata: { imports: [ProgressStories] },
  });
}

const meta: Meta<ProgressStories> = {
  title: 'Components/Progress',
  component: AveProgress,
};
export default meta;

/** An upload under way, named by its label, its share in words at the end of the label row. */
export const Default: Story = {
  render: frame('default'),
  parameters: {
    docs: {
      source: {
        code: `<label for="upload">Договор поставки.pdf</label> <span>45 %</span>
<progress aveProgress id="upload" value="0.45"></progress>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const bar = within(canvasElement).getByRole('progressbar', { name: 'Договор поставки.pdf' });
    await expect(bar).toHaveAttribute('value', '0.45');
    await expect(bar.getBoundingClientRect().height).toBe(8);
  },
};

/** Under way in the accent, finished in success, failed in danger; the words say it too. */
export const Variants: Story = {
  tags: ['forced-colors'],
  render: frame('variants'),
  parameters: {
    docs: {
      source: {
        code: `<progress aveProgress [value]="sent()" [max]="size()"></progress>
<progress aveProgress variant="success" value="1"></progress>
<progress aveProgress variant="danger" [value]="sent()" [max]="size()"></progress>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const bar of variants) {
      await expect(canvas.getByRole('progressbar', { name: bar.label })).toHaveAttribute('data-variant', bar.variant);
    }
  },
};

/** Two thicknesses: 8px on its own (default), 4px in lists and rows. */
export const Sizes: Story = {
  render: frame('sizes'),
  parameters: {
    docs: {
      source: {
        code: `<progress aveProgress size="sm" value="0.3"></progress>
<progress aveProgress value="0.3"></progress>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('[data-size="sm"] progress')?.getBoundingClientRect().height).toBe(4);
    await expect(canvasElement.querySelector('[data-size="md"] progress')?.getBoundingClientRect().height).toBe(8);
  },
};

/** A list of uploads: 4px bars under each file's name and state. */
export const List: Story = {
  render: frame('list'),
  parameters: {
    docs: {
      source: {
        code: `<ul aria-label="Файлы">
  @for (upload of uploads(); track upload.id) {
    <li>
      <label [for]="'upload-' + upload.id">{{ upload.name }}</label> <span>{{ upload.note }}</span>
      <progress
        aveProgress
        size="sm"
        [id]="'upload-' + upload.id"
        [variant]="upload.variant"
        [value]="upload.value"
      ></progress>
    </li>
  }
</ul>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getAllByRole('progressbar')).toHaveLength(3);
  },
};

/** Work that advances until it is done; the state is announced from the label row. */
export const Running: Story = {
  render: () => ({ template: '<ave-progress-running />', moduleMetadata: { imports: [ProgressRunning] } }),
  parameters: {
    docs: {
      source: {
        code: `<label for="import">Импорт контрагентов</label>
<span role="status">{{ done() === 1 ? 'Готово' : format(done()) }}</span>
<progress aveProgress id="import" [value]="done()" [variant]="done() === 1 ? 'success' : 'accent'"></progress>
<button aveButton type="button" (click)="start()">Начать импорт</button>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Начать импорт' }));
    await waitFor(() => expect(canvas.getByRole('status')).toHaveTextContent('Готово'), { timeout: 3000 });
    await expect(canvas.getByRole('progressbar', { name: 'Импорт контрагентов' })).toHaveAttribute(
      'data-variant',
      'success',
    );
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

/** Nothing done yet and all done: the empty track, and the full bar. */
export const Edges: Story = {
  render: frame('edges'),
  parameters: {
    docs: {
      source: {
        code: `<label for="waiting">Ожидает загрузки</label> <span>0 %</span>
<progress aveProgress id="waiting" value="0"></progress>
<label for="checked">Проверено</label> <span>100 %</span>
<progress aveProgress id="checked" value="1"></progress>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('progressbar', { name: 'Проверено' })).toHaveAttribute('value', '1');
  },
};

/** Long Russian and Uzbek names wrap above the bar; the value stays at the end of the first line. */
export const LongText: Story = {
  name: 'Long text',
  render: frame('long', long),
  parameters: {
    docs: {
      source: {
        code: `<label for="registry">Выгрузка реестра договоров подразделения за второе полугодие в систему бухгалтерского учёта</label>
<span>62 %</span>
<progress aveProgress id="registry" value="0.62"></progress>
<label for="decisions" lang="uz-Latn">Oʻzbekiston Respublikasi Vazirlar Mahkamasining qarorlari arxivini yuklab olish</label>
<span>18%</span>
<progress aveProgress id="decisions" value="0.18"></progress>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    for (const head of canvasElement.querySelectorAll('.head')) {
      const value = head.querySelector('.value')?.getBoundingClientRect();
      await expect(head.getBoundingClientRect().height).toBeGreaterThan(20);
      await expect(value?.top).toBe(head.getBoundingClientRect().top);
    }
  },
};
