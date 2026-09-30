import { Component, LOCALE_ID, input, signal } from '@angular/core';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { lucideInfo, lucideUser } from '@avelune/icons/lucide';
import { AveButton } from '@avelune/ui/button';
import { AveCheckbox, AveChoice } from '@avelune/ui/checkbox';
import { AveChoiceGroup, AveFormField } from '@avelune/ui/form-field';
import { provideAveIcons } from '@avelune/ui/icon';
import { AveInput } from '@avelune/ui/input';
import { AvePopover } from '@avelune/ui/popover';

type View = 'filters' | 'card' | 'rename' | 'long';

/** The frame the stories draw popovers in: room under the button for the panel. Styled with tokens only. */
@Component({
  selector: 'ave-popover-stories',
  imports: [AveButton, AveCheckbox, AveChoice, AveChoiceGroup, AveFormField, AveInput, AvePopover],
  providers: [provideAveIcons([lucideInfo, lucideUser])],
  template: `
    @switch (view()) {
      @case ('card') {
        <div class="line" lang="ru">
          Ответственный: Каримова Н. А.
          <ave-popover label="Карточка сотрудника" icon="user" variant="ghost" size="sm">
            <div class="person">
              <p class="name">Каримова Нигора Алишеровна</p>
              <p class="muted">Юридический отдел, ведущий юрист</p>
              <p class="muted">+998 71 200 14 52 · karimova&#64;example.uz</p>
            </div>
          </ave-popover>
        </div>
      }
      @case ('rename') {
        <ave-popover label="Переименовать" heading="Название папки" [(open)]="renaming" lang="ru">
          <ave-form-field label="Название">
            <input aveInput type="text" value="Договоры 2026" />
          </ave-form-field>
          <div class="actions">
            <button aveButton type="button" (click)="renaming.set(false)">Отмена</button>
            <button aveButton type="button" variant="primary" (click)="renaming.set(false)">Сохранить</button>
          </div>
        </ave-popover>
      }
      @case ('long') {
        <ave-popover label="Muddatlar haqida" icon="info" variant="ghost" heading="Kelishish muddatlari" lang="uz-Latn">
          <p>
            Oʻzbekiston Respublikasi Vazirlar Mahkamasining qaroriga koʻra, shartnomalar besh ish kuni ichida
            kelishilishi kerak; muddat oʻtganda hujjat avtomatik ravishda boʻlim boshligʻiga yuboriladi.
          </p>
        </ave-popover>
      }
      @default {
        <ave-popover label="Фильтры" heading="Фильтры" [(open)]="filtering" lang="ru">
          <fieldset aveChoiceGroup legend="Статус">
            <label aveChoice><input type="checkbox" aveCheckbox checked /> На согласовании</label>
            <label aveChoice><input type="checkbox" aveCheckbox checked /> Подписан</label>
            <label aveChoice><input type="checkbox" aveCheckbox /> Черновик</label>
            <label aveChoice><input type="checkbox" aveCheckbox /> Истёк</label>
          </fieldset>
          <div class="actions">
            <button aveButton type="button" variant="ghost">Сбросить</button>
            <button aveButton type="button" variant="primary" (click)="filtering.set(false)">Применить</button>
          </div>
        </ave-popover>
      }
    }
  `,
  styleUrl: './popover.stories.css',
})
class PopoverStories {
  readonly view = input<View>('filters');
  protected readonly filtering = signal(false);
  protected readonly renaming = signal(false);
}

type Story = StoryObj<PopoverStories>;

function frame(view: View): NonNullable<Story['render']> {
  return () => ({
    props: { view },
    template: `<ave-popover-stories [view]="view" />`,
    moduleMetadata: { imports: [PopoverStories] },
  });
}

/** The open panel, if any. */
function openPanel(): HTMLElement | null {
  return document.querySelector<HTMLElement>('[role="dialog"].panel');
}

const meta: Meta<PopoverStories> = {
  title: 'Components/Popover',
  component: AvePopover,
  decorators: [applicationConfig({ providers: [{ provide: LOCALE_ID, useValue: 'ru' }] })],
};
export default meta;

