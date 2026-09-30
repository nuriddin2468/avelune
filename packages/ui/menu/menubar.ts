import {
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
  viewChildren,
} from '@angular/core';
import { Menu, MenuBar, MenuContent, MenuItem } from '@angular/aria/menu';
import { createOverlayRef, createRepositionScrollStrategy, type OverlayRef } from '@angular/cdk/overlay';
import { DomPortal } from '@angular/cdk/portal';
import { AveIcon } from '@avelune/ui/icon';
import { aveConnectedStrategy } from '@avelune/ui/overlay';
import type { AveMenuEntry, AveMenuItem, AveMenuSeparator, AveMenubarMenu } from './types';

let nextMenubar = 0;

/**
 * The kit's menubar (brief §9.4, ADR 0076): the menus of an application's window, such as an editor's "Файл" and
 * "Правка", on Angular Aria's menubar (the WAI-ARIA menubar pattern). Each menu is the kit's popup in CDK's overlay
 * under its item; it exists before it opens, as Aria needs, and leaves the page once it has closed. Choosing an item
 * closes the menu and emits its value. Items are data: register their icons with `provideAveIcons`.
 *
 * ```html
 * <ave-menubar label="Шаблон" [menus]="menus" (itemSelected)="run($event)" />
 * ```
 *
 * @beta
 */
@Component({
  selector: 'ave-menubar',
  imports: [AveIcon, Menu, MenuBar, MenuContent, MenuItem],
  template: `
    <div ngMenuBar class="bar" [attr.aria-label]="label()" (itemSelected)="chosen($event)">
      @for (menu of menus(); track $index) {
        <div #top ngMenuItem class="top" [attr.id]="topId($index)" [submenu]="submenus()[$index]">{{ menu.label }}</div>
      }
    </div>
    <!-- The menus, drawn at once so each top item knows its menu; the holder leaves the page after the first render,
         and a menu enters its overlay while it is open (ADR 0076). -->
    <div #holder class="holder">
      @for (menu of menus(); track $index) {
        <div
          #submenu
          ngMenu
          class="menu ave-motion-popover-enter"
          [class.ave-motion-popover-exit]="closing()[$index]"
          [attr.aria-labelledby]="topId($index)"
        >
          <ng-template ngMenuContent>
            @for (entry of menu.items; track $index) {
              @if (isSeparator(entry)) {
                <div class="separator" role="separator"></div>
              } @else {
                <div
                  ngMenuItem
                  class="item"
                  data-focus-ring="inset"
                  [value]="entry.value"
                  [disabled]="entry.disabled ?? false"
                  [attr.data-danger]="entry.danger ? '' : null"
                >
                  @if (entry.icon; as name) {
                    <ave-icon [name]="name" decorative />
                  }
                  <span class="label">{{ entry.label }}</span>
                </div>
              }
            }
          </ng-template>
        </div>
      }
    </div>
  `,
  styleUrls: ['./panel.css', './menubar.css'],
  host: { '(keydown.escape)': 'dismiss($event)' },
})
export class AveMenubar<V> {
  /** Names the bar for assistive technology: what its menus act on ("Шаблон договора"). */
  readonly label = input.required<string>();

  /** The menus, in order: each a word in the bar and its actions. */
  readonly menus = input.required<readonly AveMenubarMenu<V>[]>();

  /** Emits the value of the item the person chose; its menu has closed. */
  readonly itemSelected = output<V>();

  /** Which menus play their exit, by index. */
  protected readonly closing = signal<readonly boolean[]>([]);

  /** The menus as Aria's, which the top items open. */
  protected readonly submenus = viewChildren<unknown, Menu<V>>('submenu', { read: Menu });

  private readonly prefix = `ave-menubar-${String(nextMenubar++)}`;
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly injector = inject(Injector);
  private readonly tops = viewChildren<unknown, MenuItem<V>>('top', { read: MenuItem });
  private readonly holder = viewChild.required<ElementRef<HTMLElement>>('holder');

  /** One overlay per menu, made when it first opens. */
  private readonly overlays: (OverlayRef | undefined)[] = [];

