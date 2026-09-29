import { Component, input, model, output } from '@angular/core';
import { AveButton } from '@avelune/ui/button';
import { injectAveMessages } from '@avelune/ui/i18n';
import { aveHostAnnouncer } from '@avelune/ui/overlay';
import { aveModal } from './modal';
import type { AveConfirmVariant } from './types';

let nextConfirm = 0;

/**
 * The kit's confirmation (GUIDELINES.md, "Writing"; ADR 0066) on a native `<dialog>`: a question before an action
 * that cannot be undone, answered with a button that names the action ("Удалить договор") or with Cancel. It is an
 * `alertdialog` described by its message, and Cancel, its first control, has focus when it opens, so Enter never
 * destroys by accident; keep links out of the message.
 * Confirming emits `confirm` and closes it; Cancel, Escape and the backdrop only close it.
 *
 * ```html
 * <dialog aveConfirmDialog heading="Удалить договор ДК-2026/114?" action="Удалить договор" [(open)]="asking" (confirm)="remove()">
 *   Договор и его приложения будут удалены без возможности восстановления.
 * </dialog>
 * ```
 *
 * @alpha
 */
@Component({
  selector: 'dialog[aveConfirmDialog]',
  imports: [AveButton],
  providers: aveHostAnnouncer,
  host: {
    class: 'ave-motion-backdrop-enter',
    role: 'alertdialog',
    'data-size': 'sm',
    '[class.ave-motion-backdrop-exit]': 'modal.closing()',
    '[attr.aria-labelledby]': 'headingId',
    '[attr.aria-describedby]': 'messageId',
    '(cancel)': 'modal.cancel($event)',
    '(close)': 'modal.closed()',
    '(pointerdown)': 'modal.pressed($event)',
    '(click)': 'modal.clicked($event)',
  },
  template: `
    <div class="panel ave-motion-dialog-enter" [class.ave-motion-dialog-exit]="modal.closing()">
      <h2 class="heading" [id]="headingId">{{ heading() }}</h2>
      <div class="body" [id]="messageId"><ng-content /></div>
      <div class="actions">
        <button aveButton type="button" (click)="open.set(false)">{{ cancel() || messages.cancel }}</button>
        <button aveButton type="button" [variant]="variant()" (click)="confirmed()">{{ action() }}</button>
      </div>
    </div>
  `,
  styleUrls: ['./dialog.css', './confirm-dialog.css'],
})
export class AveConfirmDialog {
  /** The question, naming the action and its object ("Удалить договор ДК-2026/114?"). */
  readonly heading = input.required<string>();

  /** The confirming button: the action itself, never "Да" or "OK" ("Удалить договор"). */
  readonly action = input.required<string>();

  /** The button that keeps things as they are; "Cancel" in the application's locale by default. */
  readonly cancel = input('');

  /** The confirming button's variant: `danger` (default) for what cannot be undone, `primary` otherwise. */
  readonly variant = input<AveConfirmVariant>('danger');

  /** Whether the confirmation is shown. Cancel, Escape and the backdrop set it to false. */
  readonly open = model(false);

  /** Emits when the person confirms, as the confirmation closes. */
  readonly confirm = output();

  private readonly id = nextConfirm++;
  protected readonly headingId = `ave-confirm-heading-${String(this.id)}`;
  protected readonly messageId = `ave-confirm-message-${String(this.id)}`;
  protected readonly messages = injectAveMessages();
  protected readonly modal = aveModal(this.open);

  protected confirmed(): void {
    this.confirm.emit();
    this.open.set(false);
  }
}
