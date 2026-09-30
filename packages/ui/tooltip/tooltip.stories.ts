import { Component, input } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { lucideDownload, lucidePencil, lucidePrinter, lucideTrash } from '@avelune/icons/lucide';
import { AveButton, AveIconButton } from '@avelune/ui/button';
import { provideAveIcons } from '@avelune/ui/icon';
import { AveTooltip, type AveTooltipSide } from '@avelune/ui/tooltip';

type View = 'default' | 'sides' | 'edge' | 'long';

const sides = ['top', 'bottom', 'start', 'end'] as const satisfies readonly AveTooltipSide[];

/** The frame the stories draw tooltips in. Styled with tokens only. */
@Component({
  selector: 'ave-tooltip-stories',
  imports: [AveButton, AveIconButton, AveTooltip],
  providers: [provideAveIcons([lucideDownload, lucidePencil, lucidePrinter, lucideTrash])],
  template: `
    @switch (view()) {
      @case ('sides') {
        <div class="sides" lang="ru">
          @for (side of sides; track side) {
            <button aveButton type="button" [aveTooltip]="'Подсказка: ' + side" [aveTooltipSide]="side">
              {{ side }}
            </button>
          }
        </div>
      }
      @case ('edge') {
        <div class="edge" lang="ru">
          <button
            aveIconButton
            type="button"
            variant="ghost"
            icon="printer"
            label="Печать"
            aveTooltip="Печать"
          ></button>
        </div>
      }
      @case ('long') {
        <div class="toolbar long" lang="ru">
          <button
            aveIconButton
            type="button"
            icon="download"
            label="Выгрузить"
            aveTooltip="Выгрузить реестр договоров подразделения за выбранный период в формате Excel"
          ></button>
          <button
            aveIconButton
            type="button"
            icon="pencil"
            label="Tahrirlash"
            lang="uz-Latn"
            aveTooltip="Hujjatni tahrirlash: oʻzgarishlar kelishuvchilarga qayta yuboriladi"
          ></button>
        </div>
      }
      @default {
        <div class="toolbar" role="toolbar" aria-label="Договор" lang="ru">
          <button
            aveIconButton
            type="button"
            variant="ghost"
            icon="pencil"
            label="Изменить"
            aveTooltip="Изменить"
          ></button>
          <button
            aveIconButton
            type="button"
            variant="ghost"
            icon="download"
            label="Выгрузить"
            aveTooltip="Выгрузить в Excel"
          ></button>
          <button
            aveIconButton
            type="button"
            variant="ghost"
            icon="printer"
            label="Печать"
            aveTooltip="Печать"
          ></button>
          <button
            aveIconButton
            type="button"
            variant="ghost"
            icon="trash"
            label="Удалить"
            aveTooltip="Удалить"
          ></button>
        </div>
      }
    }
  `,
  styleUrl: './tooltip.stories.css',
})
class TooltipStories {
  readonly view = input<View>('default');
  protected readonly sides = sides;
}

type Story = StoryObj<TooltipStories>;

function frame(view: View): NonNullable<Story['render']> {
  return () => ({
    props: { view },
    template: `<ave-tooltip-stories [view]="view" />`,
    moduleMetadata: { imports: [TooltipStories] },
  });
}

/** The tooltip that shows now, if any. */
function shown(): HTMLElement | null {
  return document.querySelector<HTMLElement>('ave-tooltip-panel[data-state="open"]');
}

const meta: Meta<TooltipStories> = {
  title: 'Components/Tooltip',
  component: AveTooltip,
};
export default meta;

/** A toolbar of icon buttons: each shows its name on hover after 500ms, and at once on keyboard focus. */
export const Default: Story = {
  render: frame('default'),
  parameters: {
    docs: {
      source: {
        code: '<button aveIconButton type="button" variant="ghost" icon="pencil" label="Изменить" aveTooltip="Изменить"></button>',
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const edit = canvas.getByRole('button', { name: 'Изменить' });
    await userEvent.hover(edit);
    await waitFor(() => expect(shown()).toHaveTextContent('Изменить'));
    await userEvent.unhover(edit);
    await waitFor(() => expect(shown()).toBeNull());
    await userEvent.tab();
    await waitFor(() => expect(shown()).toHaveTextContent('Изменить'));
    await userEvent.tab();
    await waitFor(() => expect(shown()).toHaveTextContent('Выгрузить в Excel'));
    // The first one leaves once its exit has played.
    await waitFor(() => expect(document.querySelectorAll('ave-tooltip-panel')).toHaveLength(1));
  },
};

/** Top by default, then bottom, start and end: keyboard focus on each shows its tooltip there. */
export const Sides: Story = {
  render: frame('sides'),
  parameters: {
    docs: {
      source: {
        code: '<button aveButton type="button" aveTooltip="Подсказка" aveTooltipSide="end">end</button>',
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const buttons = within(canvasElement).getAllByRole('button');
    for (const [index, side] of sides.entries()) {
      await userEvent.tab();
      await expect(buttons[index]).toHaveFocus();
      await waitFor(() => expect(shown()).toHaveAttribute('data-side', side));
    }
  },
};

/** No room above an element at the top of the page: the tooltip shows under it. */
export const Flip: Story = {
  render: frame('edge'),
  parameters: {
    docs: {
      source: {
        code: '<button aveIconButton type="button" variant="ghost" icon="printer" label="Печать" aveTooltip="Печать"></button>',
        language: 'html',
      },
    },
  },
  play: async () => {
    await userEvent.tab();
    await waitFor(() => expect(shown()).toHaveAttribute('data-side', 'bottom'));
  },
};

/** A long text wraps at 320px; Escape hides it without leaving the button. */
export const LongText: Story = {
  name: 'Long text',
  render: frame('long'),
  parameters: {
    docs: {
      source: {
        code: `<button aveIconButton type="button" icon="download" label="Выгрузить" aveTooltip="Выгрузить реестр договоров подразделения за выбранный период в формате Excel"></button>
<button aveIconButton type="button" icon="pencil" label="Tahrirlash" lang="uz-Latn" aveTooltip="Hujjatni tahrirlash: oʻzgarishlar kelishuvchilarga qayta yuboriladi"></button>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    await userEvent.tab();
    await waitFor(() => expect(shown()).toHaveTextContent('Выгрузить реестр договоров подразделения'));
    await expect(shown()?.getBoundingClientRect().width).toBeLessThanOrEqual(320);
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(shown()).toBeNull());
    await expect(within(canvasElement).getByRole('button', { name: 'Выгрузить' })).toHaveFocus();
    await userEvent.tab();
    await waitFor(() => expect(shown()).toHaveTextContent('Hujjatni tahrirlash'));
  },
};
