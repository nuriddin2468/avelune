import { Component, LOCALE_ID, inject, input, type OnInit } from '@angular/core';
import { Router, RouterOutlet, provideRouter, withHashLocation } from '@angular/router';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { lucideBell, lucidePalette, lucideStamp, lucideUser } from '@avelune/icons/lucide';
import { AveChoice } from '@avelune/ui/checkbox';
import { AveChoiceGroup, AveFormField } from '@avelune/ui/form-field';
import { provideAveIcons } from '@avelune/ui/icon';
import { AveInput } from '@avelune/ui/input';
import { AveRadio } from '@avelune/ui/radio';
import { AveSettingsPage, type AveSettingsSection } from '@avelune/ui/settings-page';
import { AveSwitch } from '@avelune/ui/switch';

type View = 'default' | 'phone' | 'long';

/** A section of the stories' settings: the person's profile. */
@Component({
  selector: 'ave-settings-profile',
  imports: [AveFormField, AveInput],
  template: `
    <section class="section" aria-labelledby="profile-title">
      <h2 id="profile-title">Профиль</h2>
      <ave-form-field label="Имя и фамилия"><input aveInput type="text" value="Азиза Каримова" /></ave-form-field>
      <ave-form-field label="Должность"><input aveInput type="text" value="Директор департамента" /></ave-form-field>
    </section>
  `,
  styleUrl: './settings-page.stories.css',
})
class ProfileSection {}

/** A section of the stories' settings: the look of the screens. */
@Component({
  selector: 'ave-settings-appearance',
  imports: [AveChoice, AveChoiceGroup, AveRadio],
  template: `
    <section class="section" aria-labelledby="appearance-title">
      <h2 id="appearance-title">Оформление</h2>
      <fieldset aveChoiceGroup legend="Тема">
        <label aveChoice><input type="radio" aveRadio name="theme" checked /> Как в системе</label>
        <label aveChoice><input type="radio" aveRadio name="theme" /> Светлая</label>
        <label aveChoice><input type="radio" aveRadio name="theme" /> Тёмная</label>
      </fieldset>
    </section>
  `,
  styleUrl: './settings-page.stories.css',
})
class AppearanceSection {}

/** A section of the stories' settings: the letters the person gets. */
@Component({
  selector: 'ave-settings-notifications',
  imports: [AveChoice, AveSwitch],
  template: `
    <section class="section" aria-labelledby="notifications-title">
      <h2 id="notifications-title">Уведомления</h2>
      <label aveChoice><input type="checkbox" aveSwitch checked /> Письмо, когда договор согласован</label>
    </section>
  `,
  styleUrl: './settings-page.stories.css',
})
class NotificationsSection {}

/** The settings' own address: nothing of its own, the list shows on a phone. */
@Component({ selector: 'ave-settings-index', template: '' })
class SettingsIndex {}

const sections: readonly AveSettingsSection[] = [
  { label: 'Профиль', link: '/settings/profile', icon: 'user' },
  { label: 'Оформление', link: '/settings/appearance', icon: 'palette' },
  { label: 'Бренд организации', link: '/settings/brand', icon: 'stamp' },
  { label: 'Уведомления', link: '/settings/notifications', icon: 'bell' },
];

const uzSections: readonly AveSettingsSection[] = [
  { label: 'Shaxsiy maʼlumotlar va hisob qaydnomasi', link: '/settings/profile', icon: 'user' },
  { label: 'Tashkilotning brendi va logotipi', link: '/settings/brand', icon: 'stamp' },
];

/** The frame the stories draw settings in: a product's settings page around its router outlet. */
@Component({
  selector: 'ave-settings-page-stories',
  imports: [AveSettingsPage, RouterOutlet],
  providers: [provideAveIcons([lucideBell, lucidePalette, lucideStamp, lucideUser])],
  template: `
    <div class="frame" [attr.data-narrow]="view() === 'phone' ? '' : null">
      @if (view() === 'long') {
        <ave-settings-page
          heading="Tizim va tashkilot sozlamalari"
          description="Oʻzgarishlar darhol saqlanadi."
          sectionsLabel="Sozlamalar boʻlimlari"
          backLabel="Barcha sozlamalar"
          [sections]="uzSections"
          lang="uz-Latn"
        >
          <router-outlet />
        </ave-settings-page>
      } @else {
        <ave-settings-page
          heading="Настройки"
          description="Изменения сохраняются сразу."
          [sections]="sections"
          lang="ru"
        >
          <router-outlet />
        </ave-settings-page>
      }
    </div>
  `,
  styleUrl: './settings-page.stories.css',
})
class SettingsPageStories implements OnInit {
  readonly view = input<View>('default');
  /** The address the story opens on. */
  readonly url = input('/settings');
  protected readonly sections = sections;
  protected readonly uzSections = uzSections;
  private readonly router = inject(Router);

  ngOnInit(): void {
    void this.router.navigateByUrl(this.url());
  }
}

type Story = StoryObj<SettingsPageStories>;

