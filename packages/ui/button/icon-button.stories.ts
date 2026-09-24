import { Component, input } from '@angular/core';
import { componentWrapperDecorator, moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, waitFor, within } from 'storybook/test';
import {
  lucideChevronLeft,
  lucideChevronRight,
  lucideDownload,
  lucideEllipsis,
  lucidePencil,
  lucideTrash,
  lucideX,
} from '@avelune/icons/lucide';
import { AveButton, AveIconButton, type AveButtonSize, type AveButtonVariant } from '@avelune/ui/button';
import { provideAveIcons } from '@avelune/ui/icon';

const variants = ['primary', 'secondary', 'ghost', 'danger'] as const satisfies readonly AveButtonVariant[];
const sizes = ['sm', 'md', 'lg'] as const satisfies readonly AveButtonSize[];

type View = 'variants' | 'sizes' | 'states' | 'row';

/** The frame the stories draw icon buttons in; it registers the icons it draws. Styled with tokens only. */
@Component({
  selector: 'ave-icon-button-stories',
  imports: [AveButton, AveIconButton],
  providers: [
    provideAveIcons([
      lucideChevronLeft,
      lucideChevronRight,
      lucideDownload,
      lucideEllipsis,
      lucidePencil,
      lucideTrash,
      lucideX,
    ]),
  ],
  template: `
    @switch (view()) {
      @case ('variants') {
        <div class="row">
          @for (variant of variants; track variant) {
            <button aveIconButton type="button" icon="pencil" [label]="'Edit, ' + variant" [variant]="variant"></button>
          }
        </div>
      }
      @case ('sizes') {
        <div class="stack">
          @for (size of sizes; track size) {
            <div class="row" [attr.data-size]="size">
              <button aveButton type="button" [size]="size">Export</button>
              <button aveIconButton type="button" icon="download" label="Download" [size]="size"></button>
              <button
                aveIconButton
                type="button"
                icon="ellipsis"
                label="More actions"
                variant="ghost"
                [size]="size"
              ></button>
            </div>
          }
        </div>
      }
      @case ('states') {
        <div class="row">
          <button aveIconButton type="button" icon="trash" label="Delete, enabled"></button>
          <button aveIconButton type="button" icon="trash" label="Delete, focused" data-focus-target></button>
          <button aveIconButton type="button" icon="trash" label="Delete, disabled" disabled></button>
          <button
            aveIconButton
            type="button"
            icon="trash"
            label="Delete, disabled but focusable"
            disabled
            disabledInteractive
          ></button>
          <button aveIconButton type="button" icon="trash" label="Delete, loading" loading></button>
        </div>
      }
      @default {
        <div class="toolbar" role="group" aria-label="Document">
          <button
            aveIconButton
            type="button"
            icon="chevron-left"
            label="Previous document"
            variant="ghost"
            size="sm"
          ></button>
          <span class="position" lang="ru">Документ 3 из 12</span>
          <button
            aveIconButton
            type="button"
            icon="chevron-right"
            label="Next document"
            variant="ghost"
            size="sm"
          ></button>
          <span class="spacer"></span>
          <button aveIconButton type="button" icon="pencil" label="Edit document" variant="ghost" size="sm"></button>
          <button aveIconButton type="button" icon="trash" label="Delete document" variant="ghost" size="sm"></button>
          <button aveIconButton type="button" icon="x" label="Close document" variant="ghost" size="sm"></button>
        </div>
      }
    }
  `,
  styleUrl: './icon-button.stories.css',
})
class IconButtonStories {
  readonly view = input<View>('variants');
  protected readonly variants = variants;
  protected readonly sizes = sizes;
}

/** Pads the Default story and registers its icon; styled with tokens only. */
@Component({
  selector: 'ave-icon-button-story-frame',
  providers: [provideAveIcons([lucideX])],
  template: '<ng-content />',
  styleUrl: './icon-button.stories.css',
})
class IconButtonStoryFrame {}

type Story = StoryObj<AveIconButton>;

function source(...lines: readonly string[]): NonNullable<Story['parameters']> {
  return { docs: { source: { code: lines.join('\n'), language: 'html' } } };
}

function frame(view: View): NonNullable<Story['render']> {
  return () => ({
    props: { view },
    template: `<ave-icon-button-stories [view]="view" />`,
    moduleMetadata: { imports: [IconButtonStories] },
  });
}

