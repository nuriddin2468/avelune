import { Component, inject, signal } from '@angular/core';
import { FormField, email, form, maxLength, minLength, pattern, required, submit } from '@angular/forms/signals';
import { AveButton } from '@avelune/ui/button';
import { AveCheckbox, AveChoice } from '@avelune/ui/checkbox';
import { AveDatePicker, AveDateRangePicker, type AveDateRange, type AveDateRangePreset } from '@avelune/ui/date-picker';
import { AveFileUpload } from '@avelune/ui/file-upload';
import { AveChoiceGroup, AveError, AveFormField, AveHint } from '@avelune/ui/form-field';
import { AveIcon } from '@avelune/ui/icon';
import { AveInput } from '@avelune/ui/input';
import { AveRadio } from '@avelune/ui/radio';
import { AveCombobox, AveMultiselect, AveSelect } from '@avelune/ui/select';
import { AveSlider } from '@avelune/ui/slider';
import { AveTextarea } from '@avelune/ui/textarea';
import { CounterpartyDirectory } from './counterparty-directory';
import { approvers, contractKinds } from './data';

interface Contract {
  number: string;
  kind: string | null;
  counterparty: number | null;
  approvers: string[];
  signedOn: string | null;
  term: AveDateRange | null;
  subject: string;
  attachments: readonly File[];
  amount: string;
  advance: number;
  email: string;
  signing: string;
  notify: boolean;
  confirm: boolean;
}

const empty: Contract = {
  number: '',
  kind: null,
  counterparty: null,
  approvers: [],
  signedOn: null,
  term: null,
  subject: '',
  attachments: [],
  amount: '',
  advance: 30,
  email: '',
  signing: '',
  notify: true,
  confirm: false,
};

/** The next calendar year, as a contract's term often is. */
const nextYear = new Date().getFullYear() + 1;

/** Terms people give contracts again and again: the kit's periods, and the next year, the application's own. */
const termPresets: readonly AveDateRangePreset[] = [
  'thisMonth',
  'thisQuarter',
  'thisYear',
  { label: `${String(nextYear)} год`, start: `${String(nextYear)}-01-01`, end: `${String(nextYear)}-12-31` },
];

/** How long the showcase pretends the server takes to accept a contract. */
const sendDelay = 1500;

/**
 * A realistic form of the kit's controls: every field in a FormField, required and optional, a hint on each, errors
 * once a field is left or the form is sent, a textarea across both columns, a group of radios and a group of
 * checkboxes, and the form's actions, primary last.
 */