function frame(view: View, url = '/settings'): NonNullable<Story['render']> {
  return () => ({
    props: { view, url },
    template: `<ave-settings-page-stories [view]="view" [url]="url" />`,
    moduleMetadata: { imports: [SettingsPageStories] },
  });
}

/** Whether the story's page is narrower than container.md, where the list and a section show in turn. */
function narrow(canvasElement: HTMLElement): boolean {
  const back = canvasElement.querySelector('ave-settings-page .section > a');
  return back !== null && getComputedStyle(back).display !== 'none';
}

const meta: Meta<SettingsPageStories> = {
  title: 'Patterns/Settings page',
  component: AveSettingsPage,
  decorators: [
    applicationConfig({
      // Hash locations keep a followed link inside Storybook's frame.
      providers: [
        { provide: LOCALE_ID, useValue: 'ru' },
        provideRouter(
          [
            {
              path: 'settings',
              children: [
                { path: '', component: SettingsIndex },
                { path: 'profile', component: ProfileSection },
                { path: 'appearance', component: AppearanceSection },
                { path: 'brand', component: ProfileSection },
                { path: 'notifications', component: NotificationsSection },
              ],
            },
            { path: '**', redirectTo: 'settings' },
          ],
          withHashLocation(),
        ),
      ],
    }),
  ],
};
export default meta;

/** The sections in a column; the settings' own address opens the first. On a phone, the list of sections. */
export const Default: Story = {
  tags: ['forced-colors'],
  render: frame('default'),
  parameters: {
    docs: {
      source: {
        code: `import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { lucideBell, lucidePalette, lucideStamp, lucideUser } from '@avelune/icons/lucide';
import { provideAveIcons } from '@avelune/ui/icon';
import { AveSettingsPage, type AveSettingsSection } from '@avelune/ui/settings-page';

@Component({
  selector: 'app-settings',
  imports: [AveSettingsPage, RouterOutlet],
  providers: [provideAveIcons([lucideBell, lucidePalette, lucideStamp, lucideUser])],
  template: \`
    <ave-settings-page
      heading="Настройки"
      description="Изменения сохраняются сразу."
      home="/settings"
      [sections]="sections"
    >
      <router-outlet />
    </ave-settings-page>
  \`,
})
export class Settings {
  protected readonly sections: readonly AveSettingsSection[] = [
    { label: 'Профиль', link: '/settings/profile', icon: 'user' },
    { label: 'Оформление', link: '/settings/appearance', icon: 'palette' },
    { label: 'Бренд организации', link: '/settings/brand', icon: 'stamp' },
    { label: 'Уведомления', link: '/settings/notifications', icon: 'bell' },
  ];
}`,
        language: 'typescript',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('heading', { level: 1, name: 'Настройки' })).toBeVisible();
    const nav = within(canvas.getByRole('navigation', { name: 'Разделы настроек' }));
    if (narrow(canvasElement)) return;
    await waitFor(() => expect(nav.getByRole('link', { name: 'Профиль' })).toHaveAttribute('aria-current', 'page'));
    await expect(canvas.getByRole('heading', { level: 2, name: 'Профиль' })).toBeVisible();
  },
};

/** On a narrow page a section shows alone under the way back to the list, which the link returns to. */
export const Phone: Story = {
  name: 'Section on a phone',
  render: frame('phone', '/settings/appearance'),
  parameters: {
    docs: {
      source: {
        code: `<!-- Below container.md, at a section's address: the section under "Все настройки". -->
<ave-settings-page heading="Настройки" description="Изменения сохраняются сразу." [sections]="sections">
  <router-outlet />
</ave-settings-page>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByRole('heading', { level: 2, name: 'Оформление' })).toBeVisible();
    await expect(narrow(canvasElement)).toBe(true);
    await userEvent.click(canvas.getByRole('link', { name: 'Все настройки' }));
    await waitFor(() => expect(canvas.getByRole('navigation', { name: 'Разделы настроек' })).toBeVisible());
    await userEvent.click(canvas.getByRole('link', { name: 'Уведомления' }));
    await expect(await canvas.findByRole('heading', { level: 2, name: 'Уведомления' })).toBeVisible();
    await waitFor(() => expect(canvas.getByRole('link', { name: 'Все настройки' })).toHaveFocus());
  },
};

/** Long Uzbek names wrap in the column and the heading; nothing scrolls sideways. */
export const LongText: Story = {
  name: 'Long text',
  render: frame('long', '/settings/brand'),
  parameters: {
    docs: {
      source: {
        code: `<ave-settings-page heading="Tizim va tashkilot sozlamalari" description="Oʻzgarishlar darhol saqlanadi." sectionsLabel="Sozlamalar boʻlimlari" backLabel="Barcha sozlamalar" [sections]="sections" lang="uz-Latn">
  <router-outlet />
</ave-settings-page>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const page = canvasElement.querySelector('ave-settings-page');
    await expect(page?.scrollWidth).toBe(page?.clientWidth);
  },
};
