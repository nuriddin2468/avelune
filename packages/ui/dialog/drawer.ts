import { Component, ElementRef, computed, input, model, viewChild } from '@angular/core';
import { lucideX } from '@avelune/icons/lucide';
import { AveIconButton } from '@avelune/ui/button';
import { injectAveMessages } from '@avelune/ui/i18n';
import { provideAveIcons } from '@avelune/ui/icon';
import { AveTooltip } from '@avelune/ui/tooltip';
import { aveModal, aveOverflows, dialogAnnouncer } from './modal';
import type { AveDrawerSide, AveDrawerSize } from './types';

let nextDrawer = 0;

/**
 * The kit's drawer (GUIDELINES.md, "Dialog, drawer or page"; ADR 0067) on a native `<dialog>`, shown modally: details
 * or a form beside the list they belong to, in a panel that slides in from the inline end (or the start) and takes the
 * screen's full height. It behaves as the kit's dialog: the page is inert and still, focus goes in and comes back, and
 * Escape, the close button and the backdrop close it. Its actions (`aveDialogActions`) stay at its foot.
 *
 * ```html
 * <dialog aveDrawer heading="Договор ДК-2026/114" [(open)]="viewing">
 *   <dl>…</dl>
 *   <div aveDialogActions>…</div>
 * </dialog>
 * ```
 *
 * @alpha
 */
@Component({
  selector: 'dialog[aveDrawer]',
  imports: [AveIconButton, AveTooltip],
  providers: [provideAveIcons([lucideX]), ...dialogAnnouncer],
  host: {
    class: 'ave-motion-backdrop-enter',
    '[class.ave-motion-backdrop-exit]': 'modal.closing()',
    '[attr.aria-labelledby]': 'headingId',
    '[attr.data-side]': 'side()',
    '[attr.data-size]': 'size()',
    '(cancel)': 'modal.cancel($event)',
    '(close)': 'modal.closed()',
    '(pointerdown)': 'modal.pressed($event)',
    '(click)': 'modal.clicked($event)',
  },
  template: `
    <div
      class="panel ave-motion-drawer-enter"
      [class.ave-motion-drawer-exit]="modal.closing()"
      [attr.data-side]="side()"
    >
      <h2 class="heading" [id]="headingId">{{ heading() }}</h2>
      <div #body class="body" [attr.tabindex]="overflows() ? 0 : null"><ng-content /></div>
      <ng-content select="[aveDialogActions]" />
      <button
        aveIconButton
        class="close"
        type="button"
        variant="ghost"
        size="sm"
        icon="x"
        [label]="messages.close"
        [aveTooltip]="messages.close"
        (click)="open.set(false)"
      ></button>
    </div>
  `,
  styleUrls: ['./dialog.css', './drawer.css'],
})
export class AveDrawer {
  /** What the drawer shows, as its title and name ("Договор ДК-2026/114"). */
  readonly heading = input.required<string>();

  /** Whether the drawer is shown. Escape, the close button and the backdrop set it to false. */
  readonly open = model(false);

  /** The edge it slides in from: `end` (default), the inline end, or `start`. */
  readonly side = input<AveDrawerSide>('end');

  /** The width: at most `sm` 320px, `md` 480px (default) or `lg` 640px; the whole screen on a phone. */
  readonly size = input<AveDrawerSize>('md');

  protected readonly headingId = `ave-drawer-heading-${String(nextDrawer++)}`;
  protected readonly messages = injectAveMessages();
  protected readonly modal = aveModal(this.open);

  private readonly body = viewChild<ElementRef<HTMLElement>>('body');

  /** The content scrolls when it is taller than the screen: then the body takes keyboard focus, to be scrolled. */
  protected readonly overflows = aveOverflows(computed(() => this.body()?.nativeElement));
}
