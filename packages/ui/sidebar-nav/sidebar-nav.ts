import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { Router, RouterLink, UrlTree, containsTree, type IsActiveMatchOptions } from '@angular/router';
import { lucideChevronDown, lucideChevronRight } from '@avelune/icons/lucide';
import { provideAveIcons } from '@avelune/ui/icon';
import { AveSidebarItem } from './item';
import type { AveSidebarEntry, AveSidebarGroup, AveSidebarLink, AveSidebarSection } from './types';

let nextNav = 0;

/** The page itself: its path exactly; query parameters and the fragment do not count. */
const page: Partial<IsActiveMatchOptions> = { paths: 'exact', queryParams: 'ignored', fragment: 'ignored' };

/** A page above the current one: its path begins the current path. */
const above: Partial<IsActiveMatchOptions> = { paths: 'subset', queryParams: 'ignored', fragment: 'ignored' };

/**
 * The kit's sidebar navigation (brief §9.4, ADR 0072): the product's pages as a named navigation landmark, in lists of
 * links through Angular's router, with groups that open and close and headed sections. The router marks the current
 * page (`aria-current="page"`) and the pages above it (`aria-current="true"`), and opens the group that holds it.
 * Links go from the root; register their icons with `provideAveIcons`.
 *
 * ```html
 * <ave-sidebar-nav label="Разделы" [items]="pages" />
 * ```
 *
 * @beta
 */
@Component({
  selector: 'ave-sidebar-nav',
  imports: [AveSidebarItem, RouterLink],
  providers: [provideAveIcons([lucideChevronDown, lucideChevronRight])],
  template: `
    <nav [attr.aria-label]="label()">
      <ul class="list">
        @for (entry of items(); track $index) {
          <li>
            @if (isSection(entry)) {
              <span class="heading" [id]="sectionId($index)">{{ entry.heading }}</span>
              <ul class="list" [attr.aria-labelledby]="sectionId($index)">
                @for (child of entry.items; track $index) {
                  <li>
                    @if (isGroup(child)) {
                      <button
                        aveSidebarItem
                        type="button"
                        [icon]="child.icon"
                        [expanded]="isOpen(child)"
                        [attr.aria-controls]="groupId(child)"
                        [attr.aria-current]="!isOpen(child) && holdsCurrent(child) ? 'true' : null"
                        (click)="toggle(child)"
                      >
                        {{ child.label }}
                      </button>
                      <ul class="list pages" [id]="groupId(child)" [hidden]="!isOpen(child)">
                        @for (link of child.items; track $index) {
                          <li>
                            <a
                              aveSidebarItem
                              [routerLink]="link.link"
                              [icon]="link.icon"
                              [count]="link.count"
                              [attr.aria-current]="current(link)"
                              >{{ link.label }}</a
                            >
                          </li>
                        }
                      </ul>
                    } @else {
                      <a
                        aveSidebarItem
                        [routerLink]="child.link"
                        [icon]="child.icon"
                        [count]="child.count"
                        [attr.aria-current]="current(child)"
                        >{{ child.label }}</a
                      >
                    }
                  </li>
                }
              </ul>
            } @else if (isGroup(entry)) {
              <button
                aveSidebarItem
                type="button"
                [icon]="entry.icon"
                [expanded]="isOpen(entry)"
                [attr.aria-controls]="groupId(entry)"
                [attr.aria-current]="!isOpen(entry) && holdsCurrent(entry) ? 'true' : null"
                (click)="toggle(entry)"
              >
                {{ entry.label }}
              </button>
              <ul class="list pages" [id]="groupId(entry)" [hidden]="!isOpen(entry)">
                @for (link of entry.items; track $index) {
                  <li>
                    <a
                      aveSidebarItem
                      [routerLink]="link.link"
                      [icon]="link.icon"
                      [count]="link.count"
                      [attr.aria-current]="current(link)"
                      >{{ link.label }}</a
                    >
                  </li>
                }
              </ul>
            } @else {
              <a
                aveSidebarItem
                [routerLink]="entry.link"
                [icon]="entry.icon"
                [count]="entry.count"
                [attr.aria-current]="current(entry)"
                >{{ entry.label }}</a
              >
            }
          </li>
        }
      </ul>
    </nav>
  `,
  styleUrl: './sidebar-nav.css',
})
export class AveSidebarNav {
  /** Names the navigation landmark: "Разделы". */
  readonly label = input.required<string>();

