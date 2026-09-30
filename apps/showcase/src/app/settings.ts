import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { lucideBell, lucidePalette, lucideStamp, lucideUser } from '@avelune/icons/lucide';
import { provideAveIcons } from '@avelune/ui/icon';
import { AveSettingsPage, type AveSettingsSection } from '@avelune/ui/settings-page';

/**
 * The product's settings on the kit's settings page (ADR 0099): the person's profile, the screens' look, the
 * organisation's brand and the letters the person gets, each a page with its own address.
 */
@Component({
  selector: 'ave-showcase-settings',
  imports: [AveSettingsPage, RouterOutlet],
  providers: [provideAveIcons([lucideBell, lucidePalette, lucideStamp, lucideUser])],
  template: `
    <ave-settings-page
      heading="Настройки"
      description="Изменения сохраняются сразу."
      home="/settings"
      [sections]="sections"
      lang="ru"
    >
      <router-outlet />
    </ave-settings-page>
  `,
})
export class SettingsScreen {
  protected readonly sections: readonly AveSettingsSection[] = [
    { label: 'Профиль', link: '/settings/profile', icon: 'user' },
    { label: 'Оформление', link: '/settings/appearance', icon: 'palette' },
    { label: 'Бренд организации', link: '/settings/brand', icon: 'stamp' },
    { label: 'Уведомления', link: '/settings/notifications', icon: 'bell' },
  ];
}

/** The settings' own address: nothing of its own; on a phone the list of sections shows there. */
@Component({ selector: 'ave-showcase-settings-index', template: '' })
export class SettingsIndex {}
