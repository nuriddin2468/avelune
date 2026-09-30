import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  lucideArchive,
  lucideCopy,
  lucideDownload,
  lucideEllipsis,
  lucideFileText,
  lucideFileX,
  lucidePaperclip,
  lucidePencil,
  lucidePrinter,
  lucideX,
} from '@avelune/icons/lucide';
import { AveAccordion, AveAccordionItem } from '@avelune/ui/accordion';
import { AveAvatar } from '@avelune/ui/avatar';
import { AveBadge } from '@avelune/ui/badge';
import { AveBreadcrumbs, type AveBreadcrumb } from '@avelune/ui/breadcrumbs';
import { AveButton, AveIconButton } from '@avelune/ui/button';
import { AveStepper, type AveStep } from '@avelune/ui/stepper';
import { AveTab, AveTabs } from '@avelune/ui/tabs';
import { AveToaster } from '@avelune/ui/toast';
import { AveToolbar, AveToolbarItem, AveToolbarSeparator } from '@avelune/ui/toolbar';
import { AveTooltip } from '@avelune/ui/tooltip';
import { AveEmptyState, AveEmptyStateActions } from '@avelune/ui/empty-state';
import { AveLink } from '@avelune/ui/link';
import { AveList, AveListItem } from '@avelune/ui/list';
import { aveDateFormat, aveNumberFormat } from '@avelune/ui/i18n';
import { AveIcon, provideAveIcons } from '@avelune/ui/icon';
import { AveMenu, type AveMenuEntry } from '@avelune/ui/menu';
import { contractOf } from './contract-title';
import { contractStatusVariants, contractStatuses, type ContractRecord } from './data';

/**
 * A contract's own page, under the register: where it is in the product, its subject, a toolbar of its actions, and
 * its facts, approval, files and history in tabs. The register links each contract's subject here.
 */
@Component({
  selector: 'ave-showcase-contract',
  imports: [
    AveAccordion,
    AveAccordionItem,
    AveAvatar,
    AveBadge,
    AveBreadcrumbs,
    AveButton,
    AveEmptyState,
    AveEmptyStateActions,
    AveIcon,
    AveIconButton,
    AveLink,
    AveList,
    AveListItem,
    AveMenu,
    AveStepper,
    AveTab,
    AveTabs,
    AveToolbar,
    AveToolbarItem,
    AveToolbarSeparator,
    AveTooltip,
    RouterLink,
  ],
  providers: [
    provideAveIcons([
      lucideArchive,
      lucideCopy,
      lucideDownload,
      lucideEllipsis,
      lucideFileText,
      lucideFileX,
      lucidePaperclip,
      lucidePencil,
      lucidePrinter,
      lucideX,
    ]),
  ],
  template: `
    <div class="page" lang="ru">
      @if (contract(); as contract) {
        <header class="header">
          <ave-breadcrumbs [items]="trail" [current]="contract.number" />
          <h1 class="title">Договор {{ contract.number }}</h1>
          <p class="subject">{{ contract.subject }}</p>
        </header>

        <div aveToolbar label="Действия с договором">
          <a aveButton aveToolbarItem variant="ghost" routerLink="/"><ave-icon name="pencil" decorative />Изменить</a>
          <button
            aveButton
            aveToolbarItem
            type="button"
            variant="ghost"
            [disabled]="contract.status !== 'draft'"
            disabledInteractive
            (click)="notify('Договор ' + contract.number + ' отправлен на согласование')"
          >
            Отправить на согласование
          </button>
          <span aveToolbarSeparator></span>
          <button
            aveIconButton
            aveToolbarItem
            type="button"
            variant="ghost"
            icon="copy"
            label="Дублировать"
            aveTooltip="Дублировать"
            (click)="notify('Создан черновик по договору ' + contract.number)"
          ></button>
          <button
            aveIconButton
            aveToolbarItem
            type="button"
            variant="ghost"
            icon="printer"
            label="Печать"
            aveTooltip="Печать"
            (click)="notify('Договор ' + contract.number + ' отправлен на печать')"
          ></button>
          <ave-menu
            label="Ещё действия"
            icon="ellipsis"
            variant="ghost"
            [items]="more"
            (itemSelected)="act(contract, $event)"
          />
        </div>

        <ave-tabs label="Разделы договора" [(selected)]="section">
          <ave-tab value="facts" label="Сведения">
            <dl class="facts">
              <div class="fact">
                <dt>Контрагент</dt>
                <dd class="party">
                  <ave-avatar size="sm" kind="organization" decorative [name]="contract.counterparty" />
                  {{ contract.counterparty }}
                </dd>
              </div>
              <div class="fact">
                <dt>Сумма без НДС</dt>
                <dd class="amount">{{ amount(contract) }}</dd>
              </div>
              <div class="fact">
                <dt>Статус</dt>
                <dd>
                  <ave-badge [variant]="variants[contract.status]">{{ statuses[contract.status] }}</ave-badge>
                </dd>
              </div>
              <div class="fact">
                <dt>Подписан</dt>
                <dd>{{ contract.signedOn === null ? 'Ещё не подписан' : dates.numeric(contract.signedOn) }}</dd>
              </div>
              <div class="fact">
                <dt>Действует до</dt>
                <dd>{{ dates.numeric(contract.endsOn) }}</dd>
              </div>
            </dl>
            <h2 class="section">Условия договора</h2>
            <ave-accordion [level]="3">
              @for (term of terms; track term.heading) {
                <ave-accordion-item [heading]="term.heading">
                  <p>{{ term.text }}</p>
                </ave-accordion-item>
              }
            </ave-accordion>
          </ave-tab>
          <ave-tab value="approval" label="Согласование">
            <p class="note">
              Договор согласуют по порядку, описанному в
              <a aveLink href="https://lex.uz/docs/6134567" target="_blank">регламенте документооборота</a>.
            </p>
            <ave-stepper label="Маршрут согласования" orientation="vertical" [steps]="approval" [current]="1" />
          </ave-tab>
          <ave-tab value="files" label="Файлы" icon="paperclip">
            <div class="files">
              @if (files().length > 0) {
                <ave-list label="Файлы договора">
                  @for (file of files(); track file.name) {
                    <ave-list-item>
                      <ave-icon aveListStart name="file-text" decorative />
                      <span>{{ file.name }}</span>
                      <span class="when">{{ file.size }}</span>
                      <button
                        aveIconButton
                        aveListEnd
                        type="button"
                        variant="ghost"
                        size="sm"
                        icon="x"
                        [label]="'Открепить ' + file.name"
                        [aveTooltip]="'Открепить ' + file.name"
                        (click)="detach(file.name)"
                      ></button>
                    </ave-list-item>
                  }
                </ave-list>
              } @else {
                <p class="note">К договору не прикреплено ни одного файла.</p>
              }
              <button aveButton type="button" (click)="attach()">
                <ave-icon name="paperclip" decorative />Прикрепить акт сверки
              </button>
            </div>
          </ave-tab>
          <ave-tab value="history" label="История">
            <ave-list label="История договора">
              @for (event of history; track event.what) {
                <ave-list-item>
                  <ave-avatar aveListStart size="sm" decorative [name]="event.who" />
                  <span>{{ event.who }}: {{ event.what }}</span>
                  <span aveListEnd class="when">{{ dates.numeric(event.on) }}</span>
                </ave-list-item>
              }
            </ave-list>
          </ave-tab>
        </ave-tabs>
      } @else {
        <header class="header">
          <ave-breadcrumbs [items]="trail" current="Договор не найден" />
        </header>
        <section class="panel" aria-label="Договор">
          <ave-empty-state icon="file-x" heading="Договор не найден">
            <p>В реестре нет договора с таким номером: его удалили или ссылка неверна.</p>
            <div aveEmptyStateActions><a aveButton routerLink="/contracts">Открыть реестр договоров</a></div>
          </ave-empty-state>
        </section>
      }
    </div>
  `,
  styleUrl: './contract.css',
})
export class ContractPage {
  /** The route's `:id`, bound by the router. */
  readonly id = input.required<string>();

