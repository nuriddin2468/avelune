import { Component, LOCALE_ID, input, signal } from '@angular/core';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { AveTag } from '@avelune/ui/tag';

type View = 'default' | 'sizes' | 'long';

/** The frame the stories draw tags in: a filter's chosen regions, which people take away. Styled with tokens only. */
@Component({
  selector: 'ave-tag-stories',
  imports: [AveTag],
  template: `
    @switch (view()) {
      @case ('sizes') {
        <div class="tags" lang="ru">
          <ave-tag removable>Ташкент</ave-tag>
          <ave-tag>Срочно</ave-tag>
        </div>
        <div class="tags" lang="ru">
          <ave-tag size="sm" removable>Ташкент</ave-tag>
          <ave-tag size="sm">Срочно</ave-tag>
        </div>
      }
      @case ('long') {
        <div class="tags narrow">
          <ave-tag removable lang="uz-Latn">Oʻzbekiston Respublikasi Vazirlar Mahkamasi</ave-tag>
          <ave-tag lang="ru">Для служебного пользования</ave-tag>
          <ave-tag size="sm" removable lang="uz-Cyrl">Қорақалпоғистон Республикаси</ave-tag>
        </div>
      }
      @default {
        <div class="filter" lang="ru">
          <span class="caption" id="regions">Регионы доставки</span>
          <ul class="tags" aria-labelledby="regions">
            @for (region of regions(); track region) {
              <li>
                <ave-tag removable (remove)="drop(region)">{{ region }}</ave-tag>
              </li>
            }
          </ul>
          @if (regions().length === 0) {
            <p class="muted">Все регионы</p>
          }
        </div>
      }
    }
  `,
  styleUrl: './tag.stories.css',
})
class TagStories {
  readonly view = input<View>('default');
  protected readonly regions = signal(['Ташкент', 'Самарканд', 'Бухара', 'Навоийская область']);

  protected drop(region: string): void {
    this.regions.update((regions) => regions.filter((one) => one !== region));
  }
}

type Story = StoryObj<TagStories>;

function frame(view: View): NonNullable<Story['render']> {
  return () => ({
    props: { view },
    template: `<ave-tag-stories [view]="view" />`,
    moduleMetadata: { imports: [TagStories] },
  });
}

const meta: Meta<TagStories> = {
  title: 'Components/Tag',
  component: AveTag,
  decorators: [applicationConfig({ providers: [{ provide: LOCALE_ID, useValue: 'ru' }] })],
};
export default meta;

/** A filter's chosen regions as removable tags in a named list. */
export const Default: Story = {
  tags: ['forced-colors'],
  render: frame('default'),
  parameters: {
    docs: {
      source: {
        code: `<ul class="tags" aria-labelledby="regions">
  @for (region of regions(); track region.value) {
    <li><ave-tag removable (remove)="drop(region)">{{ region.label }}</ave-tag></li>
  }
</ul>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('list', { name: 'Регионы доставки' })).toBeVisible();
    for (const region of ['Ташкент', 'Самарканд', 'Бухара', 'Навоийская область']) {
      await expect(canvas.getByRole('button', { name: `Убрать ${region}` })).toBeVisible();
    }
    for (const tag of canvasElement.querySelectorAll('ave-tag')) {
      await expect(tag.getBoundingClientRect().height).toBe(28);
    }
  },
};

/** Taking values away from the keyboard: focus goes to the next tag, then to the one before. */
export const Removing: Story = {
  render: frame('default'),
  parameters: {
    docs: {
      source: {
        code: `<ul aria-labelledby="regions">
  @for (region of regions(); track region.value) {
    <li><ave-tag removable (remove)="drop(region)">{{ region.label }}</ave-tag></li>
  }
</ul>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'Убрать Ташкент' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Убрать Самарканд' })).toHaveFocus());
    await expect(canvas.queryByText('Ташкент')).toBeNull();
    await userEvent.tab();
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'Убрать Навоийская область' })).toHaveFocus();
    await userEvent.keyboard(' ');
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Убрать Бухара' })).toHaveFocus());
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

/** 28px tags on a page and 24px tags for a field, with and without a remove button. */
export const Sizes: Story = {
  render: frame('sizes'),
  parameters: {
    docs: {
      source: {
        code: `<ave-tag removable>Ташкент</ave-tag>
<ave-tag size="sm" removable>Ташкент</ave-tag>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const [md, plain, sm] = canvasElement.querySelectorAll('ave-tag');
    await expect(md?.getBoundingClientRect().height).toBe(28);
    await expect(plain?.getBoundingClientRect().height).toBe(28);
    await expect(sm?.getBoundingClientRect().height).toBe(24);
    await expect(sm?.querySelector('.remove')?.getBoundingClientRect().height).toBe(20);
  },
};

/** Long Uzbek and Russian values wrap in a narrow column and are never cut. */
export const LongText: Story = {
  name: 'Long text',
  render: frame('long'),
  parameters: {
    docs: {
      source: {
        code: `<ave-tag removable lang="uz-Latn">Oʻzbekiston Respublikasi Vazirlar Mahkamasi</ave-tag>
<ave-tag lang="ru">Для служебного пользования</ave-tag>
<ave-tag size="sm" removable lang="uz-Cyrl">Қорақалпоғистон Республикаси</ave-tag>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const column = canvasElement.querySelector('.narrow');
    for (const tag of canvasElement.querySelectorAll('ave-tag')) {
      await expect(tag.getBoundingClientRect().width).toBeLessThanOrEqual(column?.clientWidth ?? 0);
      await expect(tag.scrollWidth).toBeLessThanOrEqual(tag.clientWidth);
    }
  },
};
