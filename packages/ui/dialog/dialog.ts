import { Component, ElementRef, computed, input, model, viewChild } from '@angular/core';
import { lucideX } from '@avelune/icons/lucide';
import { AveIconButton } from '@avelune/ui/button';
import { injectAveMessages } from '@avelune/ui/i18n';
import { provideAveIcons } from '@avelune/ui/icon';
import { AveTooltip } from '@avelune/ui/tooltip';
import { aveHostAnnouncer } from '@avelune/ui/overlay';
import { aveModal, aveOverflows } from './modal';
import type { AveDialogSize } from './types';

let nextDialog = 0;

/**
 * The actions of a dialog or a drawer: its buttons in a row at the end of the panel, under the content, the primary one
 * last (ADR 0066).
 *
 * ```html
 * <div aveDialogActions>
 *   <button aveButton type="button" (click)="editing.set(false)">Отмена</button>
 *   <button aveButton type="submit" variant="primary" form="counterparty">Сохранить</button>
 * </div>
 * ```
 *
 * @beta
 */
@Component({
  selector: '[aveDialogActions]',
  template: '<ng-content />',
  styleUrl: './actions.css',
})
export class AveDialogActions {}

/**
 * The kit's dialog (GUIDELINES.md, "Dialog, drawer or page"; ADR 0066) on a native `<dialog>`, shown modally: a short,
 * focused task that blocks the page until it is done or dismissed. The page behind is inert and does not scroll; focus
 * goes to the first field (or the element with `autofocus`) and returns to where it was when the dialog closes. Escape,
 * the close button and a click on the backdrop close it; `open` says whether it is shown.
 *
 * ```html
 * <dialog aveDialog heading="Изменить контрагента" [(open)]="editing">
 *   <form id="counterparty" (submit)="save($event)">…</form>
 *   <div aveDialogActions>…</div>
 * </dialog>
 * ```
 *
 * @beta
 */
@Component({
  selector: 'dialog[aveDialog]',
  imports: [AveIconButton, AveTooltip],
  providers: [provideAveIcons([lucideX]), ...aveHostAnnouncer],
  host: {
    class: 'ave-motion-backdrop-enter',
    '[class.ave-motion-backdrop-exit]': 'modal.closing()',
    '[attr.aria-labelledby]': 'headingId',
    '[attr.data-size]': 'size()',
    '(cancel)': 'modal.cancel($event)',
    '(close)': 'modal.closed()',
    '(pointerdown)': 'modal.pressed($event)',
    '(click)': 'modal.clicked($event)',
  },
  template: `
    <div class="panel ave-motion-dialog-enter" [class.ave-motion-dialog-exit]="modal.closing()">
      <h2 class="heading" [id]="headingId">{{ heading() }}</h2>
      <div #body class="body" data-focus-ring="inset" [attr.tabindex]="overflows() ? 0 : null"><ng-content /></div>
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
  styleUrl: './dialog.css',
})
export class AveDialog {
  /** What the dialog is for, as its title and name ("Изменить контрагента"). */
  readonly heading = input.required<string>();

  /** Whether the dialog is shown. Escape, the close button and the backdrop set it to false. */
  readonly open = model(false);

  /** The width: at most `sm` 480px, `md` 640px (default) or `lg` 960px. */
  readonly size = input<AveDialogSize>('md');

  protected readonly headingId = `ave-dialog-heading-${String(nextDialog++)}`;
  protected readonly messages = injectAveMessages();
  protected readonly modal = aveModal(this.open);

  private readonly body = viewChild<ElementRef<HTMLElement>>('body');

  /** The content scrolls when it is taller than the room: then the body takes keyboard focus, to be scrolled. */
  protected readonly overflows = aveOverflows(computed(() => this.body()?.nativeElement));
}
