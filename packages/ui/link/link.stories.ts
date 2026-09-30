import { Component, LOCALE_ID, input } from '@angular/core';
import { RouterLink, provideRouter, withHashLocation } from '@angular/router';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, within } from 'storybook/test';
import { AveAlert } from '@avelune/ui/alert';
import { AveLink } from '@avelune/ui/link';

type View = 'default' | 'places' | 'long';

/** The frame the stories draw links in: text on a page, and the places a link stands on its own. */
@Component({
  selector: 'ave-link-stories',
  imports: [AveAlert, AveLink, RouterLink],
  template: `
    @switch (view()) {
      @case ('places') {
        <div class="places">
          <ave-alert variant="warning" heading="Есть истёкшие договоры">
            Договор <a aveLink routerLink="/contracts/109">ДК-2025/109</a> истёк 31.12.2025. Продлите или закройте его.
          </ave-alert>
          <ul class="rows" aria-label="Договоры">
            <li><a aveLink routerLink="/contracts/114">Поставка серверного оборудования</a></li>
            <li><a aveLink routerLink="/contracts/113">Перевозка грузов по железной дороге</a></li>
          </ul>
          <p class="hint">Шаблоны договоров — в <a aveLink routerLink="/templates">справочнике шаблонов</a>.</p>
        </div>
      }
      @case ('long') {
        <p class="text narrow" lang="uz-Latn">
          Hujjat
          <a aveLink routerLink="/decrees/214"
            >Oʻzbekiston Respublikasi Vazirlar Mahkamasining 2026-yil 18-martdagi 214-sonli qarori</a
          >
          asosida tayyorlangan;
          <a aveLink href="https://lex.uz/docs/214" target="_blank">qarorning toʻliq matni</a> Lex.uz saytida.
        </p>
      }
      @default {
        <p class="text">
          Договор отправлен на согласование в <a aveLink routerLink="/departments/legal">юридический отдел</a>. Порядок
          согласования описан в
          <a aveLink href="https://lex.uz/docs/1234" target="_blank">регламенте документооборота</a>.
        </p>
      }
    }
  `,
  styleUrl: './link.stories.css',
})
class LinkStories {
  readonly view = input<View>('default');
}

type Story = StoryObj<LinkStories>;

function frame(view: View): NonNullable<Story['render']> {
  return () => ({
    props: { view },
    template: `<ave-link-stories [view]="view" />`,
    moduleMetadata: { imports: [LinkStories] },
  });
}

const meta: Meta<LinkStories> = {
  title: 'Components/Link',
  component: AveLink,
  decorators: [
    applicationConfig({
      // Hash locations keep a followed link inside Storybook's frame.
      providers: [
        { provide: LOCALE_ID, useValue: 'ru' },
        provideRouter([{ path: '**', children: [] }], withHashLocation()),
      ],
    }),
  ],
};
export default meta;

/** Links inside text: underlined in the link colour; the one that opens a new tab says so. */
export const Default: Story = {
  tags: ['forced-colors'],
  render: frame('default'),
  parameters: {
    docs: {
      source: {
        code: `Договор отправлен на согласование в <a aveLink routerLink="/departments/legal">юридический отдел</a>.
Порядок согласования описан в
<a aveLink href="https://lex.uz/docs/1234" target="_blank">регламенте документооборота</a>.`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const inner = canvas.getByRole('link', { name: 'юридический отдел' });
    await expect(getComputedStyle(inner).textDecorationLine).toBe('underline');
    await expect(
      canvas.getByRole('link', { name: 'регламенте документооборота откроется в новой вкладке' }),
    ).toHaveAttribute('target', '_blank');
    await userEvent.tab();
    await expect(inner).toHaveFocus();
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

/** A link in an alert's tinted message, a record's name in a list, and a hint under a form. */
export const Places: Story = {
  render: frame('places'),
  parameters: {
    docs: {
      source: {
        code: `<ave-alert variant="warning" heading="Есть истёкшие договоры">
  Договор <a aveLink routerLink="/contracts/109">ДК-2025/109</a> истёк 31.12.2025. Продлите или закройте его.
</ave-alert>

<ul aria-label="Договоры">
  <li><a aveLink routerLink="/contracts/114">Поставка серверного оборудования</a></li>
  <li><a aveLink routerLink="/contracts/113">Перевозка грузов по железной дороге</a></li>
</ul>

<p>Шаблоны договоров — в <a aveLink routerLink="/templates">справочнике шаблонов</a>.</p>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole('link')).toHaveLength(4);
    for (const link of canvas.getAllByRole('link')) {
      await expect(getComputedStyle(link).textDecorationLine).toBe('underline');
    }
  },
};

/** A long Uzbek link wraps with the text around it in a narrow column, underlined on every line. */
export const LongText: Story = {
  name: 'Long text',
  render: frame('long'),
  parameters: {
    docs: {
      source: {
        code: `Hujjat
<a aveLink routerLink="/decrees/214">Oʻzbekiston Respublikasi Vazirlar Mahkamasining 2026-yil 18-martdagi 214-sonli qarori</a>
asosida tayyorlangan;
<a aveLink href="https://lex.uz/docs/214" target="_blank">qarorning toʻliq matni</a> Lex.uz saytida.`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const text = canvasElement.querySelector('.text');
    await expect(text?.scrollWidth).toBe(text?.clientWidth);
    const link = within(canvasElement).getByRole('link', { name: /214-sonli qarori/ });
    await expect(link.getClientRects().length).toBeGreaterThan(1);
  },
};
