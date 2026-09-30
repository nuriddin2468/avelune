import { Component, LOCALE_ID, input, signal } from '@angular/core';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, within } from 'storybook/test';
import { AveBanner, type AveAlertVariant } from '@avelune/ui/alert';

type View = 'default' | 'variants' | 'long';

const variants = [
  { variant: 'info', message: 'Доступна новая версия справочника контрагентов.' },
  { variant: 'success', message: 'Лицензия продлена до 31.12.2027.' },
  { variant: 'warning', message: 'В субботу с 22:00 до 02:00 система будет недоступна.' },
  { variant: 'danger', message: 'Сервер согласования не отвечает. Договоры сохраняются, но не отправляются.' },
] as const satisfies readonly { variant: AveAlertVariant; message: string }[];

/** The frame the stories draw banners in: across the top of a page. Styled with tokens only. */
@Component({
  selector: 'ave-banner-stories',
  imports: [AveBanner],
  template: `
    @switch (view()) {
      @case ('variants') {
        <div class="stack" lang="ru">
          @for (item of variants; track item.variant) {
            <ave-banner [variant]="item.variant">{{ item.message }}</ave-banner>
          }
          <ave-banner variant="warning" dismissible>
            Лицензия истекает через 5 дней. <a href="#licence">Продлить лицензию</a>
          </ave-banner>
        </div>
      }
      @case ('long') {
        <div class="stack">
          <ave-banner variant="warning" dismissible lang="uz-Latn">
            Shanba kuni soat 22:00 dan 02:00 gacha tizimda rejali texnik ishlar olib boriladi, bu vaqtda hujjatlarni
            yuborish va kelishish imkoniyati boʻlmaydi. <a href="#works">Batafsil</a>
          </ave-banner>
          <ave-banner variant="info" lang="ru">
            С 1 апреля 2026 года договоры с суммой больше одного миллиарда сумов согласует финансовый директор.
          </ave-banner>
        </div>
      }
      @default {
        <div class="page" lang="ru">
          <ave-banner variant="warning" dismissible>
            В субботу с 22:00 до 02:00 система будет недоступна. <a href="#works">Подробнее о работах</a>
          </ave-banner>
          <div class="content">
            <h1 class="title">Договоры</h1>
            <p class="muted">Реестр договоров подразделения.</p>
          </div>
        </div>
      }
    }
  `,
  styleUrl: './alert.stories.css',
})
class BannerStories {
  readonly view = input<View>('default');
  protected readonly variants = variants;
}

/** A banner the person closes: the page removes it and remembers. */
@Component({
  selector: 'ave-banner-dismiss',
  imports: [AveBanner],
  template: `
    <div class="page" lang="ru">
      @if (!seen()) {
        <ave-banner variant="info" dismissible (dismiss)="seen.set(true)">
          Доступна новая версия справочника контрагентов.
        </ave-banner>
      }
      <div class="content">
        <h1 class="title">Контрагенты</h1>
        <p class="muted" role="status">{{ seen() ? 'Сообщение скрыто.' : '' }}</p>
      </div>
    </div>
  `,
  styleUrl: './alert.stories.css',
})
class BannerDismiss {
  protected readonly seen = signal(false);
}

type Story = StoryObj<BannerStories>;

function frame(view: View): NonNullable<Story['render']> {
  return () => ({
    props: { view },
    template: `<ave-banner-stories [view]="view" />`,
    moduleMetadata: { imports: [BannerStories] },
  });
}

/** The kit's own words (the icons' kinds, Close) in the stories' language. */
function locale(value: string): ReturnType<typeof applicationConfig> {
  return applicationConfig({ providers: [{ provide: LOCALE_ID, useValue: value }] });
}

/**
 * A banner is one row of the small control height, 40px, while its message is one line, and a line of body text
 * (20px) taller for each line more: its message's rows (32px, then 20px each) plus 8px, at any width.
 */