const meta: Meta<AveIconButton> = {
  title: 'Components/IconButton',
  component: AveIconButton,
  args: {
    icon: 'x',
    label: 'Close',
    variant: 'secondary',
    size: 'md',
    disabled: false,
    disabledInteractive: false,
    loading: false,
  },
  argTypes: {
    icon: { control: false },
    variant: { control: 'inline-radio', options: ['primary', 'secondary', 'ghost', 'danger'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
  },
  render: (args) => ({
    props: args,
    template: `<button aveIconButton type="button" [icon]="icon" [label]="label" [variant]="variant" [size]="size"
      [disabled]="disabled" [disabledInteractive]="disabledInteractive" [loading]="loading"></button>`,
  }),
};
export default meta;

/** One icon button, with controls. */
export const Default: Story = {
  decorators: [moduleMetadata({ imports: [IconButtonStoryFrame] }), componentWrapperDecorator(IconButtonStoryFrame)],
  parameters: source(
    '<!-- Registered with provideAveIcons([lucideX]). -->',
    '<button aveIconButton type="button" icon="x" label="Close"></button>',
  ),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: 'Close' })).toBeVisible();
  },
};

/** The four variants. */
export const Variants: Story = {
  render: frame('variants'),
  parameters: source('<button aveIconButton type="button" icon="pencil" label="Edit" variant="ghost"></button>'),
  play: async ({ canvasElement }) => {
    const buttons = within(canvasElement).getAllByRole('button', { name: /^Edit, / });
    await expect(buttons).toHaveLength(4);
  },
};

/** Each size next to a Button of that size: the same height, a square. */
export const Sizes: Story = {
  render: frame('sizes'),
  parameters: source(
    '<button aveButton type="button" size="sm">Export</button>',
    '<button aveIconButton type="button" icon="download" label="Download" size="sm"></button>',
  ),
  play: async ({ canvasElement }) => {
    for (const row of canvasElement.querySelectorAll('.row')) {
      const [button, ...squares] = [...row.querySelectorAll('button')];
      const height = button?.getBoundingClientRect().height;
      for (const square of squares) {
        const box = square.getBoundingClientRect();
        await expect([box.width, box.height], row.getAttribute('data-size') ?? '').toEqual([height, height]);
      }
    }
  },
};

/** Enabled, focused, disabled, disabled but focusable, loading: one square, whatever the state. */
export const States: Story = {
  tags: ['forced-colors'],
  render: frame('states'),
  parameters: source(
    '<button aveIconButton type="button" icon="trash" label="Delete row" disabled disabledInteractive></button>',
    '<button aveIconButton type="button" icon="trash" label="Delete row" [loading]="deleting()"></button>',
  ),
  play: async ({ canvasElement }) => {
    const buttons = [...canvasElement.querySelectorAll('button')];
    const [first] = buttons;
    for (const button of buttons) {
      const { width, height } = button.getBoundingClientRect();
      await expect({ width, height }).toEqual({
        width: first?.getBoundingClientRect().width,
        height: first?.getBoundingClientRect().height,
      });
    }
    const busy = canvasElement.querySelector('[aria-busy="true"]');
    await waitFor(() => expect(busy).toHaveAttribute('data-spinner'), { timeout: 2000 });
    const focused = canvasElement.querySelector<HTMLButtonElement>('[data-focus-target]');
    focused?.focus();
    await expect(focused?.matches(':focus-visible')).toBe(true);
  },
};

/** A document toolbar: ghost icon buttons around a position label. */
export const InARow: Story = {
  name: 'In a row',
  render: frame('row'),
  parameters: source(
    '<button aveIconButton type="button" icon="chevron-left" label="Previous document" variant="ghost" size="sm"></button>',
    '<span>Документ 3 из 12</span>',
    '<button aveIconButton type="button" icon="chevron-right" label="Next document" variant="ghost" size="sm"></button>',
  ),
  play: async ({ canvasElement }) => {
    // A group, not a toolbar: arrow-key navigation comes with the Toolbar (Wave 4, Angular Aria).
    const toolbar = within(canvasElement).getByRole('group', { name: 'Document' });
    await expect(within(toolbar).getAllByRole('button')).toHaveLength(5);
    await expect(toolbar.scrollWidth).toBeLessThanOrEqual(toolbar.clientWidth);
  },
};
