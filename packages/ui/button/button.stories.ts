import { Component, input, signal } from '@angular/core';
import { componentWrapperDecorator, moduleMetadata, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { lucideArrowRight, lucideDownload, lucideFunnel, lucidePlus } from '@avelune/icons/lucide';
import { AveButton, type AveButtonSize, type AveButtonVariant } from '@avelune/ui/button';
import { AveIcon, provideAveIcons } from '@avelune/ui/icon';

const variants = [
  { variant: 'primary', label: 'Send for approval' },
  { variant: 'secondary', label: 'Save draft' },
  { variant: 'ghost', label: 'Preview' },
  { variant: 'danger', label: 'Delete document' },
] as const satisfies readonly { variant: AveButtonVariant; label: string }[];

const sizes = ['sm', 'md', 'lg'] as const satisfies readonly AveButtonSize[];

type View = 'variants' | 'sizes' | 'compact' | 'states' | 'reason' | 'icons' | 'long' | 'links';

/** The frame the stories draw buttons in; it registers the icons it draws. Styled with tokens only. */
@Component({
  selector: 'ave-button-stories',
  imports: [AveButton, AveIcon],
  providers: [provideAveIcons([lucideArrowRight, lucideDownload, lucideFunnel, lucidePlus])],
  template: `
    @switch (view()) {
      @case ('variants') {
        <div class="row">
          @for (item of variants; track item.variant) {
            <button aveButton type="button" [variant]="item.variant">{{ item.label }}</button>
          }
        </div>
        <div class="row end" role="group" aria-label="A form's actions">
          <button aveButton type="button">Cancel</button>
          <button aveButton type="button" variant="primary">Save changes</button>
        </div>
      }
      @case ('sizes') {
        <div class="stack">
          @for (size of sizes; track size) {
            <div class="row" [attr.data-size]="size">
              <button aveButton type="button" variant="primary" [size]="size">Save changes</button>
              <button aveButton type="button" [size]="size"><ave-icon name="download" decorative />Export</button>
              <button aveButton type="button" variant="ghost" [size]="size">Show more</button>
            </div>
          }
        </div>
      }
      @case ('compact') {
        <div class="stack" data-density="compact">
          @for (size of sizes; track size) {
            <div class="row" [attr.data-size]="size">
              <button aveButton type="button" variant="primary" [size]="size">Save changes</button>
              <button aveButton type="button" [size]="size"><ave-icon name="download" decorative />Export</button>
              <button aveButton type="button" variant="ghost" [size]="size">Show more</button>
            </div>
          }
        </div>
      }
      @case ('states') {
        <div class="scroll">
          <table class="states">
            <caption>
              Every variant in every state
            </caption>
            <thead>
              <tr>
                <th scope="col">Variant</th>
                <th scope="col">Enabled</th>
                <th scope="col">Focused</th>
                <th scope="col">Disabled</th>
                <th scope="col">Disabled, focusable</th>
                <th scope="col">Loading</th>
              </tr>
            </thead>
            <tbody>
              @for (item of variants; track item.variant) {
                <tr [attr.data-variant]="item.variant">
                  <th scope="row">{{ item.variant }}</th>
                  <td><button aveButton type="button" [variant]="item.variant">Save</button></td>
                  <td><button aveButton type="button" [variant]="item.variant" data-focus-target>Save</button></td>
                  <td><button aveButton type="button" [variant]="item.variant" disabled>Save</button></td>
                  <td>
                    <button aveButton type="button" [variant]="item.variant" disabled disabledInteractive>Save</button>
                  </td>
                  <td><button aveButton type="button" [variant]="item.variant" loading>Save</button></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
      @case ('reason') {
        <div class="stack narrow">
          <button
            aveButton
            type="button"
            variant="primary"
            disabled
            disabledInteractive
            aria-describedby="send-reason"
            (click)="clicks.set(clicks() + 1)"
          >
            Send for approval
          </button>
          <p id="send-reason" class="hint">Attach the signed contract to send the document for approval.</p>
        </div>
      }
      @case ('icons') {
        <div class="row">
          <button aveButton type="button" variant="primary"><ave-icon name="plus" decorative />Create document</button>
          <button aveButton type="button"><ave-icon name="download" decorative />Download report</button>
          <button aveButton type="button">Next step<ave-icon name="arrow-right" decorative /></button>
          <button aveButton type="button" variant="ghost" size="sm">
            <ave-icon name="funnel" decorative />Filters
          </button>
        </div>
      }
      @case ('long') {
        <div class="stack narrow" data-column>
          <button aveButton type="button" variant="primary" lang="ru">
            Отправить документ на согласование руководителю отдела
          </button>
          <button aveButton type="button" lang="uz-Latn">Hujjatni boʻlim boshligʻiga kelishish uchun yuborish</button>
          <button aveButton type="button" variant="ghost" lang="uz-Cyrl">
            Ҳужжатни бўлим бошлиғига келишиш учун юбориш
          </button>
        </div>
        <div class="row" data-row lang="ru">
          <button aveButton type="button">Сохранить черновик</button>
          <button aveButton type="button">Экспортировать в PDF</button>
          <button aveButton type="button">Распечатать</button>
          <button aveButton type="button" variant="ghost">Показать историю изменений</button>
          <button aveButton type="button" variant="primary">Отправить на согласование</button>
        </div>
      }
      @default {
        <div class="row">
          @for (item of variants; track item.variant) {
            <a aveButton [variant]="item.variant" href="#documents">{{ item.label }}</a>
          }
        </div>
        <div class="row">
          <a aveButton href="#documents" disabled>Open archive</a>
          <a aveButton href="#documents" disabled disabledInteractive>Open archive</a>
        </div>
      }
    }
  `,
  styleUrl: './button.stories.css',
})
class ButtonStories {
  readonly view = input<View>('variants');
  protected readonly variants = variants;
  protected readonly sizes = sizes;
  protected readonly clicks = signal(0);
}

/** A save that takes a moment: the button is busy at once, and its spinner shows only after the delay. */
@Component({
  selector: 'ave-button-loading',
  imports: [AveButton],
  template: `
    <div class="row">
      <button aveButton type="button" variant="primary" [loading]="saving()" (click)="save()">Save changes</button>
      <p class="hint" role="status">{{ saved() ? 'Changes saved.' : '' }}</p>
    </div>
  `,
  styleUrl: './button.stories.css',
})
class ButtonLoading {
  protected readonly saving = signal(false);
  protected readonly saved = signal(false);

  protected save(): void {
    this.saved.set(false);
    this.saving.set(true);
    setTimeout(() => {
      this.saving.set(false);
      this.saved.set(true);
    }, 1200);
  }
}

/** Pads the Default story as the frame above pads the others; styled with tokens only. */
@Component({
  selector: 'ave-button-story-frame',
  template: '<ng-content />',
  styleUrl: './button.stories.css',
})
class ButtonStoryFrame {}

function frame(view: View): NonNullable<Story['render']> {
  return () => ({
    props: { view },
    template: `<ave-button-stories [view]="view" />`,
    moduleMetadata: { imports: [ButtonStories] },
  });
}

/** The value of a token as the page computes it, in px. */
function px(element: Element, name: `--ave-${string}`): number {
  return Number.parseFloat(getComputedStyle(element).getPropertyValue(name));
}

/** What every control of a size must share (brief §8.2). */
function box(button: Element) {
  const style = getComputedStyle(button);
  return {
    height: button.getBoundingClientRect().height,
    border: style.borderTopWidth,
    radius: style.borderTopLeftRadius,
    padding: style.paddingInlineStart,
    font: `${style.fontSize}/${style.lineHeight} ${style.fontWeight}`,
  };
}

const meta: Meta<AveButton> = {
  title: 'Components/Button',
  component: AveButton,
  args: { variant: 'primary', size: 'md', disabled: false, disabledInteractive: false, loading: false },
  argTypes: {
    variant: { control: 'inline-radio', options: ['primary', 'secondary', 'ghost', 'danger'] },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] },
  },
  render: (args) => ({
    props: args,
    template: `<button aveButton type="button" [variant]="variant" [size]="size" [disabled]="disabled"
      [disabledInteractive]="disabledInteractive" [loading]="loading">Save changes</button>`,
  }),
};
export default meta;

