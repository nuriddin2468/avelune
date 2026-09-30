import { Component, computed, inject } from '@angular/core';
import { AveChoice } from '@avelune/ui/checkbox';
import { AveChoiceGroup } from '@avelune/ui/form-field';
import { AveRadio } from '@avelune/ui/radio';
import { AveSwitch } from '@avelune/ui/switch';
import { AveTheme, type AveDensity, type AveThemePreference } from '@avelune/ui/theme';

/** The settings' appearance section: the person's theme, density and motion, which the kit keeps (ADR 0032). */
@Component({
  selector: 'ave-showcase-settings-appearance',
  imports: [AveChoice, AveChoiceGroup, AveRadio, AveSwitch],
  template: `
    <section class="section" aria-labelledby="appearance-title" lang="ru">
      <h2 class="title" id="appearance-title">Оформление</h2>
      <fieldset aveChoiceGroup legend="Тема">
        @for (option of themes; track option.value) {
          <label aveChoice>
            <input
              type="radio"
              aveRadio
              name="theme"
              [value]="option.value"
              [checked]="appearance.theme() === option.value"
              (change)="appearance.setTheme(option.value)"
            />
            {{ option.label }}
          </label>
        }
      </fieldset>
      <fieldset aveChoiceGroup legend="Плотность">
        @for (option of densities; track option.value) {
          <label aveChoice>
            <input
              type="radio"
              aveRadio
              name="density"
              [value]="option.value"
              [checked]="appearance.density() === option.value"
              (change)="appearance.setDensity(option.value)"
            />
            {{ option.label }}
          </label>
        }
      </fieldset>
      <label aveChoice>
        <input type="checkbox" aveSwitch [checked]="reduced()" (change)="toggleMotion()" />
        Меньше движения на экранах
      </label>
    </section>
  `,
  styleUrl: './settings-appearance.css',
})
export class AppearanceSection {
  protected readonly appearance = inject(AveTheme);
  protected readonly reduced = computed(() => this.appearance.motion() === 'reduced');
  protected readonly themes: readonly { value: AveThemePreference; label: string }[] = [
    { value: 'system', label: 'Как в системе' },
    { value: 'light', label: 'Светлая' },
    { value: 'dark', label: 'Тёмная' },
  ];
  protected readonly densities: readonly { value: AveDensity; label: string }[] = [
    { value: 'comfortable', label: 'Обычная' },
    { value: 'compact', label: 'Компактная: больше строк на экране' },
  ];

  protected toggleMotion(): void {
    this.appearance.setMotion(this.reduced() ? 'system' : 'reduced');
  }
}
