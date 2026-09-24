import { Component, computed, inject } from '@angular/core';
import { AveIconButton } from '@avelune/ui/button';
import { AveTheme } from '@avelune/ui/theme';
import { ContractForm } from './contract-form';

/**
 * The showcase shell: the application bar, with the theme and density switches the review of the calibration set
 * needs (Wave 1), and the contract form.
 */
@Component({
  selector: 'ave-showcase-root',
  imports: [AveIconButton, ContractForm],
  template: `
    <header class="bar" lang="ru">
      <p class="product">Avelune · Документооборот</p>
      <div class="settings" role="group" aria-label="Вид">
        <button
          aveIconButton
          type="button"
          variant="ghost"
          [icon]="dark() ? 'sun' : 'moon'"
          [label]="dark() ? 'Светлая тема' : 'Тёмная тема'"
          (click)="toggleTheme()"
        ></button>
        <button
          aveIconButton
          type="button"
          variant="ghost"
          [icon]="compact() ? 'rows-2' : 'rows-3'"
          [label]="compact() ? 'Обычная плотность' : 'Компактная плотность'"
          (click)="toggleDensity()"
        ></button>
      </div>
    </header>
    <main class="main">
      <ave-showcase-contract-form />
    </main>
  `,
  styleUrl: './app.css',
})
export class App {
  private readonly appearance = inject(AveTheme);

  /** The showcase starts light; a choice follows the switch, not the system. */
  protected readonly dark = computed(() => this.appearance.theme() === 'dark');
  protected readonly compact = computed(() => this.appearance.density() === 'compact');

  protected toggleTheme(): void {
    this.appearance.setTheme(this.dark() ? 'light' : 'dark');
  }

  protected toggleDensity(): void {
    this.appearance.setDensity(this.compact() ? 'comfortable' : 'compact');
  }
}
