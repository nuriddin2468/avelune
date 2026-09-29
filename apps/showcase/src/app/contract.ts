import { Component, computed, inject, input, signal } from '@angular/core';
import type { ResolveFn } from '@angular/router';
import { RouterLink } from '@angular/router';
import {
  lucideArchive,
  lucideCopy,
  lucideDownload,
  lucideEllipsis,
  lucideFileX,
  lucidePaperclip,
  lucidePencil,
  lucidePrinter,
} from '@avelune/icons/lucide';
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
import { aveDateFormat, aveNumberFormat } from '@avelune/ui/i18n';
import { AveIcon, provideAveIcons } from '@avelune/ui/icon';
import { AveMenu, type AveMenuEntry } from '@avelune/ui/menu';
import { contractStatusVariants, contractStatuses, contracts, type ContractRecord } from './data';

/** The contract a route's `:id` names, if the register holds it. */
function contractOf(id: string | undefined): ContractRecord | undefined {
  return contracts.find((contract) => String(contract.id) === id);
}

/** The page's title: the contract's number, or that it was not found. */
export const contractTitle: ResolveFn<string> = (route) => {
  const contract = contractOf(route.paramMap.get('id') ?? undefined);
  return `${contract === undefined ? 'Договор не найден' : `Договор ${contract.number}`} · Avelune`;
};

/**
 * A contract's own page, under the register: where it is in the product, its subject, a toolbar of its actions, and
 * its facts, approval, files and history in tabs. The register links each contract's subject here.
 */
@Component({
  selector: 'ave-showcase-contract',
  imports: [
    AveAvatar,
    AveBadge,
    AveBreadcrumbs,
    AveButton,
    AveEmptyState,
    AveEmptyStateActions,
    AveIcon,
    AveIconButton,
    AveLink,
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
      lucideFileX,
      lucidePaperclip,
      lucidePencil,
      lucidePrinter,
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
          </ave-tab>
          <ave-tab value="approval" label="Согласование">
            <p class="note">
              Договор согласуют по порядку, описанному в
              <a aveLink href="https://lex.uz/docs/6134567" target="_blank">регламенте документооборота</a>.
            </p>
            <ave-stepper label="Маршрут согласования" orientation="vertical" [steps]="approval" [current]="1" />
          </ave-tab>
          <ave-tab value="files" label="Файлы" icon="paperclip">
            <ul class="events">
              @for (file of files; track file.name) {
                <li class="event">
                  <span>{{ file.name }}</span>
                  <span class="when">{{ file.size }}</span>
                </li>
              }
            </ul>
          </ave-tab>
          <ave-tab value="history" label="История">
            <ol class="events">
              @for (event of history; track event.what) {
                <li class="event">
                  <span class="party">
                    <ave-avatar size="sm" decorative [name]="event.who" />
                    <span>{{ event.who }}: {{ event.what }}</span>
                  </span>
                  <span class="when">{{ dates.numeric(event.on) }}</span>
                </li>
              }
            </ol>
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

  /** The contract's files. */
  protected readonly files = [
    { name: 'Договор поставки.pdf', size: '1,2 МБ' },
    { name: 'Спецификация оборудования.xlsx', size: '86 КБ' },
  ];

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
