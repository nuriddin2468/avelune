import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AveAlert } from '@avelune/ui/alert';
import { AveBadge } from '@avelune/ui/badge';
import { AveButton } from '@avelune/ui/button';
import { AveCheckbox, AveChoice } from '@avelune/ui/checkbox';
import { AveFileUpload } from '@avelune/ui/file-upload';
import { AveError, AveFormField, AveHint } from '@avelune/ui/form-field';
import { AveInput } from '@avelune/ui/input';
import { AveLink } from '@avelune/ui/link';
import { AveSelect, type AveOption } from '@avelune/ui/select';
import {
  AveTheme,
  aveBrandPresetNames,
  aveBrandPresets,
  type AveBrandAdjustment,
  type AveBrandPresetName,
} from '@avelune/ui/theme';
import { Branding } from './branding';

/** A preset, or the organisation's own colour. */
type Choice = AveBrandPresetName | 'own';

/** The presets' names, in Russian. */
const names: Record<AveBrandPresetName, string> = {
  orange: 'Оранжевый, цвет продукта',
  red: 'Красный',
  yellow: 'Жёлтый',
  green: 'Зелёный',
  teal: 'Бирюзовый',
  cyan: 'Голубой',
  blue: 'Синий',
  navy: 'Тёмно-синий',
  indigo: 'Индиго',
  purple: 'Фиолетовый',
  magenta: 'Пурпурный',
  graphite: 'Графитовый',
};

/** A colour's swatch for its option: a 20px rounded square. */
function swatch(hex: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='20' height='20'><rect width='20' height='20' rx='4' fill='${hex}'/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** A `#rrggbb` colour, as the generator takes it (ADR 0089). */
function isColour(value: string): value is `#${string}` {
  return /^#[0-9a-f]{6}$/i.test(value);
}

/** What the generator changed, in the words of a settings screen (ADR 0089). */
function explain(adjustment: AveBrandAdjustment): string {
  const theme = (value: 'light' | 'dark') => (value === 'light' ? 'светлой' : 'тёмной');
  switch (adjustment.kind) {
    case 'fill':
      return `Кнопки и отмеченные поля в ${theme(adjustment.theme)} теме — оттенок ${adjustment.hex.toUpperCase()}, чтобы ${adjustment.text === 'light' ? 'белый' : 'тёмный'} текст на них читался.`;
    case 'chroma':
      return `Оттенок ${String(adjustment.step)} стал спокойнее, чтобы текст и границы на нём оставались различимы.`;
    case 'danger':
      return 'Цвет удаления и ошибок сдвинут от цвета бренда, чтобы опасное действие не походило на основное.';
    case 'near-status': {
      const status = { info: 'сведений', success: 'успеха', warning: 'предупреждений' }[adjustment.status];
      return `В ${theme(adjustment.theme)} теме цвет бренда близок к цвету ${status}; сообщения по-прежнему отличаются значком и словами.`;
    }
  }
}

/** Reads an uploaded image as a data URL, for the bar to show it. */
function read(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      // readAsDataURL gives a string.
      resolve(typeof reader.result === 'string' ? reader.result : '');
    });
    reader.addEventListener('error', () => {
      reject(reader.error ?? new Error('The file did not read.'));
    });
    reader.readAsDataURL(file);
  });
}

/**
 * The settings' brand section, the tenant's branding screen (ADR 0089, 0099): the organisation's colour, a preset or
 * its own, and its logos for the light and the dark bar; a preview in both themes; and what the generator adapted so
 * that every text and boundary stays readable.
 */