async function expectRows(banner: Element): Promise<void> {
  const message = banner.querySelector('.message')?.getBoundingClientRect().height ?? 0;
  const lines = Math.round((message - 12) / 20);
  await expect(banner.getBoundingClientRect().height).toBe(40 + 20 * (lines - 1));
}

const meta: Meta<BannerStories> = {
  title: 'Components/Banner',
  component: AveBanner,
  decorators: [locale('ru')],
};
export default meta;

/** Planned maintenance across the top of a page, with a link and a close button. */
export const Default: Story = {
  render: frame('default'),
  parameters: {
    docs: {
      source: {
        code: `<ave-banner variant="warning" dismissible (dismiss)="maintenanceSeen.set(true)">
  В субботу с 22:00 до 02:00 система будет недоступна. <a href="/maintenance">Подробнее о работах</a>
</ave-banner>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const banner = within(canvasElement).getByRole('alert');
    await expect(within(banner).getByRole('button', { name: 'Закрыть' })).toBeVisible();
    await expectRows(banner);
  },
};

/** Four variants, and one that may be closed: each 40px tall on one line. */
export const Variants: Story = {
  tags: ['forced-colors'],
  render: frame('variants'),
  parameters: {
    docs: {
      source: {
        code: `<ave-banner variant="info">Доступна новая версия справочника контрагентов.</ave-banner>
<ave-banner variant="success">Лицензия продлена до 31.12.2027.</ave-banner>
<ave-banner variant="warning">В субботу с 22:00 до 02:00 система будет недоступна.</ave-banner>
<ave-banner variant="danger">Сервер согласования не отвечает. Договоры сохраняются, но не отправляются.</ave-banner>
<ave-banner variant="warning" dismissible (dismiss)="licenceSeen.set(true)">
  Лицензия истекает через 5 дней. <a href="/licence">Продлить лицензию</a>
</ave-banner>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    for (const banner of canvasElement.querySelectorAll('ave-banner')) await expectRows(banner);
  },
};

/** Long messages wrap; the icon and the close button stay on the first line. */
export const LongText: Story = {
  name: 'Long text',
  decorators: [locale('uz-Latn')],
  render: frame('long'),
  parameters: {
    docs: {
      source: {
        code: `<ave-banner variant="warning" dismissible (dismiss)="worksSeen.set(true)">
  Shanba kuni soat 22:00 dan 02:00 gacha tizimda rejali texnik ishlar olib boriladi, bu vaqtda hujjatlarni yuborish
  va kelishish imkoniyati boʻlmaydi. <a href="/maintenance">Batafsil</a>
</ave-banner>
<ave-banner variant="info">
  С 1 апреля 2026 года договоры с суммой больше одного миллиарда сумов согласует финансовый директор.
</ave-banner>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const [first] = canvasElement.querySelectorAll('ave-banner');
    const icon = first?.querySelector('.icon')?.getBoundingClientRect();
    const close = first?.querySelector('.close')?.getBoundingClientRect();
    await expect(close?.top).toBe((icon?.top ?? 0) - 6);
    await expect((first?.getBoundingClientRect().height ?? 0) % 4).toBe(0);
  },
};

/** Closing the banner: it emits dismiss, and the page removes it. */
export const Dismiss: Story = {
  render: () => ({ template: '<ave-banner-dismiss />', moduleMetadata: { imports: [BannerDismiss] } }),
  parameters: {
    docs: {
      source: {
        code: `@if (!seen()) {
  <ave-banner variant="info" dismissible (dismiss)="seen.set(true)">
    Доступна новая версия справочника контрагентов.
  </ave-banner>
}`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Закрыть' }));
    await expect(canvas.queryByRole('status', { name: /справочника/ })).toBeNull();
    await expect(canvasElement.querySelector('ave-banner')).toBeNull();
    await expect(canvas.getByText('Сообщение скрыто.')).toBeVisible();
  },
};
