import {
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  model,
  untracked,
  viewChild,
} from '@angular/core';
import { FocusTrapFactory } from '@angular/cdk/a11y';
import { OverlayModule } from '@angular/cdk/overlay';
import { lucideChevronDown } from '@avelune/icons/lucide';
import { AveButton, AveIconButton, type AveButtonSize, type AveButtonVariant } from '@avelune/ui/button';
import { AveIcon, provideAveIcons, type AveIconName } from '@avelune/ui/icon';
import { aveConnectedOverlay, aveOverlayPresence } from '@avelune/ui/overlay';
import { AveTooltip } from '@avelune/ui/tooltip';

let nextPopover = 0;

/**
 * The kit's popover (ADR 0065): a button that opens a small panel of content next to it, such as filters, a person's
 * card or a short form. The panel is a non-modal dialog in CDK's overlay, in the top layer, right after its button in
 * the focus order. Opening moves focus to its first field (or `cdkFocusInitial`); Escape closes it and returns focus to
 * the button; a press outside, or focus leaving it, closes it where the person went. The button is drawn as the Menu's
 * is: a Button with a chevron, or an IconButton (`icon`) named and titled by `label`.
 *
 * ```html
 * <ave-popover label="Фильтры" heading="Фильтры" [(open)]="filtersOpen">
 *   <fieldset aveChoiceGroup legend="Статус">…</fieldset>
 * </ave-popover>
 * ```
 *
 * @beta
 */
@Component({
  selector: 'ave-popover',
  imports: [AveButton, AveIcon, AveIconButton, AveTooltip, OverlayModule],
  providers: [provideAveIcons([lucideChevronDown])],
  template: `
    @if (icon(); as name) {
      <button
        #button
        aveIconButton
        type="button"
        aria-haspopup="dialog"
        [id]="buttonId"
        [icon]="name"
        [label]="label()"
        [aveTooltip]="label()"
        [variant]="variant()"
        [size]="size()"
        [disabled]="disabled()"
        [attr.aria-expanded]="open()"
        [attr.aria-controls]="open() ? panelId : null"
        (click)="toggle()"
      ></button>
    } @else {
      <button
        #button
        aveButton
        type="button"
        aria-haspopup="dialog"
        [id]="buttonId"
        [variant]="variant()"
        [size]="size()"
        [disabled]="disabled()"
        [attr.aria-expanded]="open()"
        [attr.aria-controls]="open() ? panelId : null"
        (click)="toggle()"
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
        #panel
        class="panel ave-motion-popover-enter"
        role="dialog"
        tabindex="-1"
        [id]="panelId"
        [class.ave-motion-popover-exit]="presence.closing()"
        [attr.aria-labelledby]="heading() ? headingId : buttonId"
        (keydown.escape)="escape($event)"
        (focusout)="focusLeft($event)"
      >
        @if (heading()) {
          <p class="heading" [id]="headingId">{{ heading() }}</p>
        }
        <ng-content />
      </div>
    </ng-template>
  `,
  styleUrl: './popover.css',
})
export class AvePopover {
  /** The button's words ("Фильтры"); with an `icon`, its name and tooltip instead. */
  readonly label = input.required<string>();

  /** A heading at the top of the panel, which names it; without one, the button names it. */
  readonly heading = input('');

  /** Whether the panel is open. Bind it to close the panel from its content, after an action. */
  readonly open = model(false);

  /** Draws the button as an icon alone (an IconButton), named and titled by `label`. */
  readonly icon = input<AveIconName>();

  /** The button's emphasis, as a Button's: `secondary` (default), `ghost` in toolbars. */
  readonly variant = input<AveButtonVariant>('secondary');

  /** The button's size, as a Button's: `sm`, `md` (default), `lg`. */
  readonly size = input<AveButtonSize>('md');

  /** Disables the button; the panel cannot open. */
  readonly disabled = input(false, { transform: booleanAttribute });

  private readonly id = nextPopover++;
  protected readonly buttonId = `ave-popover-button-${String(this.id)}`;
  protected readonly panelId = `ave-popover-${String(this.id)}`;
  protected readonly headingId = `ave-popover-heading-${String(this.id)}`;

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly injector = inject(Injector);
  private readonly focusTraps = inject(FocusTrapFactory);
  private readonly button = viewChild<unknown, ElementRef<HTMLElement>>('button', { read: ElementRef });
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  /** The overlay stays open while the panel plays its exit (ADR 0046). */
  protected readonly presence = aveOverlayPresence(
    this.open,
    computed(() => this.panel()?.nativeElement),
  );

  /** The panel opens from its button; the host stands in until the button is drawn, before the panel can open. */
  protected readonly overlay = computed(() =>
    aveConnectedOverlay(this.button()?.nativeElement ?? this.host, {
      matchWidth: false,
      transformOrigin: '.panel',
      align: 'either',
    }),
  );

  constructor() {
    // Opening moves focus into the panel once it is drawn; closing while focus is inside returns it to the button.
    let wasOpen = false;
    effect(() => {
      const open = this.open();
      untracked(() => {
        if (open && !wasOpen) this.focusInside();
        if (!open && wasOpen && this.holdsFocus()) this.button()?.nativeElement.focus();
      });
      wasOpen = open;
    });
  }

  /** The button opens the panel, or closes it. */
  protected toggle(): void {
    this.open.set(!this.open());
  }

  /** Escape closes the panel and returns focus to the button; a dialog around it stays open. */
  protected escape(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.open.set(false);
  }

  /** A press outside closes the panel; one on its own button toggles it. */
  protected outside(event: MouseEvent): void {
    if (event.target instanceof Node && this.host.contains(event.target)) return;
    this.open.set(false);
  }

  /** Focus went on, outside the panel and its button: the panel closes, and focus stays where it went. */
  protected focusLeft(event: FocusEvent): void {
    const next = event.relatedTarget;
    if (!(next instanceof Node)) return;
    if (this.panel()?.nativeElement.contains(next) === true || this.host.contains(next)) return;
    this.open.set(false);
  }

  /** Whether focus is in the panel. */
  private holdsFocus(): boolean {
    const active = this.host.ownerDocument.activeElement;
    return active !== null && this.panel()?.nativeElement.contains(active) === true;
  }

  /** The first field of the panel (or its `cdkFocusInitial`) takes focus; the panel itself when it has none. */
  private focusInside(): void {
    afterNextRender(
      () => {
        const panel = this.panel()?.nativeElement;
        if (panel === undefined) return;
        const trap = this.focusTraps.create(panel, true);
        if (!trap.focusInitialElement()) panel.focus();
        trap.destroy();
      },
      { injector: this.injector },
    );
  }
}
