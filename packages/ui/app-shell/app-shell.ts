import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  Component,
  DestroyRef,
  ElementRef,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  input,
  model,
  viewChild,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { lucideMenu } from '@avelune/icons/lucide';
import { AveButton, AveIconButton } from '@avelune/ui/button';
import { AveDrawer } from '@avelune/ui/dialog';
import { injectAveMessages } from '@avelune/ui/i18n';
import { provideAveIcons } from '@avelune/ui/icon';
import { AveSidebarNav, type AveSidebarEntry } from '@avelune/ui/sidebar-nav';
import { aveColorScheme } from '@avelune/ui/theme';
import { AveTooltip } from '@avelune/ui/tooltip';
import type { AveAppLogo } from './types';

let nextShell = 0;

/**
 * The application shell (brief §9.4, ADR 0091, 0092): the layout of every screen of a product. A skip link to the
 * page; the application bar with the product's logo and name as the link home, the navigation's button on a phone and
 * the application's actions at its end; the application's banners under it; then the navigation, a column from
 * `breakpoint.md` and a drawer from the start below it, beside `main`, which holds the shell's content.
 *
 * ```html
 * <ave-app-shell product="Документооборот" [logo]="logo" [navigation]="pages" navigationLabel="Разделы">
 *   <div aveAppShellActions>…</div>
 *   <ave-banner aveAppShellBanner variant="warning">…</ave-banner>
 *   <router-outlet />
 * </ave-app-shell>
 * ```
 *
 * @alpha
 */
@Component({
  selector: 'ave-app-shell',
  imports: [AveButton, AveDrawer, AveIconButton, AveSidebarNav, AveTooltip, RouterLink],
  providers: [provideAveIcons([lucideMenu])],
  template: `
    <div class="skip">
      <a aveButton [href]="'#' + mainId" (click)="skip($event)">{{ messages.skipToContent }}</a>
    </div>
    <header class="bar">
      @if (navigation().length > 0) {
        <button
          aveIconButton
          type="button"
          variant="ghost"
          icon="menu"
          [label]="navigationName()"
          [aveTooltip]="navigationName()"
          aveTooltipSide="bottom"
          aria-haspopup="dialog"
          (click)="navigationOpen.set(true)"
        ></button>
      }
      <a class="home" [routerLink]="home()">
        @if (logo(); as logo) {
          <!-- eslint-disable-next-line @angular-eslint/template/prefer-ngsrc -- NgOptimizedImage refuses the data URLs of a tenant's upload (NG02952) and needs a size only the image knows (ADR 0092). -->
          <img class="logo" [src]="dark() ? (logo.darkSrc ?? logo.src) : logo.src" [alt]="logo.alt" />
        }
        <span class="product">{{ product() }}</span>
      </a>
      <ng-content select="[aveAppShellActions]" />
    </header>
    <ng-content select="[aveAppShellBanner]" />
    <div class="body">
      @if (navigation().length > 0) {
        <div class="column">
          <ave-sidebar-nav [label]="navigationName()" [items]="navigation()" />
        </div>
      }
      <main #main class="main" tabindex="-1" data-focus-ring="inset" [id]="mainId">
        <ng-content />
      </main>
    </div>
    @if (navigation().length > 0) {
      <dialog aveDrawer side="start" size="sm" [heading]="navigationName()" [(open)]="navigationOpen">
        <ave-sidebar-nav [label]="navigationName()" [items]="navigation()" />
      </dialog>
    }
  `,
  styleUrl: './app-shell.css',
})
export class AveAppShell {
  /** The product's name at the start of the bar, after the logo: the words of the link home. */
  readonly product = input.required<string>();

  /** The product's or the tenant's logo before its name, with a source for the dark bar; none by default. */
  readonly logo = input<AveAppLogo | null>(null);

  /** Where the logo and the name lead: the product's home page, `/` by default. */
  readonly home = input('/');

  /** The product's pages, groups and sections, drawn by SidebarNav in the column and in the drawer; none by default. */
  readonly navigation = input<readonly AveSidebarEntry[]>([]);

  /** Names the navigation, its button and its drawer: "Разделы". The kit's `navigation` message by default. */
  readonly navigationLabel = input<string>();

  /** Whether the navigation's drawer is open, below `breakpoint.md`; navigation and a wider window close it. */
  readonly navigationOpen = model(false);

  protected readonly messages = injectAveMessages();
  protected readonly mainId = `ave-app-shell-main-${String(nextShell++)}`;
  protected readonly navigationName = computed(() => this.navigationLabel() ?? this.messages.navigation);

  private readonly scheme = aveColorScheme();
  private readonly main = viewChild.required<ElementRef<HTMLElement>>('main');

  /** Whether the page shows the dark theme, whose bar takes the logo's dark source. */
  protected readonly dark = computed(() => this.scheme() === 'dark');

  constructor() {
    const router = inject(Router);
    effect(() => {
      router.lastSuccessfulNavigation();
      this.navigationOpen.set(false);
    });

    // CSS shows the column from breakpoint.md; a drawer still open then closes. The width is the token's, read from
    // the page (ADR 0091).
    const document = inject(DOCUMENT);
    const view = document.defaultView;
    if (!isPlatformBrowser(inject(PLATFORM_ID)) || view === null) return;
    const width = view.getComputedStyle(document.documentElement).getPropertyValue('--ave-breakpoint-md').trim();
    if (width === '') return;
    const wide = view.matchMedia(`(width >= ${width})`);
    const close = (event: MediaQueryListEvent) => {
      if (event.matches) this.navigationOpen.set(false);
    };
    wide.addEventListener('change', close);
    inject(DestroyRef).onDestroy(() => {
      wide.removeEventListener('change', close);
    });
  }

  /** The skip link moves focus to the page without changing the address, which the router reads (ADR 0092). */
  protected skip(event: Event): void {
    event.preventDefault();
    this.main().nativeElement.focus();
  }
}
