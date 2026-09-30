import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  PLATFORM_ID,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { Router, RouterLink, UrlTree, containsTree, type IsActiveMatchOptions } from '@angular/router';
import { lucideArrowLeft } from '@avelune/icons/lucide';
import { AveButton } from '@avelune/ui/button';
import { injectAveMessages } from '@avelune/ui/i18n';
import { AveIcon, provideAveIcons } from '@avelune/ui/icon';
import { AveSidebarNav, type AveSidebarEntry } from '@avelune/ui/sidebar-nav';
import type { AveSettingsSection } from './types';

/** A section's address holds the address of a page inside it too. */
const within: IsActiveMatchOptions = {
  paths: 'subset',
  queryParams: 'ignored',
  fragment: 'ignored',
  matrixParams: 'ignored',
};

/**
 * A product's settings (brief §9.4, ADR 0091, 0099): the page's heading, its sections, each a page with its own
 * address, and the section the address names, the application's `<router-outlet>`. From `container.md` the sections
 * stand in a column at the start, and the page's own address opens the first; below it the list shows, then a
 * section under a link back to it.
 *
 * ```html
 * <ave-settings-page heading="Настройки" home="/settings" [sections]="sections">
 *   <router-outlet />
 * </ave-settings-page>
 * ```
 *
 * @beta
 */
@Component({
  selector: 'ave-settings-page',
  imports: [AveButton, AveIcon, AveSidebarNav, RouterLink],
  providers: [provideAveIcons([lucideArrowLeft])],
  host: { '[attr.data-view]': "active() === undefined ? 'sections' : 'section'" },
  template: `
    <div class="header">
      <h1 class="heading">{{ heading() }}</h1>
      @if (description(); as description) {
        <p class="description">{{ description }}</p>
      }
    </div>
    <div class="body">
      <div #list class="sections" tabindex="-1" data-focus-ring="inset">
        <ave-sidebar-nav [label]="sectionsName()" [items]="items()" />
      </div>
      <div #section class="section">
        <a #back aveButton variant="ghost" [routerLink]="home()">
          <ave-icon name="arrow-left" decorative />
          {{ backName() }}
        </a>
        <ng-content />
      </div>
    </div>
  `,
  styleUrl: './settings-page.css',
})
export class AveSettingsPage {
  /** The page's heading, its `h1`: "Настройки". */
  readonly heading = input.required<string>();

  /** What the settings are about, muted under the heading; none by default. */
  readonly description = input('');

  /** The sections, in order: each a page of the application with its own address. */
  readonly sections = input.required<readonly AveSettingsSection[]>();

  /** Names the navigation of the sections: the kit's "Разделы настроек" by default. */
  readonly sectionsLabel = input<string>();

  /** The settings' own address, which shows the list on a phone and opens the first section wider: `/settings`. */
  readonly home = input('/settings');

  /** The words of the link back to the list, on a phone: the kit's "Все настройки" by default. */
  readonly backLabel = input<string>();

  private readonly messages = injectAveMessages();
  protected readonly sectionsName = computed(() => this.sectionsLabel() ?? this.messages.settingsSections);
  protected readonly backName = computed(() => this.backLabel() ?? this.messages.allSettings);
  protected readonly items = computed<readonly AveSidebarEntry[]>(() =>
    this.sections().map(({ label, link, icon }) => ({ label, link, ...(icon === undefined ? {} : { icon }) })),
  );

  private readonly router = inject(Router);
  private readonly url = computed(() => this.router.lastSuccessfulNavigation()?.finalUrl ?? new UrlTree());

  /** The section the address names, if any. */
  protected readonly active = computed(() => {
    const url = this.url();
    return this.sections().find((section) => containsTree(url, this.router.parseUrl(section.link), within));
  });

  private readonly list = viewChild.required<ElementRef<HTMLElement>>('list');
  private readonly section = viewChild.required<ElementRef<HTMLElement>>('section');
  private readonly back = viewChild.required<unknown, ElementRef<HTMLElement>>('back', { read: ElementRef });

  /** Whether the page reaches `container.md`, where a section stands beside the list. */
  private readonly wide = signal(false);

  /** The link of the list that had focus when a section showed, for going back. */
  private returnTo: HTMLElement | null = null;

  constructor() {
    const document = inject(DOCUMENT);
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const injector = inject(Injector);
    const destroyRef = inject(DestroyRef);
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return;

    // The page's own address opens the first section wherever a section stands beside the list (ADR 0099).
    effect(() => {
      const first = this.sections()[0];
      if (!this.wide() || this.active() !== undefined || first === undefined) return;
      if (!containsTree(this.url(), this.router.parseUrl(this.home()), { ...within, paths: 'exact' })) return;
      void untracked(() => this.router.navigateByUrl(first.link, { replaceUrl: true }));
    });

    // The width is the token's, read from the page (ADR 0091).
    afterNextRender(() => {
      const width = Number.parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue('--ave-container-md'),
      );
      if (Number.isNaN(width)) return;
      const sizes = new ResizeObserver((entries) => {
        for (const entry of entries) this.wide.set(entry.contentRect.width >= width);
      });
      sizes.observe(host);
      destroyRef.onDestroy(() => {
        sizes.disconnect();
      });
    });

    // Below container.md the part that had focus hides: focus goes to the one that shows (ADR 0096, 0099).
    const hidden = (element: HTMLElement) => getComputedStyle(element).display === 'none';
    let first = true;
    effect(() => {
      const shown = this.active();
      if (first) {
        first = false;
        return;
      }
      untracked(() => {
        const active = document.activeElement;
        afterNextRender(
          () => {
            const list = this.list().nativeElement;
            if (shown !== undefined) {
              if (!hidden(list) || !(active instanceof HTMLElement) || !list.contains(active)) return;
              this.returnTo = active;
              this.back().nativeElement.focus();
            } else if (
              hidden(this.section().nativeElement) &&
              (active === this.back().nativeElement || active === document.body)
            ) {
              (this.returnTo ?? list).focus();
              this.returnTo = null;
            }
          },
          { injector },
        );
      });
    });
  }
}
