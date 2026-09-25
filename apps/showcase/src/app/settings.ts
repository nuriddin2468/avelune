import { Component, signal } from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { AveChoice } from '@avelune/ui/checkbox';
import { AveSwitch } from '@avelune/ui/switch';

interface Notices {
  approved: boolean;
  rejected: boolean;
  digest: boolean;
}

/**
 * A settings screen: settings that take effect as soon as they change, so there is no Save button; the status line
 * says each change was saved.
 */
@Component({
  selector: 'ave-showcase-settings',
  imports: [AveChoice, AveSwitch, FormField],
  template: `
    <section class="card" lang="ru" aria-labelledby="notices-title">
      <header class="header">
        <h1 class="title" id="notices-title">Уведомления</h1>
        <p class="note">Изменения сохраняются сразу.</p>
      </header>
      <div class="list">
        <label aveChoice (change)="saved()">
          <input type="checkbox" aveSwitch [formField]="notices.approved" />
          Письмо, когда договор согласован
        </label>
        <label aveChoice (change)="saved()">
          <input type="checkbox" aveSwitch [formField]="notices.rejected" />
          Письмо, когда договор отклонён или возвращён на доработку
        </label>
        <label aveChoice (change)="saved()">
          <input type="checkbox" aveSwitch [formField]="notices.digest" />
          Еженедельная сводка по договорам подразделения
        </label>
      </div>
      <p class="status" role="status">{{ status() }}</p>
    </section>
  `,
  styleUrl: './settings.css',
})
export class SettingsPage {
  protected readonly model = signal<Notices>({ approved: true, rejected: true, digest: false });
  protected readonly notices = form(this.model);
  protected readonly status = signal('');

  protected saved(): void {
    this.status.set('Сохранено.');
  }
}
