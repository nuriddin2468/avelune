import {
  DestroyRef,
  Directive,
  ElementRef,
  Injector,
  PLATFORM_ID,
  PendingTasks,
  Renderer2,
  effect,
  inject,
  input,
  untracked,
  type ComponentRef,
} from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { AriaDescriber } from '@angular/cdk/a11y';
import {
  createFlexibleConnectedPositionStrategy,
  createOverlayRef,
  createRepositionScrollStrategy,
  type ConnectedPosition,
  type ConnectionPositionPair,
  type OverlayRef,
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { aveDurationToken } from '@avelune/ui/theme';
import { AveTooltipPanel } from './panel';
import type { AveTooltipSide } from './types';

/** Where the panel attaches for each side: centred on the element, against its edge. */
const centred: Readonly<Record<AveTooltipSide, ConnectedPosition>> = {
  top: { originX: 'center', originY: 'top', overlayX: 'center', overlayY: 'bottom' },
  bottom: { originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top' },
  start: { originX: 'start', originY: 'center', overlayX: 'end', overlayY: 'center' },
  end: { originX: 'end', originY: 'center', overlayX: 'start', overlayY: 'center' },
};

const opposite: Readonly<Record<AveTooltipSide, AveTooltipSide>> = {
  top: 'bottom',
  bottom: 'top',
  start: 'end',
  end: 'start',
};

/**
 * The positions to try for a side, in order: centred on it; above or under, aligned with the element's start or end
 * instead, for a text wider than the room around the centre; then the same on the opposite side.
 */
function positionsFor(side: AveTooltipSide): ConnectedPosition[] {
  const aligned = (position: ConnectedPosition): ConnectedPosition[] =>
    position.overlayX === 'center'
      ? [
          position,
          { ...position, originX: 'start', overlayX: 'start' },
          { ...position, originX: 'end', overlayX: 'end' },
        ]
      : [position];
  return [...aligned(centred[side]), ...aligned(centred[opposite[side]])];
}

/** The side a connection pair puts the panel on. */
function sideOf(pair: ConnectionPositionPair): AveTooltipSide {
  if (pair.overlayY === 'bottom' && pair.originY === 'top') return 'top';
  if (pair.overlayY === 'top' && pair.originY === 'bottom') return 'bottom';
  return pair.originX === 'start' ? 'start' : 'end';
}

let nextKey = 0;

/**
 * When the last tooltip hid. A tooltip asked for within the delay after another hid shows at once, so moving along a
 * toolbar does not wait at every button.
 */
let lastHidden = Number.NEGATIVE_INFINITY;

/**
 * The kit's tooltip (brief §6.3, ADR 0063): a short text about an element, shown next to it after the pointer has
 * rested on it for `timing.tooltip-delay` (500ms), or at once when it takes keyboard focus. It hides at once when the
 * pointer leaves both, when focus leaves, on a press and on Escape; the pointer may move onto the text. The element is
 * described by the same text for assistive technology, unless it already is its name. Never the only place of
 * information, never interactive content.
 *
 * ```html
 * <button aveIconButton type="button" icon="download" label="Выгрузить в Excel" aveTooltip="Выгрузить в Excel"></button>
 * ```
 *
 * @alpha
 */
@Directive({
  selector: '[aveTooltip]',
  host: {
    '[attr.data-ave-tooltip]': 'key',
    '(pointerenter)': 'entered($event)',
    '(pointerleave)': 'left($event)',
    '(pointerdown)': 'hide()',
    '(focusin)': 'focused()',
    '(focusout)': 'hide()',
  },
})
export class AveTooltip {
  /** The text: a few words about the element ("Выгрузить в Excel"). An empty text shows no tooltip. */
  readonly aveTooltip = input.required<string>();

  /** Where it shows: `top` (default), `bottom`, `start` or `end`; the opposite side when there is no room. */
  readonly aveTooltipSide = input<AveTooltipSide>('top');

  /** The key that ties the element to its panel (`data-ave-tooltip`, `data-ave-tooltip-of`). */
  protected readonly key = `ave-tooltip-${String(nextKey++)}`;

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly injector = inject(Injector);
  private readonly renderer = inject(Renderer2);
  private readonly document = inject(DOCUMENT);
  private readonly tasks = inject(PendingTasks);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));

  private overlay: OverlayRef | undefined;
  private panel: ComponentRef<AveTooltipPanel> | undefined;
  private timer: ReturnType<typeof setTimeout> | undefined;
  /** Ends the pending task that keeps the application unstable while a tooltip is about to show or leave. */
  private settle: (() => void) | undefined;
  private stopListening: (() => void)[] = [];

  constructor() {
    if (this.browser) {
      const describer = inject(AriaDescriber);
      effect((onCleanup) => {
        const text = this.aveTooltip().trim();
        if (text === '') return;
        describer.describe(this.host, text);
        onCleanup(() => {
          describer.removeDescription(this.host, text);
        });
      });
    }
    effect(() => {
      const text = this.aveTooltip();
      untracked(() => {
        if (text.trim() === '') this.hide();
        else this.panel?.setInput('text', text);
      });
    });
    inject(DestroyRef).onDestroy(() => {
      this.cancel();
      this.unlisten();
      this.overlay?.dispose();
      this.done();
    });
  }

  /** The pointer came onto the element; a touch never shows a tooltip. */
  protected entered(event: PointerEvent): void {
    if (event.pointerType !== 'touch') this.schedule();
  }

  /** The pointer left the element, and not for the tooltip's own text. */
  protected left(event: PointerEvent): void {
    if (event.relatedTarget instanceof Node && this.overlay?.overlayElement.contains(event.relatedTarget) === true) {
      return;
    }
    this.hide();
  }

  /** Keyboard focus came to the element: its tooltip shows at once. A click's focus shows none. */
  protected focused(): void {
    if (this.host.matches(':focus-visible')) this.schedule(0);
  }

  /** Hides the tooltip at once, or cancels one about to show. */
  hide(): void {
    this.cancel();
    const panel = this.panel;
    if (panel === undefined || panel.instance.closing()) {
      this.done();
      return;
    }
    lastHidden = performance.now();
    this.unlisten();
    panel.setInput('closing', true);
    panel.changeDetectorRef.detectChanges();
    this.pending();
    const animations = (panel.location.nativeElement as HTMLElement).getAnimations();
    void Promise.allSettled(animations.map((animation) => animation.finished)).then(() => {
      if (this.panel === panel && panel.instance.closing()) this.detach();
      this.done();
    });
  }

  private schedule(delay?: number): void {
    if (this.aveTooltip().trim() === '' || this.timer !== undefined) return;
    if (this.panel !== undefined && !this.panel.instance.closing()) return;
    const wait = aveDurationToken(this.host, '--ave-timing-tooltip-delay');
    const warm = performance.now() - lastHidden < wait;
    this.pending();
    this.timer = setTimeout(
      () => {
        this.timer = undefined;
        this.show();
      },
      warm ? 0 : (delay ?? wait),
    );
  }

  private show(): void {
    const overlay = (this.overlay ??= this.create());
    if (this.panel === undefined || !overlay.hasAttached()) {
      this.panel = overlay.attach(new ComponentPortal(AveTooltipPanel, null, this.injector));
      this.panel.setInput('owner', this.key);
      this.listen(this.panel.location.nativeElement as HTMLElement);
    }
    this.panel.setInput('text', this.aveTooltip());
    this.panel.setInput('closing', false);
    this.panel.changeDetectorRef.detectChanges();
    overlay.updatePosition();
    this.done();
  }

  private create(): OverlayRef {
    const side = this.aveTooltipSide();
    // Pushed back inside the viewport, `space.2` from its edge, when the text is wider than the room beside the
    // element; the token is read from the element, as the kit reads its timings.
    const margin = Number.parseFloat(getComputedStyle(this.host).getPropertyValue('--ave-space-2')) || 0;
    const strategy = createFlexibleConnectedPositionStrategy(this.injector, this.host)
      .withPositions(positionsFor(side))
      .withFlexibleDimensions(false)
      .withPush(true)
      .withViewportMargin(margin)
      .withPopoverLocation('inline');
    strategy.positionChanges.subscribe((change) => {
      this.panel?.setInput('side', sideOf(change.connectionPair));
    });
    const overlay = createOverlayRef(this.injector, {
      positionStrategy: strategy,
      scrollStrategy: createRepositionScrollStrategy(this.injector, { autoClose: true }),
      usePopover: true,
    });
    // A tooltip whose element scrolled out of sight is detached by the scroll strategy.
    overlay.detachments().subscribe(() => {
      this.panel = undefined;
      this.unlisten();
    });
    return overlay;
  }

  /** While it shows: Escape hides it before anything else hears the key, and the text keeps it while hovered. */
  private listen(panel: HTMLElement): void {
    this.unlisten();
    const escape = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopPropagation();
      this.hide();
    };
    this.document.addEventListener('keydown', escape, true);
    this.stopListening = [
      () => {
        this.document.removeEventListener('keydown', escape, true);
      },
      this.renderer.listen(panel, 'pointerleave', (event: PointerEvent) => {
        if (event.relatedTarget instanceof Node && this.host.contains(event.relatedTarget)) return;
        this.hide();
      }),
    ];
  }

  private unlisten(): void {
    for (const stop of this.stopListening) stop();
    this.stopListening = [];
  }

  private detach(): void {
    this.overlay?.detach();
    this.panel = undefined;
  }

  private cancel(): void {
    clearTimeout(this.timer);
    this.timer = undefined;
  }

  /** Marks the application unstable until the tooltip has shown or gone, so tests and harnesses wait for it. */
  private pending(): void {
    this.settle ??= this.tasks.add();
  }

  private done(): void {
    this.settle?.();
    this.settle = undefined;
  }
}