  /** The pages, groups of pages and headed sections, in order. */
  readonly items = input.required<readonly AveSidebarEntry[]>();

  /** The names of the groups that show their pages. */
  protected readonly opened = signal<ReadonlySet<string>>(new Set());

  private readonly router = inject(Router);
  private readonly prefix = `ave-sidebar-nav-${String(nextNav++)}`;

  /** The address navigation last reached. */
  private readonly url = computed(() => this.router.lastSuccessfulNavigation()?.finalUrl ?? new UrlTree());

  /** Each link's address, parsed once per `items`. */
  private readonly trees = computed(() => {
    const trees = new Map<AveSidebarLink, UrlTree>();
    const add = (link: AveSidebarLink): void => {
      trees.set(
        link,
        typeof link.link === 'string' ? this.router.parseUrl(link.link) : this.router.createUrlTree([...link.link]),
      );
    };
    for (const entry of this.items()) {
      const children = this.isSection(entry) ? entry.items : [entry];
      for (const child of children) {
        if (this.isGroup(child)) child.items.forEach(add);
        else add(child);
      }
    }
    return trees;
  });

  constructor() {
    // Navigation into a group opens it; what the person opened and closed stays otherwise.
    effect(() => {
      this.url();
      // Only navigation opens a group: new items (their counts, the person's rights) leave the groups as they are.
      const groups = untracked(() => this.groups().filter((group) => this.holdsCurrent(group)));
      if (groups.length === 0) return;
      this.opened.update((opened) => new Set([...opened, ...groups.map((group) => group.label)]));
    });
  }

  /** `page` for the current page, `true` for a page above it, `null` otherwise. */
  protected current(link: AveSidebarLink): 'page' | 'true' | null {
    const tree = this.trees().get(link);
    if (tree === undefined) return null;
    const url = this.url();
    if (containsTree(url, tree, page)) return 'page';
    return !link.exact && containsTree(url, tree, above) ? 'true' : null;
  }

  /** Whether one of the group's pages is current. */
  protected holdsCurrent(group: AveSidebarGroup): boolean {
    return group.items.some((link) => this.current(link) !== null);
  }

  /** Whether the group shows its pages. */
  protected isOpen(group: AveSidebarGroup): boolean {
    return this.opened().has(group.label);
  }

  /** The group's button was pressed: it opens or closes. */
  protected toggle(group: AveSidebarGroup): void {
    const opened = new Set(this.opened());
    if (!opened.delete(group.label)) opened.add(group.label);
    this.opened.set(opened);
  }

  /** Whether an entry is a headed section. */
  protected isSection(entry: AveSidebarEntry): entry is AveSidebarSection {
    return 'heading' in entry;
  }

  /** Whether an entry is a group of pages. */
  protected isGroup(entry: AveSidebarLink | AveSidebarGroup): entry is AveSidebarGroup {
    return 'items' in entry;
  }

  /** The id of the heading of the section at this index. */
  protected sectionId(index: number): string {
    return `${this.prefix}-section-${String(index)}`;
  }

  /** The id of a group's list of pages, by its place among the groups. */
  protected groupId(group: AveSidebarGroup): string {
    return `${this.prefix}-group-${String(this.groups().indexOf(group))}`;
  }

  /** Every group, in sections too. */
  private groups(): AveSidebarGroup[] {
    return this.items().flatMap((entry) =>
      (this.isSection(entry) ? entry.items : [entry]).filter((child): child is AveSidebarGroup => this.isGroup(child)),
    );
  }
}
