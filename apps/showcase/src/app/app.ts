import { Component, computed, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AveBanner } from '@avelune/ui/alert';
import { AveAppShell, AveAppShellActions, AveAppShellBanner, type AveAppLogo } from '@avelune/ui/app-shell';
import { AveIconButton } from '@avelune/ui/button';
import type { AveSidebarEntry } from '@avelune/ui/sidebar-nav';
import { AveTheme } from '@avelune/ui/theme';
import { AveTooltip } from '@avelune/ui/tooltip';
import { contracts } from './data';

/** The register's expired contracts, which wait for someone to extend or close them: the navigation counts them. */
const expired = contracts.filter((contract) => contract.status === 'expired').length;

/** The product's mark, the brand's orange with a white A; it reads on both bars, so it has one source. */
const mark =
  "<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'>" +
  "<rect width='32' height='32' rx='8' fill='#E95420'/>" +
  "<path d='M9 23 16 9l7 14M12 18h8' stroke='#FFFFFF' stroke-width='3' fill='none' stroke-linejoin='round'/></svg>";

/**
 * The showcase shell: the kit's application shell (ADR 0092) with the product's mark and name, the theme and density
 * switches the reviews need, a banner about planned maintenance that people may close, and the product's navigation.
 */
@Component({
  selector: 'ave-showcase-root',
  imports: [AveAppShell, AveAppShellActions, AveAppShellBanner, AveBanner, AveIconButton, AveTooltip, RouterOutlet],
  template: `
    <ave-app-shell
      product="Avelune · Документооборот"
      navigationLabel="Разделы"
      [logo]="logo"
      [navigation]="pages"
      lang="ru"
    >
      <div aveAppShellActions role="group" aria-label="Вид">
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
      @if (!maintenanceSeen()) {
        <ave-banner aveAppShellBanner variant="warning" dismissible (dismiss)="maintenanceSeen.set(true)">
          В субботу с 22:00 до 02:00 система будет недоступна: плановые работы.
        </ave-banner>
      }
      <router-outlet />
    </ave-app-shell>
  `,
  styleUrl: './app.css',
})
export class App {
  private readonly appearance = inject(AveTheme);

  /** The showcase starts light; a choice follows the switch, not the system. */
  protected readonly dark = computed(() => this.appearance.theme() === 'dark');
  protected readonly compact = computed(() => this.appearance.density() === 'compact');

  /** The product's mark before its name; the name says what it stands for. */
  protected readonly logo: AveAppLogo = { src: `data:image/svg+xml,${encodeURIComponent(mark)}`, alt: '' };

  /** Whether the person closed the maintenance banner; a real application would remember it. */
  protected readonly maintenanceSeen = signal(false);

  /**
   * The product's pages: the contracts and their template in a group, the register with the count of its expired
   * contracts, the departments and the settings under administration.
   */
  protected readonly pages: readonly AveSidebarEntry[] = [
    {
      label: 'Договоры',
      icon: 'file-text',
      items: [
        { label: 'Реестр договоров', link: '/contracts', count: expired },
        { label: 'Новый договор', link: '/', exact: true },
        { label: 'Шаблон договора', link: '/templates' },
      ],
    },
    {
      heading: 'Администрирование',
      items: [
        { label: 'Подразделения', link: '/departments', icon: 'network' },
        { label: 'Настройки', link: '/settings', icon: 'settings' },
      ],
    },
  ];

  protected toggleTheme(): void {
    this.appearance.setTheme(this.dark() ? 'light' : 'dark');
  }

  protected toggleDensity(): void {
    this.appearance.setDensity(this.compact() ? 'comfortable' : 'compact');
  }
}
