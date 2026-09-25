import { Component, computed, inject } from '@angular/core';
import { AveIconButton } from '@avelune/ui/button';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AveTheme } from '@avelune/ui/theme';

/**
 * The showcase shell: the application bar, with the screens and the theme and density switches the reviews need,
 * and the screen below it.
 */
@Component({
  selector: 'ave-showcase-root',
  imports: [AveIconButton, RouterLink, RouterLinkActive, RouterOutlet],
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
        <a routerLink="/settings" routerLinkActive="current" ariaCurrentWhenActive="page">Настройки</a>
      </nav>
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

  protected toggleTheme(): void {
    this.appearance.setTheme(this.dark() ? 'light' : 'dark');
  }

  protected toggleDensity(): void {
    this.appearance.setDensity(this.compact() ? 'comfortable' : 'compact');
  }
}
