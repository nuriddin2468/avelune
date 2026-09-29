import { Component, computed, effect, inject, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AveBanner } from '@avelune/ui/alert';
import { AveIconButton } from '@avelune/ui/button';
import { AveDrawer } from '@avelune/ui/dialog';
import { AveSidebarNav, type AveSidebarEntry } from '@avelune/ui/sidebar-nav';
import { AveTheme } from '@avelune/ui/theme';
import { AveTooltip } from '@avelune/ui/tooltip';

/**
 * The showcase shell: the application bar with the theme and density switches the reviews need, a banner about
 * planned maintenance that people may close, the product's navigation, and the screen beside it. The navigation is a
 * column at the start of wide screens and a drawer on a phone, opened from the bar.
 */
@Component({
  selector: 'ave-showcase-root',
  imports: [AveBanner, AveDrawer, AveIconButton, AveSidebarNav, AveTooltip, RouterOutlet],
  template: `
    <header class="bar" lang="ru">
      <button
        aveIconButton
        class="menu"
        type="button"
        variant="ghost"
        icon="menu"
        label="Разделы"
        aveTooltip="Разделы"
        aveTooltipSide="bottom"
        aria-haspopup="dialog"
        (click)="navigating.set(true)"
      ></button>
      <p class="product">Avelune · Документооборот</p>
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
    <div class="body">
      <aside class="sidebar" lang="ru">
        <ave-sidebar-nav label="Разделы" [items]="pages" />
      </aside>
      <main class="main">
        <router-outlet />
      </main>
    </div>
    <dialog aveDrawer side="start" size="sm" heading="Разделы" [(open)]="navigating" lang="ru">
      <ave-sidebar-nav label="Разделы" [items]="pages" />
    </dialog>
  `,
  styleUrl: './app.css',
})
export class App {
  private readonly appearance = inject(AveTheme);
  private readonly router = inject(Router);

  /** The showcase starts light; a choice follows the switch, not the system. */
  protected readonly dark = computed(() => this.appearance.theme() === 'dark');
  protected readonly compact = computed(() => this.appearance.density() === 'compact');

  /** Whether the person closed the maintenance banner; a real application would remember it. */
  protected readonly maintenanceSeen = signal(false);

  /** The product's pages: the contracts in a group, the settings under administration. */
  protected readonly pages: readonly AveSidebarEntry[] = [
    {
      label: 'Договоры',
      icon: 'file-text',
      items: [
        { label: 'Реестр договоров', link: '/contracts' },
        { label: 'Новый договор', link: '/', exact: true },
      ],
    },
    { heading: 'Администрирование', items: [{ label: 'Настройки', link: '/settings', icon: 'settings' }] },
  ];

  /** Whether the navigation's drawer is open, on a phone; following a link closes it. */
  protected readonly navigating = signal(false);

  constructor() {
    effect(() => {
      this.router.lastSuccessfulNavigation();
      this.navigating.set(false);
    });
  }

  protected toggleTheme(): void {
    this.appearance.setTheme(this.dark() ? 'light' : 'dark');
  }

  protected toggleDensity(): void {
    this.appearance.setDensity(this.compact() ? 'comfortable' : 'compact');
  }
}