  protected readonly contract = computed(() => contractOf(this.id()));

  /** The section the page shows; the facts first. */
  protected readonly section = signal('facts');

  /** Who approves the contract, in order, and where each stands: the legal department agreed, finance has it now. */
  protected readonly approval: readonly AveStep[] = [
    { label: 'Юридический отдел', description: 'Согласовано 18.09.2026' },
    { label: 'Финансовый отдел', description: 'На рассмотрении с 19.09.2026' },
    { label: 'Служба безопасности', description: 'Ожидает' },
    { label: 'Директор', description: 'Подпись' },
  ];

  /** The contract's terms, read one or two at a time. */
  protected readonly terms = [
    {
      heading: 'Штрафы и пени',
      text: 'За каждый день просрочки поставки поставщик платит пеню 0,1% от суммы договора, но не более 10% от неё.',
    },
    {
      heading: 'Форс-мажор',
      text: 'Стороны освобождаются от ответственности за неисполнение обязательств из-за обстоятельств непреодолимой силы, о которых сообщили в течение 5 рабочих дней.',
    },
    {
      heading: 'Порядок расторжения',
      text: 'Договор расторгается по соглашению сторон или в одностороннем порядке с уведомлением за 30 календарных дней.',
    },
  ];

  /** The contract's files. */
  protected readonly files = signal([
    { name: 'Договор поставки.pdf', size: '1,2 МБ' },
    { name: 'Спецификация оборудования.xlsx', size: '86 КБ' },
  ]);

  /** A pretend upload: the next act of reconciliation joins the files. */
  protected attach(): void {
    this.files.update((files) => [...files, { name: `Акт сверки № ${String(files.length + 1)}.pdf`, size: '240 КБ' }]);
  }

  protected detach(name: string): void {
    this.files.update((files) => files.filter((file) => file.name !== name));
  }

  /** What happened to the contract, newest first. */
  protected readonly history = [
    { who: 'Азиза Каримова', what: 'отправила на согласование', on: '2026-09-18' },
    { who: 'Азиза Каримова', what: 'добавила спецификацию', on: '2026-09-17' },
    { who: 'Бахтиёр Рахимов', what: 'создал черновик', on: '2026-09-16' },
  ];
  protected readonly trail: readonly AveBreadcrumb[] = [{ label: 'Договоры', link: '/contracts' }];
  protected readonly statuses = contractStatuses;
  protected readonly variants = contractStatusVariants;
  protected readonly dates = aveDateFormat('ru');
  private readonly sums = aveNumberFormat('ru');

  private readonly toaster = inject(AveToaster);

  /** The actions that do not fit the toolbar. */
  protected readonly more: readonly AveMenuEntry<'pdf' | 'archive'>[] = [
    { value: 'pdf', label: 'Выгрузить в PDF', icon: 'download' },
    { value: 'archive', label: 'Перенести в архив', icon: 'archive' },
  ];

  /** The pretend server did what an action asked; a toast confirms it. */
  protected notify(message: string): void {
    this.toaster.show({ message, variant: 'success' });
  }

  protected act(contract: ContractRecord, action: 'pdf' | 'archive'): void {
    this.notify(
      action === 'pdf' ? `Договор ${contract.number} выгружен в PDF` : `Договор ${contract.number} перенесён в архив`,
    );
  }

  protected amount(contract: ContractRecord): string {
    return `${this.sums.format(contract.amount)} сум`;
  }
}
