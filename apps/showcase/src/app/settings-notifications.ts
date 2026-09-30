import { Component, signal } from '@angular/core';
import { FormField, form } from '@angular/forms/signals';
import { AveChoice } from '@avelune/ui/checkbox';
import { AveFormField, AveHint } from '@avelune/ui/form-field';
import { AveRangeSlider, type AveNumberRange } from '@avelune/ui/slider';
import { AveSpinner } from '@avelune/ui/spinner';
import { AveSwitch } from '@avelune/ui/switch';

interface Notices {
  approved: boolean;
  rejected: boolean;
  digest: boolean;
  hours: AveNumberRange;
}

/**
 * The settings' notifications section: settings that take effect as soon as they change, so there is no Save button.
 * Each change goes to a pretend server; the status line shows the kit's spinner while a save takes long, then says it
 * was saved.
 */
@Component({
  selector: 'ave-showcase-settings-notifications',
  imports: [AveChoice, AveFormField, AveHint, AveRangeSlider, AveSpinner, AveSwitch, FormField],
  template: `
    <section class="section" aria-labelledby="notices-title" lang="ru">
      <h2 class="title" id="notices-title">Уведомления</h2>
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
      <ave-form-field class="hours" label="Часы доставки писем">
        <ave-range-slider [maxValue]="24" [format]="hours" [formField]="notices.hours" (change)="saved()" />
        <p aveHint>Письма, пришедшие ночью, ждут начала этого окна.</p>
      </ave-form-field>
      <p class="status" role="status">
        <ave-spinner size="sm" label="Сохранение" [loading]="saving()" />
        {{ status() }}
      </p>
    </section>
  `,
  styleUrl: './settings-notifications.css',
})
export class NotificationsSection {
  protected readonly model = signal<Notices>({
    approved: true,
    rejected: true,
    digest: false,
    hours: { start: 9, end: 18 },
  });
  protected readonly hours: Intl.NumberFormatOptions = { style: 'unit', unit: 'hour' };
  protected readonly notices = form(this.model);
  protected readonly status = signal('');
  protected readonly saving = signal(false);
  private pending: ReturnType<typeof setTimeout> | undefined;

  /** A change is saved on the pretend server, which takes long enough for the spinner to show. */
  protected saved(): void {
    clearTimeout(this.pending);
    this.status.set('');
    this.saving.set(true);
    this.pending = setTimeout(() => {
      this.saving.set(false);
      this.status.set('Сохранено.');
    }, 900);
  }
}
