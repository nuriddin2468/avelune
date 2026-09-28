import { Component, computed, inject, signal } from '@angular/core';
import { AveBanner } from '@avelune/ui/alert';
import { AveIconButton } from '@avelune/ui/button';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AveTheme } from '@avelune/ui/theme';
import { AveTooltip } from '@avelune/ui/tooltip';

/**
 * The showcase shell: the application bar, with the screens and the theme and density switches the reviews need, a
 * banner about planned maintenance that people may close, and the screen below it.
 */
@Component({
  selector: 'ave-showcase-root',
  imports: [AveBanner, AveIconButton, AveTooltip, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <header class="bar" lang="ru">
      <p class="product">Avelune · Документооборот</p>
      <nav class="nav" aria-label="Разделы">
        <a
          routerLink="/"
          routerLinkActive="current"
          ariaCurrentWhenActive="page"
          [routerLinkActiveOptions]="{ exact: true }"
          >Новый договор</a
        >
        <a routerLink="/contracts" routerLinkActive="current" ariaCurrentWhenActive="page">Договоры</a>
        <a routerLink="/settings" routerLinkActive="current" ariaCurrentWhenActive="page">Настройки</a>
      </nav>
      <div class="settings" role="group" aria-label="Вид">
        <button
          aveIconButton
          type="button"
          variant="ghost"
          [icon]="dark() ? 'sun' : 'moon'"
          [label]="dark() ? 'Светлая тема' : 'Тёмная тема'"
          [aveTooltip]="dark() ? 'Светлая тема' : 'Тёмная тема'"
          aveTooltipSide="bottom"
          (click)="toggleTheme()"
        ></button>
        <button
          aveIconButton
          type="button"
          variant="ghost"
          [icon]="compact() ? 'rows-2' : 'rows-3'"
          [label]="compact() ? 'Обычная плотность' : 'Компактная плотность'"
          [aveTooltip]="compact() ? 'Обычная плотность' : 'Компактная плотность'"
          aveTooltipSide="bottom"
          (click)="toggleDensity()"
        ></button>
      </div>
    </header>
    @if (!maintenanceSeen()) {
      <ave-banner variant="warning" dismissible lang="ru" (dismiss)="maintenanceSeen.set(true)">
        В субботу с 22:00 до 02:00 система будет недоступна: плановые работы.
      </ave-banner>
    }
    <main class="main">
      <router-outlet />
    </main>
  `,
  styleUrl: './app.css',
})
export class App {
  private readonly appearance = inject(AveTheme);

  /** The showcase starts light; a choice follows the switch, not the system. */
  protected readonly dark = computed(() => this.appearance.theme() === 'dark');
  protected readonly compact = computed(() => this.appearance.density() === 'compact');

  /** Whether the person closed the maintenance banner; a real application would remember it. */
  protected readonly maintenanceSeen = signal(false);

  protected toggleTheme(): void {
    this.appearance.setTheme(this.dark() ? 'light' : 'dark');
  }

  protected toggleDensity(): void {
    this.appearance.setDensity(this.compact() ? 'comfortable' : 'compact');
  }
}
