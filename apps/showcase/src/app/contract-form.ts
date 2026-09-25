import { Component, signal } from '@angular/core';
import { FormField, email, form, maxLength, minLength, pattern, required, submit } from '@angular/forms/signals';
import { AveButton } from '@avelune/ui/button';
import { AveCheckbox, AveChoice } from '@avelune/ui/checkbox';
import { AveError, AveFormField, AveHint } from '@avelune/ui/form-field';
import { AveIcon } from '@avelune/ui/icon';
import { AveInput } from '@avelune/ui/input';
import { AveTextarea } from '@avelune/ui/textarea';

interface Contract {
  number: string;
  counterparty: string;
  subject: string;
  amount: string;
  email: string;
  notify: boolean;
  confirm: boolean;
}

const empty: Contract = {
  number: '',
  counterparty: '',
  subject: '',
  amount: '',
  email: '',
  notify: true,
  confirm: false,
};

/** How long the showcase pretends the server takes to accept a contract. */
const sendDelay = 1500;

/**
 * A realistic form of the kit's controls: every field in a FormField, required and optional, a hint on each, errors
 * once a field is left or the form is sent, a textarea across both columns, two checkboxes, and the form's actions,
 * primary last.
 */
@Component({
  selector: 'ave-showcase-contract-form',
  imports: [
    AveButton,
    AveCheckbox,
    AveChoice,
    AveError,
    AveFormField,
    AveHint,
    AveIcon,
    AveInput,
    AveTextarea,
    FormField,
  ],
  template: `
    <form class="card" lang="ru" novalidate (submit)="send($event)">
      <header class="header">
        <h1 class="title">Новый договор</h1>
        <p class="note">* — обязательные поля</p>
      </header>

      <div class="fields">
        <ave-form-field label="Номер договора">
          <input aveInput type="text" autocomplete="off" [formField]="contract.number" />
          <p aveHint>Как в подписанном экземпляре, например ДК-2026/114.</p>
          @if (contract.number().errors().length > 0) {
            <p aveError>Укажите номер в виде ДК-2026/114.</p>
          }
        </ave-form-field>

        <ave-form-field label="Контрагент">
          <input aveInput type="text" autocomplete="organization" [formField]="contract.counterparty" />
          <p aveHint>Полное наименование организации, как в её уставе.</p>
          @if (contract.counterparty().errors().length > 0) {
            <p aveError>Укажите наименование контрагента.</p>
          }
        </ave-form-field>

        <ave-form-field class="wide" label="Предмет договора">
          <textarea aveTextarea [formField]="contract.subject"></textarea>
          <p aveHint>Кратко: что поставляется или выполняется, куда и в какие сроки. До 500 знаков.</p>
          @if (contract.subject().errors().length > 0) {
            <p aveError>Опишите предмет договора: не короче 20 знаков.</p>
          }
        </ave-form-field>

        <ave-form-field label="Сумма договора, сум">
          <input aveInput type="text" inputmode="decimal" autocomplete="off" [formField]="contract.amount" />
          <p aveHint>Без НДС, цифрами: 125000000.</p>
          @if (contract.amount().errors().length > 0) {
            <p aveError>Укажите сумму цифрами, например 125000000.</p>
          }
        </ave-form-field>

        <ave-form-field label="Почта для уведомлений">
          <input aveInput type="email" autocomplete="email" [formField]="contract.email" />
          @if (contract.email().errors().length > 0) {
            <p aveError>Укажите адрес вида name@example.uz.</p>
          }
        </ave-form-field>
      </div>

      <div class="choices">
        <label aveChoice>
          <input type="checkbox" aveCheckbox [formField]="contract.notify" />
          Уведомить контрагента по электронной почте, когда договор будет согласован
        </label>
        <label aveChoice>
          <input type="checkbox" aveCheckbox aria-describedby="confirm-error" [formField]="contract.confirm" />
          Подтверждаю, что данные договора сверены с подписанным экземпляром
        </label>
        <!-- Always in the page, so the checkbox's description never points at a missing id; empty while valid. -->
        <div id="confirm-error" class="message">
          @if (contract.confirm().invalid() && contract.confirm().touched()) {
            <p class="error">
              <ave-icon name="circle-alert" decorative />
              Подтвердите сверку, чтобы отправить договор на согласование.
            </p>
          }
        </div>
      </div>

      <footer class="actions">
        <div class="buttons">
          <button aveButton type="button" variant="ghost" [disabled]="sending()" (click)="saveDraft()">
            Сохранить черновик
          </button>
          <span class="spacer"></span>
          <button aveButton type="button" [disabled]="sending()" (click)="reset()">Отмена</button>
          <button aveButton type="submit" variant="primary" [loading]="sending()">Отправить на согласование</button>
        </div>
        <p class="status" role="status">
          @if (status(); as message) {
            <ave-icon name="circle-check" decorative />
            {{ message }}
          }
        </p>
      </footer>
    </form>
  `,
  styleUrl: './contract-form.css',
})
export class ContractForm {
  protected readonly model = signal<Contract>({ ...empty });
  protected readonly contract = form(this.model, (path) => {
    required(path.number);
    pattern(path.number, /^ДК-\d{4}\/\d+$/);
    required(path.counterparty);
    required(path.subject);
    minLength(path.subject, 20);
    maxLength(path.subject, 500);
    required(path.amount);
    pattern(path.amount, /^\d+$/);
    email(path.email);
    required(path.confirm);
  });
  protected readonly sending = signal(false);
  protected readonly status = signal<string | null>(null);

  /** Sends the contract: marks every field touched, and either focuses the first error or pretends to send it. */
  protected send(event: Event): void {
    event.preventDefault();
    this.status.set(null);
    void submit(this.contract, {
      action: async () => {
        this.sending.set(true);
        await new Promise((resolve) => setTimeout(resolve, sendDelay));
        this.sending.set(false);
        this.status.set(`Договор ${this.model().number} отправлен на согласование.`);
        return undefined;
      },
      onInvalid: (_field, { root }) => {
        root().errorSummary()[0]?.fieldTree().focusBoundControl();
      },
    });
  }

  protected saveDraft(): void {
    this.status.set('Черновик сохранён.');
  }

  protected reset(): void {
    this.model.set({ ...empty });
    this.contract().reset();
    this.status.set(null);
  }
}