@Component({
  selector: 'ave-showcase-settings-brand',
  imports: [
    AveAlert,
    AveBadge,
    AveButton,
    AveCheckbox,
    AveChoice,
    AveError,
    AveFileUpload,
    AveFormField,
    AveHint,
    AveInput,
    AveLink,
    AveSelect,
    RouterLink,
  ],
  template: `
    <section class="section" aria-labelledby="brand-title" lang="ru">
      <div class="intro">
        <h2 class="title" id="brand-title">Бренд организации</h2>
        <p class="muted">
          Цвет и логотип видят все сотрудники организации. Оттенки для кнопок и текста подбираются сами, чтобы всё
          оставалось читаемым.
        </p>
      </div>

      <div class="fields">
        <ave-form-field label="Цвет бренда">
          <ave-select [options]="options" [value]="choice()" (valueChange)="choose($event)" required />
        </ave-form-field>
        @if (choice() === 'own') {
          <ave-form-field label="Свой цвет">
            <input
              aveInput
              type="text"
              autocomplete="off"
              spellcheck="false"
              placeholder="#1F6FD6"
              [value]="own()"
              [attr.aria-invalid]="ownInvalid() ? 'true' : null"
              (change)="setOwn($event)"
            />
            <p aveHint>Шестнадцатеричный код цвета из фирменного стиля, например #1F6FD6.</p>
            @if (ownInvalid()) {
              <p aveError>Укажите код из шести знаков после #, например #1F6FD6.</p>
            }
          </ave-form-field>
        }
        <ave-form-field label="Логотип для светлой темы">
          <ave-file-upload
            accept="image/svg+xml,image/png"
            [maxSize]="logoLimit"
            (valueChange)="upload('light', $event)"
          />
          <p aveHint>SVG или PNG до 512 КБ, высотой от 64 пикселей.</p>
        </ave-form-field>
        <ave-form-field label="Логотип для тёмной темы">
          <ave-file-upload
            accept="image/svg+xml,image/png"
            [maxSize]="logoLimit"
            (valueChange)="upload('dark', $event)"
          />
          <p aveHint>Если светлый логотип плохо виден на тёмном фоне. Без него остаётся светлый.</p>
        </ave-form-field>
      </div>

      <div class="preview-section">
        <h3 class="subtitle" id="preview-title">Как это выглядит</h3>
        <div class="previews" role="group" aria-labelledby="preview-title">
          @for (preview of previews; track preview.theme) {
            <div class="preview" [attr.data-theme]="preview.theme" [attr.aria-label]="preview.label" role="group">
              <div class="bar">
                <!-- eslint-disable-next-line @angular-eslint/template/prefer-ngsrc -- NgOptimizedImage refuses the data URL of an uploaded logo (NG02952). -->
                <img class="logo" [src]="preview.theme === 'dark' ? darkLogo() : lightLogo()" alt="" />
                <span class="product">Документооборот</span>
              </div>
              <div class="sample">
                <p>Договор <a aveLink routerLink="/contracts/114">ДК-2026/114</a> ждёт согласования.</p>
                <label aveChoice><input type="checkbox" aveCheckbox checked /> Уведомить контрагента</label>
                <div class="row">
                  <ave-badge variant="success">Подписан</ave-badge>
                  <button aveButton type="button" size="sm">Отмена</button>
                  <button aveButton type="button" size="sm" variant="primary">Отправить</button>
                </div>
              </div>
            </div>
          }
        </div>
      </div>

      @if (notes().length > 0) {
        <ave-alert variant="info" heading="Что подобрано для читаемости">
          <ul class="notes">
            @for (note of notes(); track note) {
              <li>{{ note }}</li>
            }
          </ul>
        </ave-alert>
      }

      <div class="actions">
        <button aveButton type="button" [disabled]="appearance.brand() === null" (click)="reset()">
          Вернуть цвет продукта
        </button>
      </div>
    </section>
  `,
  styleUrl: './settings-brand.css',
})
export class BrandSection {
  protected readonly appearance = inject(AveTheme);
  private readonly branding = inject(Branding);
  protected readonly logoLimit = 512 * 1024;

  protected readonly options: readonly AveOption<Choice>[] = [
    ...aveBrandPresetNames.map((name) => ({
      value: name,
      label: names[name],
      image: swatch(aveBrandPresets[name]),
      meta: aveBrandPresets[name].toUpperCase(),
    })),
    { value: 'own', label: 'Свой цвет', description: 'Код из фирменного стиля организации' },
  ];

  /** What the person chose: the brand the page shows, or the product's orange. */
  protected readonly choice = signal<Choice>('orange');
  protected readonly own = signal('');
  protected readonly ownInvalid = signal(false);

  protected readonly previews = [
    { theme: 'light', label: 'Светлая тема' },
    { theme: 'dark', label: 'Тёмная тема' },
  ] as const;
  protected readonly lightLogo = computed(() => this.branding.logo().src);
  protected readonly darkLogo = computed(() => this.branding.logo().darkSrc ?? this.branding.logo().src);

  /** What the generator adapted, in words; the fill for each theme first. */
  protected readonly notes = computed(() => {
    const report = this.appearance.brandReport();
    if (report === null) return [];
    const exact = report.exact
      ? []
      : ['Сам цвет бренда остаётся для логотипа и отметок: для кнопок он слишком светлый или тёмный.'];
    return [...exact, ...report.adjustments.map(explain)];
  });

  constructor() {
    // The brand the page shows chooses the option: a stored brand, or one another tab set.
    effect(() => {
      const brand = this.appearance.brand();
      untracked(() => {
        const preset = aveBrandPresetNames.find((name) => name === brand);
        if (brand === null) this.choice.set('orange');
        else if (preset !== undefined) this.choice.set(preset);
        else {
          this.choice.set('own');
          this.own.set(brand.toUpperCase());
        }
      });
    });
  }

  protected choose(choice: Choice | null): void {
    if (choice === null) return;
    this.choice.set(choice);
    if (choice !== 'own') void this.appearance.setBrand(choice === 'orange' ? null : choice);
  }

  protected setOwn(event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) return;
    const value = event.target.value.trim().toLowerCase();
    this.own.set(value.toUpperCase());
    this.ownInvalid.set(!isColour(value));
    if (isColour(value)) void this.appearance.setBrand(value);
  }

  /** A logo uploaded, or taken away: the bar shows it at once. */
  protected upload(theme: 'light' | 'dark', files: readonly File[]): void {
    const logo = theme === 'light' ? this.branding.light : this.branding.dark;
    const [file] = files;
    if (file === undefined) {
      logo.set(null);
      return;
    }
    void read(file).then((url) => {
      logo.set(url);
    });
  }

  protected reset(): void {
    void this.appearance.setBrand(null);
    this.own.set('');
    this.ownInvalid.set(false);
  }
}
