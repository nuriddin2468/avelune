import { Component, inject, signal } from '@angular/core';
import {
  lucideEraser,
  lucideFileDown,
  lucidePrinter,
  lucideRedo2,
  lucideSave,
  lucideUndo2,
} from '@avelune/icons/lucide';
import { AveBreadcrumbs, type AveBreadcrumb } from '@avelune/ui/breadcrumbs';
import { AveButton, AveIconButton } from '@avelune/ui/button';
import { AveFormField, AveHint } from '@avelune/ui/form-field';
import { provideAveIcons } from '@avelune/ui/icon';
import { AveMenu, AveMenubar, type AveMenuEntry, type AveMenubarMenu } from '@avelune/ui/menu';
import { AveTextarea } from '@avelune/ui/textarea';
import { AveToaster } from '@avelune/ui/toast';
import { AveToolbar, AveToolbarItem, AveToolbarSeparator } from '@avelune/ui/toolbar';
import { AveTooltip } from '@avelune/ui/tooltip';

/** What the editor's menus and toolbar do. */
type Command = 'save' | 'export' | 'print' | 'undo' | 'redo' | 'clear' | 'counterparty' | 'amount' | 'date' | 'check';

/** The fields a template may hold, as they appear in its text. */
const fields: Readonly<Record<'counterparty' | 'amount' | 'date', string>> = {
  counterparty: '{{Контрагент}}',
  amount: '{{Сумма договора}}',
  date: '{{Дата подписания}}',
};

/**
 * A contract template's editor: an application's window with a menubar of its commands, a toolbar of the most used
 * ones, and the template's text. The commands run on a pretend server and are confirmed by toasts; inserting a field
 * adds it to the end of the text.
 */
@Component({
  selector: 'ave-showcase-template-editor',
  imports: [
    AveBreadcrumbs,
    AveButton,
    AveFormField,
    AveHint,
    AveIconButton,
    AveMenu,
    AveMenubar,
    AveTextarea,
    AveToolbar,
    AveToolbarItem,
    AveToolbarSeparator,
    AveTooltip,
  ],
  providers: [provideAveIcons([lucideEraser, lucideFileDown, lucidePrinter, lucideRedo2, lucideSave, lucideUndo2])],
  template: `
    <div class="page" lang="ru">
      <header class="header">
        <ave-breadcrumbs [items]="trail" current="Шаблон договора поставки" />
        <h1 class="title">Шаблон договора поставки</h1>
      </header>

      <section class="editor" aria-label="Редактор шаблона">
        <ave-menubar label="Шаблон договора" [menus]="menus" (itemSelected)="run($event)" />
        <div aveToolbar label="Правка шаблона" class="tools">
          <button
            aveIconButton
            aveToolbarItem
            type="button"
            variant="ghost"
            icon="undo-2"
            label="Отменить"
            aveTooltip="Отменить"
            [disabled]="history().length === 0"
            disabledInteractive
            (click)="run('undo')"
          ></button>
          <button
            aveIconButton
            aveToolbarItem
            type="button"
            variant="ghost"
            icon="redo-2"
            label="Повторить"
            aveTooltip="Повторить"
            disabled
            disabledInteractive
          ></button>
          <span aveToolbarSeparator></span>
          <ave-menu label="Вставить поле" variant="ghost" [items]="insertions" (itemSelected)="run($event)" />
          <span aveToolbarSeparator></span>
          <button aveButton aveToolbarItem type="button" variant="ghost" (click)="run('check')">
            Проверить шаблон
          </button>
        </div>
        <ave-form-field label="Текст шаблона">
          <textarea aveTextarea rows="10" [value]="text()" (input)="typed($event)"></textarea>
          <p aveHint>Поля в двойных фигурных скобках заполнятся из карточки договора.</p>
        </ave-form-field>
      </section>
    </div>
  `,
  styleUrl: './template-editor.css',
})
export class TemplateEditor {
  private readonly toaster = inject(AveToaster);

  protected readonly trail: readonly AveBreadcrumb[] = [{ label: 'Договоры', link: '/contracts' }];

  protected readonly menus: readonly AveMenubarMenu<Command>[] = [
    {
      label: 'Файл',
      items: [
        { value: 'save', label: 'Сохранить', icon: 'save' },
        { value: 'export', label: 'Выгрузить в PDF', icon: 'file-down' },
        { value: 'print', label: 'Печать', icon: 'printer' },
      ],
    },
    {
      label: 'Правка',
      items: [
        { value: 'undo', label: 'Отменить', icon: 'undo-2' },
        { value: 'redo', label: 'Повторить', icon: 'redo-2', disabled: true },
        { separator: true },
        { value: 'clear', label: 'Очистить текст', icon: 'eraser', danger: true },
      ],
    },
    {
      label: 'Вставка',
      items: [
        { value: 'counterparty', label: 'Поле контрагента' },
        { value: 'amount', label: 'Поле суммы' },
        { value: 'date', label: 'Дата подписания' },
      ],
    },
  ];

  /** The fields the toolbar's menu inserts. */
  protected readonly insertions: readonly AveMenuEntry<Command>[] = [
    { value: 'counterparty', label: 'Контрагент' },
    { value: 'amount', label: 'Сумма договора' },
    { value: 'date', label: 'Дата подписания' },
  ];

  protected readonly text = signal(
    'Поставщик {{Контрагент}} обязуется передать в собственность Покупателя серверное оборудование, а Покупатель ' +
      'обязуется принять его и оплатить {{Сумма договора}} в течение 30 дней с даты подписания акта.',
  );

  /** The texts before each change, for undo. */
  protected readonly history = signal<readonly string[]>([]);

  protected typed(event: Event): void {
    if (event.target instanceof HTMLTextAreaElement) this.change(event.target.value);
  }

  /** Runs a command of the menus or the toolbar. */
  protected run(command: Command): void {
    if (command === 'counterparty' || command === 'amount' || command === 'date') {
      this.change(`${this.text()} ${fields[command]}`);
      return;
    }
    if (command === 'clear') {
      this.change('');
      return;
    }
    if (command === 'undo') {
      const previous = this.history().at(-1);
      if (previous === undefined) return;
      this.history.set(this.history().slice(0, -1));
      this.text.set(previous);
      return;
    }
    const done: Record<Exclude<Command, 'counterparty' | 'amount' | 'date' | 'undo' | 'clear'>, string> = {
      save: 'Шаблон сохранён',
      export: 'Шаблон выгружен в PDF',
      print: 'Шаблон отправлен на печать',
      redo: 'Нечего повторять',
      check: 'Ошибок в шаблоне нет',
    };
    this.toaster.show({ message: done[command], variant: 'success' });
  }

  private change(next: string): void {
    this.history.set([...this.history(), this.text()]);
    this.text.set(next);
  }
}