  /** The index of the open menu, or -1. */
  private readonly open = computed(() => this.tops().findIndex((top) => top.expanded() === true));

  constructor() {
    afterNextRender(() => {
      this.holder().nativeElement.remove();
    });
    effect(() => {
      const open = this.open();
      this.tops();
      untracked(() => {
        this.present(open);
      });
    });
    inject(DestroyRef).onDestroy(() => {
      for (const overlay of this.overlays) overlay?.dispose();
    });
  }

  /** The id of the top item at this index, which names its menu. */
  protected topId(index: number): string {
    return `${this.prefix}-${String(index)}`;
  }

  /** Whether an entry is a separator. */
  protected isSeparator(entry: AveMenuEntry<V>): entry is AveMenuSeparator {
    return 'separator' in entry;
  }

  /**
   * Escape on a top item whose menu is open closes the menu, focus staying on the item. Aria's menubar closes a menu on
   * Escape only from inside it, and a menu opened by a click keeps focus on its item (ADR 0076, addendum). With no menu
   * open, Escape goes on, to a dialog around the bar.
   */
  protected dismiss(event: Event): void {
    const top = this.tops().find((item) => item.element === event.target);
    if (top?.expanded() !== true) return;
    event.preventDefault();
    event.stopPropagation();
    top.close();
  }

  /** Aria's menubar emits the chosen item's value, of any of its menus, or `undefined` for none. */
  protected chosen(value: V | undefined): void {
    for (const menu of this.menus()) {
      const item = menu.items.find(
        (entry): entry is AveMenuItem<V> => !this.isSeparator(entry) && Object.is(entry.value, value),
      );
      if (item !== undefined) {
        this.itemSelected.emit(item.value);
        return;
      }
    }
  }

  /**
   * Shows the open menu in its overlay, and lets every other menu that shows play its exit and leave. The overlays of
   * menus the bar no longer has go with them.
   */
  private present(open: number): void {
    const count = this.tops().length;
    for (const overlay of this.overlays.splice(count)) overlay?.dispose();
    if (this.closing().length > count) this.closing.set(this.closing().slice(0, count));
    this.tops().forEach((top, index) => {
      const menu = top.submenu()?.element;
      if (menu === undefined) return;
      const shown = this.overlays[index]?.hasAttached() === true;
      if (index === open) {
        this.setClosing(index, false);
        if (!shown) this.attach(index, top.element, menu);
      } else if (shown && this.closing()[index] !== true) {
        this.leave(index, menu);
      }
    });
  }

  /** Moves a menu into its overlay, under its top item. */
  private attach(index: number, origin: HTMLElement, menu: HTMLElement): void {
    let overlay = this.overlays[index];
    if (overlay === undefined) {
      overlay = createOverlayRef(this.injector, {
        positionStrategy: aveConnectedStrategy(this.injector, origin, { transformOrigin: '.menu', align: 'either' }),
        scrollStrategy: createRepositionScrollStrategy(this.injector),
        usePopover: true,
      });
      // A press outside the bar and its menu closes the menu; one on a top item is Aria's to handle.
      overlay.outsidePointerEvents().subscribe((event) => {
        if (event.target instanceof Node && this.host.contains(event.target)) return;
        this.tops()[this.open()]?.close();
      });
      this.overlays[index] = overlay;
    }
    overlay.attach(new DomPortal(menu));
  }

  /** Lets a menu play its exit, then takes it out of its overlay and the page, unless it opened again. */
  private leave(index: number, menu: HTMLElement): void {
    this.setClosing(index, true);
    afterNextRender(
      () => {
        void Promise.allSettled(menu.getAnimations().map((animation) => animation.finished)).then(() => {
          if (this.closing()[index] !== true) return;
          this.overlays[index]?.detach();
          this.setClosing(index, false);
        });
      },
      { injector: this.injector },
    );
  }

  private setClosing(index: number, closing: boolean): void {
    if ((this.closing()[index] ?? false) === closing) return;
    const next = [...this.closing()];
    next[index] = closing;
    this.closing.set(next);
  }
}
