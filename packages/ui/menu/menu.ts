import { Component, ElementRef, booleanAttribute, computed, inject, input, output, viewChild } from '@angular/core';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@angular/aria/menu';
import { Toolbar, ToolbarWidget } from '@angular/aria/toolbar';
import { OverlayModule } from '@angular/cdk/overlay';
import { lucideChevronDown } from '@avelune/icons/lucide';
import { AveButton, AveIconButton, type AveButtonSize, type AveButtonVariant } from '@avelune/ui/button';
import { AveIcon, provideAveIcons, type AveIconName } from '@avelune/ui/icon';
import { aveConnectedOverlay, aveOverlayPresence } from '@avelune/ui/overlay';
import { AveTooltip } from '@avelune/ui/tooltip';
import type { AveMenuEntry, AveMenuItem, AveMenuSeparator } from './types';

let nextMenu = 0;

/**
 * The kit's menu (brief §9.1, ADR 0064): a button that opens a list of actions, on Angular Aria's menu (the WAI-ARIA
 * menu button) in CDK's overlay. The button looks like a Button of its variant and size; with an `icon` it is an
 * IconButton whose `label` is its name and its tooltip. Choosing an item closes the menu, returns focus to the button
 * and emits the item's value; Escape and a press outside close it. Inside a kit toolbar the button is one of its
 * items (ADR 0075). Items are data: register their icons with `provideAveIcons`.
 *
 * ```html
 * <ave-menu label="Действия с договором" icon="ellipsis" variant="ghost" size="sm" [items]="actions" (itemSelected)="run($event)" />
 * ```
 *
 * @alpha
 */
@Component({
  selector: 'ave-menu',
  imports: [
    AveButton,
    AveIcon,
    AveIconButton,
    AveTooltip,
    Menu,
    MenuContent,
    MenuItem,
    MenuTrigger,
    OverlayModule,
    ToolbarWidget,
  ],
  providers: [provideAveIcons([lucideChevronDown])],
  template: `
    @if (toolbar !== null) {
      <!-- In a toolbar the trigger is one of its items (ADR 0075). -->
      @if (icon(); as name) {
        <button
          #trigger="ngMenuTrigger"
          #button
          aveIconButton
          ngMenuTrigger
          ngToolbarWidget
          type="button"
          [id]="triggerId"
          [icon]="name"
          [label]="label()"
          [aveTooltip]="label()"
          [variant]="variant()"
          [size]="size()"
          [disabled]="disabled()"
          disabledInteractive
          [menu]="menu()"
        ></button>
      } @else {
        <button
          #trigger="ngMenuTrigger"
          #button
          aveButton
          ngMenuTrigger
          ngToolbarWidget
          type="button"
          [id]="triggerId"
          [variant]="variant()"
          [size]="size()"
          [disabled]="disabled()"
          disabledInteractive
          [menu]="menu()"
        >
          {{ label() }}<ave-icon name="chevron-down" decorative />
        </button>
      }
    } @else if (icon(); as name) {
      <button
        #trigger="ngMenuTrigger"
        #button
        aveIconButton
        ngMenuTrigger
        type="button"
        [id]="triggerId"
        [icon]="name"
        [label]="label()"
        [aveTooltip]="label()"
        [variant]="variant()"
        [size]="size()"
        [disabled]="disabled()"
        [softDisabled]="false"
        [menu]="menu()"
      ></button>
    } @else {
      <button
        #trigger="ngMenuTrigger"
        #button
        aveButton
        ngMenuTrigger
        type="button"
        [id]="triggerId"
        [variant]="variant()"
        [size]="size()"
        [disabled]="disabled()"
        [softDisabled]="false"
        [menu]="menu()"
      >
        {{ label() }}<ave-icon name="chevron-down" decorative />
      </button>
    }
    <ng-template
      [cdkConnectedOverlay]="overlay()"
      [cdkConnectedOverlayOpen]="presence.open()"
      (overlayOutsideClick)="outside($event)"
    >
      <div
        #menu="ngMenu"
        #panel
        ngMenu
        class="menu ave-motion-popover-enter"
        [class.ave-motion-popover-exit]="presence.closing()"
        [attr.aria-labelledby]="triggerId"
        (itemSelected)="chosen($event)"
      >
        <ng-template ngMenuContent>
          @for (entry of items(); track $index) {
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
    </ng-template>
  `,
  styleUrl: './menu.css',
})
export class AveMenu<V> {
  /** The button's words ("Действия"); with an `icon`, its name and tooltip instead. */
  readonly label = input.required<string>();

  /** The actions, in order, with separators between groups. */
  readonly items = input.required<readonly AveMenuEntry<V>[]>();

  /** Draws the button as an icon alone (an IconButton), named and titled by `label`: `ellipsis` for row actions. */
  readonly icon = input<AveIconName>();

  /** The button's emphasis, as a Button's: `secondary` (default), `ghost` in rows and toolbars. */
  readonly variant = input<AveButtonVariant>('secondary');

  /** The button's size, as a Button's: `sm`, `md` (default), `lg`. */
  readonly size = input<AveButtonSize>('md');

  /** Disables the button; the menu cannot open. */
  readonly disabled = input(false, { transform: booleanAttribute });

  /** Emits the value of the item the person chose; the menu has closed and focus is on its button. */
  readonly itemSelected = output<V>();

  /** The button's id, which names the menu. */
  protected readonly triggerId = `ave-menu-trigger-${String(nextMenu++)}`;

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  /** The kit toolbar the menu stands in, if any: its trigger is then one of the toolbar's items (ADR 0075). */
  protected readonly toolbar = inject(Toolbar, { optional: true });

  private readonly trigger = viewChild<MenuTrigger<V>>('trigger');
  private readonly button = viewChild<unknown, ElementRef<HTMLElement>>('button', { read: ElementRef });
  protected readonly menu = viewChild<Menu<V>>('menu');
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  /** Whether the menu is open: Aria's trigger holds it. */
  private readonly expanded = computed(() => this.trigger()?.expanded() ?? false);

  /** The overlay stays open while the menu plays its exit (ADR 0046). */
  protected readonly presence = aveOverlayPresence(
    this.expanded,
    computed(() => this.panel()?.nativeElement),
  );

  /** The menu opens from its button; the host stands in until the button is drawn, before the menu can open. */
  protected readonly overlay = computed(() =>
    aveConnectedOverlay(this.button()?.nativeElement ?? this.host, {
      matchWidth: false,
      transformOrigin: '.menu',
      align: 'either',
    }),
  );

  protected isSeparator(entry: AveMenuEntry<V>): entry is AveMenuSeparator {
    return 'separator' in entry;
  }

  /** Aria's menu emits the chosen item's value, or `undefined` for none. */
  protected chosen(value: V | undefined): void {
    const item = this.items().find(
      (entry): entry is AveMenuItem<V> => !this.isSeparator(entry) && Object.is(entry.value, value),
    );
    if (item !== undefined) this.itemSelected.emit(item.value);
  }

  /** A press outside the menu closes it; one on its own button toggles it, which Aria's trigger does. */
  protected outside(event: MouseEvent): void {
    if (event.target instanceof Node && this.host.contains(event.target)) return;
    this.trigger()?.close();
  }
}