/** Filters in a popover: focus goes to the first choice; Apply closes it and focus returns to the button. */
export const Default: Story = {
  render: frame('filters'),
  parameters: {
    docs: {
      source: {
        code: `<ave-popover label="Фильтры" heading="Фильтры" [(open)]="filtersOpen">
  <fieldset aveChoiceGroup legend="Статус">
    <label aveChoice><input type="checkbox" aveCheckbox checked /> На согласовании</label>
    <label aveChoice><input type="checkbox" aveCheckbox checked /> Подписан</label>
    <label aveChoice><input type="checkbox" aveCheckbox /> Черновик</label>
    <label aveChoice><input type="checkbox" aveCheckbox /> Истёк</label>
  </fieldset>
  <div>
    <button aveButton type="button" variant="ghost">Сбросить</button>
    <button aveButton type="button" variant="primary" (click)="filtersOpen.set(false)">Применить</button>
  </div>
</ave-popover>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Фильтры' });
    await userEvent.click(button);
    await waitFor(() => expect(openPanel()).not.toBeNull());
    const panel = within(openPanel() ?? canvasElement);
    await expect(openPanel()).toHaveAccessibleName('Фильтры');
    await waitFor(() => expect(panel.getByRole('checkbox', { name: 'На согласовании' })).toHaveFocus());
    await userEvent.click(panel.getByRole('button', { name: 'Применить' }));
    await waitFor(() => expect(openPanel()).toBeNull());
    await expect(button).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(openPanel()).not.toBeNull());
  },
};

/** An icon alone next to a name: a person's card, which takes focus itself; Escape closes it. */
export const IconOnly: Story = {
  name: 'Icon only',
  render: frame('card'),
  parameters: {
    docs: {
      source: {
        code: `Ответственный: Каримова Н. А.
<ave-popover label="Карточка сотрудника" icon="user" variant="ghost" size="sm">
  <p>Каримова Нигора Алишеровна</p>
  <p>Юридический отдел, ведущий юрист</p>
  <p>+998 71 200 14 52 · karimova&#64;example.uz</p>
</ave-popover>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Карточка сотрудника' });
    await userEvent.click(button);
    await waitFor(() => expect(openPanel()).toHaveFocus());
    await expect(openPanel()).toHaveAccessibleName('Карточка сотрудника');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(openPanel()).toBeNull());
    await expect(button).toHaveFocus();
    await userEvent.click(button);
    await waitFor(() => expect(openPanel()).not.toBeNull());
  },
};

/** A short form: a field and its actions; Cancel closes without saving. */
export const Form: Story = {
  render: frame('rename'),
  parameters: {
    docs: {
      source: {
        code: `<ave-popover label="Переименовать" heading="Название папки" [(open)]="renaming">
  <ave-form-field label="Название">
    <input aveInput type="text" value="Договоры 2026" />
  </ave-form-field>
  <div>
    <button aveButton type="button" (click)="renaming.set(false)">Отмена</button>
    <button aveButton type="button" variant="primary" (click)="rename()">Сохранить</button>
  </div>
</ave-popover>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Переименовать' }));
    await waitFor(() =>
      expect(within(openPanel() ?? canvasElement).getByRole('textbox', { name: 'Название' })).toHaveFocus(),
    );
  },
};

/** Long Uzbek text wraps inside the panel, which never passes a small container's width. */
export const LongText: Story = {
  name: 'Long text',
  render: frame('long'),
  parameters: {
    docs: {
      source: {
        code: `<ave-popover label="Muddatlar haqida" icon="info" variant="ghost" heading="Kelishish muddatlari" lang="uz-Latn">
  <p>
    Oʻzbekiston Respublikasi Vazirlar Mahkamasining qaroriga koʻra, shartnomalar besh ish kuni ichida
    kelishilishi kerak; muddat oʻtganda hujjat avtomatik ravishda boʻlim boshligʻiga yuboriladi.
  </p>
</ave-popover>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Muddatlar haqida' }));
    await waitFor(() => expect(openPanel()).not.toBeNull());
    const panel = openPanel();
    await expect(panel?.getBoundingClientRect().width).toBeLessThanOrEqual(480);
    await expect(panel?.scrollWidth).toBe(panel?.clientWidth);
  },
};