@Component({
  selector: 'ave-showcase-contract-form',
  imports: [
    AveButton,
    AveCheckbox,
    AveChoice,
    AveChoiceGroup,
    AveCombobox,
    AveDatePicker,
    AveDateRangePicker,
    AveError,
    AveFileUpload,
    AveFormField,
    AveHint,
    AveIcon,
    AveInput,
    AveMultiselect,
    AveRadio,
    AveSelect,
    AveSlider,
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

        <ave-form-field label="Вид договора">
          <ave-select [options]="contractKinds" placeholder="Выберите вид" [formField]="contract.kind" />
          @if (contract.kind().errors().length > 0) {
            <p aveError>Выберите вид договора.</p>
          }
        </ave-form-field>

        <ave-form-field label="Контрагент">
          <ave-combobox
            search="server"
            placeholder="Название или ИНН"
            [options]="directory.options()"
            [loading]="directory.loading()"
            [hasMore]="directory.hasMore()"
            [formField]="contract.counterparty"
            (query)="directory.search($event)"
            (loadMore)="directory.more()"
          />
          <p aveHint>Организации из справочника контрагентов, по названию или ИНН.</p>
          @if (contract.counterparty().errors().length > 0) {
            <p aveError>Выберите контрагента из справочника.</p>
          }
        </ave-form-field>

        <ave-form-field label="Дата подписания">
          <ave-date-picker [formField]="contract.signedOn" />
          @if (contract.signedOn().errors().length > 0) {
            <p aveError>Укажите дату подписания, например 18.03.2026.</p>
          }
        </ave-form-field>

        <ave-form-field label="Срок действия">
          <ave-date-range-picker [presets]="termPresets" [formField]="contract.term" />
          <p aveHint>С даты вступления в силу до окончания обязательств.</p>
        </ave-form-field>

        <ave-form-field class="wide" label="Предмет договора">
          <textarea aveTextarea [formField]="contract.subject"></textarea>
          <p aveHint>Кратко: что поставляется или выполняется, куда и в какие сроки. До 500 знаков.</p>
          @if (contract.subject().errors().length > 0) {
            <p aveError>Опишите предмет договора: не короче 20 знаков.</p>
          }
        </ave-form-field>

        <ave-form-field class="wide" label="Приложения">
          <ave-file-upload
            multiple
            accept=".pdf,.docx,image/*"
            [maxSize]="attachmentLimit"
            [maxFiles]="10"
            [formField]="contract.attachments"
          />
          <p aveHint>Спецификация, смета, скан подписанного экземпляра: PDF, DOCX или изображения, до 20 МБ каждый.</p>
        </ave-form-field>

        <ave-form-field label="Сумма договора, сум">
          <input aveInput type="text" inputmode="decimal" autocomplete="off" [formField]="contract.amount" />
          <p aveHint>Без НДС, цифрами: 125000000.</p>
          @if (contract.amount().errors().length > 0) {
            <p aveError>Укажите сумму цифрами, например 125000000.</p>
          }
        </ave-form-field>

        <ave-form-field label="Аванс">
          <ave-slider [maxValue]="100" [step]="5" [format]="percent" [formField]="contract.advance" />
          <p aveHint>Доля суммы договора, которую контрагент получает до поставки.</p>
        </ave-form-field>

        <ave-form-field label="Согласующие">
          <ave-multiselect
            [options]="approvers"
            placeholder="Выберите подразделения"
            [formField]="contract.approvers"
          />
          <p aveHint>Юридический отдел согласует каждый договор.</p>
        </ave-form-field>

        <ave-form-field label="Почта для уведомлений">
          <input aveInput type="email" autocomplete="email" [formField]="contract.email" />
          @if (contract.email().errors().length > 0) {
            <p aveError>Укажите адрес вида name@example.uz.</p>
          }
        </ave-form-field>
      </div>

      <div class="choices">
        <fieldset aveChoiceGroup legend="Форма подписания">
          <label aveChoice>
            <input type="radio" aveRadio value="digital" [formField]="contract.signing" />
            Электронная цифровая подпись
          </label>
          <label aveChoice>
            <input type="radio" aveRadio value="paper" [formField]="contract.signing" />
            На бумаге, в офисе контрагента
          </label>
          <p aveHint>Бумажный экземпляр передайте в канцелярию в течение трёх рабочих дней.</p>
          @if (contract.signing().errors().length > 0) {
            <p aveError>Выберите, как будет подписан договор.</p>
          }
        </fieldset>

        <fieldset aveChoiceGroup legend="Перед отправкой">
          <label aveChoice>
            <input type="checkbox" aveCheckbox [formField]="contract.notify" />
            Уведомить контрагента по электронной почте, когда договор будет согласован
          </label>
          <label aveChoice>
            <input type="checkbox" aveCheckbox [formField]="contract.confirm" />
            Подтверждаю, что данные договора сверены с подписанным экземпляром
          </label>
          <!-- The error belongs to the confirmation alone, so it waits until that checkbox is touched. -->
          @if (contract.confirm().invalid() && contract.confirm().touched()) {
            <p aveError>Подтвердите сверку, чтобы отправить договор на согласование.</p>
          }
        </fieldset>
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
  protected readonly contractKinds = contractKinds;
  protected readonly directory = inject(CounterpartyDirectory);
  protected readonly approvers = approvers;
  protected readonly attachmentLimit = 20 * 1024 * 1024;
  protected readonly termPresets = termPresets;
  protected readonly percent: Intl.NumberFormatOptions = { style: 'unit', unit: 'percent' };
  protected readonly model = signal<Contract>({ ...empty });
  protected readonly contract = form(this.model, (path) => {
    required(path.number);
    pattern(path.number, /^ДК-\d{4}\/\d+$/);
    required(path.kind);
    required(path.counterparty);
    required(path.signedOn);
    required(path.subject);
    minLength(path.subject, 20);
    maxLength(path.subject, 500);
    required(path.amount);
    pattern(path.amount, /^\d+$/);
    email(path.email);
    required(path.signing);
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