type Story = StoryObj<AveButton>;

/** One button, with controls. */
export const Default: Story = {
  decorators: [moduleMetadata({ imports: [ButtonStoryFrame] }), componentWrapperDecorator(ButtonStoryFrame)],
  parameters: {
    docs: {
      source: {
        code: '<button aveButton type="button" variant="primary" size="md">Save changes</button>',
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('button', { name: 'Save changes' })).toBeVisible();
  },
};

/** The four variants, and a form's actions: the primary one last. */
export const Variants: Story = {
  render: frame('variants'),
  parameters: {
    docs: {
      source: {
        code: `<button aveButton type="button" variant="primary">Send for approval</button>
<button aveButton type="button">Save draft</button>
<button aveButton type="button" variant="ghost">Preview</button>
<button aveButton type="button" variant="danger">Delete document</button>

<div role="group" aria-label="A form's actions">
  <button aveButton type="button">Cancel</button>
  <button aveButton type="button" variant="primary">Save changes</button>
</div>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const buttons = [...canvasElement.querySelectorAll('button')];
    const [first] = buttons;
    if (first === undefined) throw new Error('No buttons');
    await expect(box(first).height).toBe(px(first, '--ave-control-height-md'));
    for (const button of buttons) await expect(box(button), button.textContent).toEqual(box(first));
  },
};

/** The three sizes, each on its control height; the label keeps its size. */
export const Sizes: Story = {
  render: frame('sizes'),
  parameters: {
    docs: {
      source: {
        code: `<button aveButton type="button" variant="primary" size="sm">Save changes</button>
<button aveButton type="button" variant="primary">Save changes</button>
<button aveButton type="button" variant="primary" size="lg">Save changes</button>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    for (const button of canvasElement.querySelectorAll('button')) {
      const size = button.getAttribute('data-size') ?? '';
      await expect(button.getBoundingClientRect().height, size).toBe(px(button, `--ave-control-height-${size}`));
    }
  },
};

/** Compact density moves every size one step down, whatever the toolbar says. */
export const Compact: Story = {
  render: frame('compact'),
  parameters: {
    docs: {
      source: {
        code: `<!-- Density is set once for the application (AveTheme.setDensity), or for a region. -->
<div data-density="compact">
  <button aveButton type="button" variant="primary" size="sm">Save changes</button>
  <button aveButton type="button" variant="primary">Save changes</button>
  <button aveButton type="button" variant="primary" size="lg">Save changes</button>
</div>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const heights = { sm: 28, md: 32, lg: 36 } as const;
    for (const size of sizes) {
      const button = canvasElement.querySelector(`button[data-size="${size}"]`);
      await expect(button?.getBoundingClientRect().height, size).toBe(heights[size]);
    }
  },
};

/**
 * Every variant enabled, focused, disabled, disabled but focusable, and loading. States never change the size, and
 * the loading buttons wait for their spinner.
 */
export const States: Story = {
  tags: ['forced-colors'],
  render: frame('states'),
  parameters: {
    docs: {
      source: {
        code: `<!-- Repeated for each variant: primary, secondary, ghost, danger. -->
<button aveButton type="button" variant="primary">Save</button>
<button aveButton type="button" variant="primary" disabled>Save</button>
<button aveButton type="button" variant="primary" disabled disabledInteractive>Save</button>
<button aveButton type="button" variant="primary" [loading]="saving()">Save</button>

<button aveButton type="button" variant="secondary">Save</button>
<button aveButton type="button" variant="secondary" disabled>Save</button>
<button aveButton type="button" variant="secondary" disabled disabledInteractive>Save</button>
<button aveButton type="button" variant="secondary" [loading]="saving()">Save</button>

<button aveButton type="button" variant="ghost">Save</button>
<button aveButton type="button" variant="ghost" disabled>Save</button>
<button aveButton type="button" variant="ghost" disabled disabledInteractive>Save</button>
<button aveButton type="button" variant="ghost" [loading]="saving()">Save</button>

<button aveButton type="button" variant="danger">Save</button>
<button aveButton type="button" variant="danger" disabled>Save</button>
<button aveButton type="button" variant="danger" disabled disabledInteractive>Save</button>
<button aveButton type="button" variant="danger" [loading]="saving()">Save</button>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const row of canvasElement.querySelectorAll('tbody tr')) {
      const buttons = [...row.querySelectorAll('button')];
      const [enabled] = buttons;
      if (enabled === undefined) throw new Error('No buttons');
      const size = enabled.getBoundingClientRect();
      for (const button of buttons) {
        const { width, height } = button.getBoundingClientRect();
        await expect({ width, height }, row.getAttribute('data-variant') ?? '').toEqual({
          width: size.width,
          height: size.height,
        });
      }
    }
    await expect(canvas.getAllByRole('button', { name: 'Save' })).toHaveLength(20);
    for (const busy of canvasElement.querySelectorAll('[aria-busy="true"]')) {
      await waitFor(() => expect(busy).toHaveAttribute('data-spinner'), { timeout: 2000 });
    }
    // The primary button of the Focused column carries the ring in the baseline.
    const focused = canvasElement.querySelector<HTMLButtonElement>('[data-variant="primary"] [data-focus-target]');
    focused?.focus();
    await expect(focused).toHaveFocus();
    await expect(focused?.matches(':focus-visible')).toBe(true);
  },
};

/** A disabled button that says why, and can still be reached with the keyboard to hear it. */
export const DisabledWithReason: Story = {
  name: 'Disabled, with a reason',
  render: frame('reason'),
  parameters: {
    docs: {
      source: {
        code: `<button aveButton type="button" variant="primary" disabled disabledInteractive aria-describedby="send-reason">
  Send for approval
</button>
<p id="send-reason">Attach the signed contract to send the document for approval.</p>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Send for approval' });
    await userEvent.tab();
    await expect(button).toHaveFocus();
    await expect(button).toHaveAttribute('aria-disabled', 'true');
    await expect(button).toHaveAccessibleDescription('Attach the signed contract to send the document for approval.');
    button.blur();
  },
};

/** A save in progress: busy at once, a spinner after 300ms, the label back when it is done. */
export const Loading: Story = {
  render: () => ({ template: '<ave-button-loading />', moduleMetadata: { imports: [ButtonLoading] } }),
  parameters: {
    docs: {
      source: {
        code: `<button aveButton type="button" variant="primary" [loading]="saving()" (click)="save()">
  Save changes
</button>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: 'Save changes' });
    await userEvent.click(button);
    await expect(button).toHaveAttribute('aria-busy', 'true');
    await expect(button).not.toHaveAttribute('data-spinner');
    await waitFor(() => expect(button).toHaveAttribute('data-spinner'), { timeout: 2000 });
    await expect(button).toHaveAccessibleName('Save changes');
    await waitFor(() => expect(canvas.getByRole('status')).toHaveTextContent('Changes saved.'), { timeout: 4000 });
    await expect(button).not.toHaveAttribute('aria-busy');
    button.blur();
  },
};

/** Icons before the label, or after it when it shows where the action leads; 8px from the text. */
export const WithIcons: Story = {
  name: 'With icons',
  render: frame('icons'),
  parameters: {
    docs: {
      source: {
        code: `<!-- Registered with provideAveIcons([lucidePlus, lucideDownload, lucideArrowRight, lucideFunnel]). -->
<button aveButton type="button" variant="primary"><ave-icon name="plus" decorative />Create document</button>
<button aveButton type="button"><ave-icon name="download" decorative />Download report</button>
<button aveButton type="button">Next step<ave-icon name="arrow-right" decorative /></button>
<button aveButton type="button" variant="ghost" size="sm"><ave-icon name="funnel" decorative />Filters</button>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    for (const button of canvasElement.querySelectorAll('button')) {
      const content = button.querySelector('.content');
      const icon = button.querySelector('ave-icon')?.getBoundingClientRect();
      const frame = button.getBoundingClientRect();
      if (content === null || icon === undefined) throw new Error('No icon');
      await expect(getComputedStyle(content).columnGap).toBe(
        getComputedStyle(button).getPropertyValue('--ave-space-2'),
      );
      // The icon sits on the middle of the button, within half a pixel.
      await expect(Math.abs(icon.top + icon.height / 2 - (frame.top + frame.height / 2))).toBeLessThanOrEqual(0.5);
    }
  },
};

/** Long Russian and Uzbek labels wrap and the button grows; a row of buttons wraps instead of overflowing. */
export const LongText: Story = {
  name: 'Long text',
  render: frame('long'),
  parameters: {
    docs: {
      source: {
        code: `<button aveButton type="button" variant="primary" lang="ru">
  Отправить документ на согласование руководителю отдела
</button>
<button aveButton type="button" lang="uz-Latn">Hujjatni boʻlim boshligʻiga kelishish uchun yuborish</button>
<button aveButton type="button" variant="ghost" lang="uz-Cyrl">
  Ҳужжатни бўлим бошлиғига келишиш учун юбориш
</button>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    for (const button of canvasElement.querySelectorAll('button')) {
      await expect(button.scrollWidth, button.textContent).toBeLessThanOrEqual(button.clientWidth);
    }
    const column = canvasElement.querySelector('[data-column]');
    const row = canvasElement.querySelector('[data-row]');
    if (column === null || row === null) throw new Error('No layout');
    await expect(column.scrollWidth).toBeLessThanOrEqual(column.clientWidth);
    await expect(row.scrollWidth).toBeLessThanOrEqual(row.clientWidth);
    const wrapped = column.querySelector('button');
    await expect(wrapped?.getBoundingClientRect().height).toBeGreaterThan(px(column, '--ave-control-height-md'));
  },
};

/** Links that look like buttons, in every variant; a disabled link cannot be followed. */
export const Links: Story = {
  render: frame('links'),
  parameters: {
    docs: {
      source: {
        code: `<a aveButton variant="primary" href="/documents/new">Send for approval</a>
<a aveButton href="/documents/draft">Save draft</a>
<a aveButton variant="ghost" href="/documents/preview">Preview</a>
<a aveButton variant="danger" href="/documents/delete">Delete document</a>
<a aveButton href="/archive" disabled>Open archive</a>
<a aveButton href="/archive" disabled disabledInteractive>Open archive</a>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const links = within(canvasElement).getAllByRole('link');
    await expect(links).toHaveLength(6);
    const [disabled, focusable] = links.slice(4);
    await expect(disabled).toHaveAttribute('aria-disabled', 'true');
    await expect(disabled).toHaveAttribute('tabindex', '-1');
    await expect(focusable).toHaveAttribute('aria-disabled', 'true');
    await expect(focusable).not.toHaveAttribute('tabindex');
  },
};
