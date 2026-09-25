import { InjectionToken, LOCALE_ID, inject, type Provider } from '@angular/core';

/**
 * The words the kit's components show or say themselves (ADR 0047), in the application's locale: uz-Latn, uz-Cyrl,
 * ru or en, chosen by `LOCALE_ID`. Components add their messages here as they arrive.
 *
 * @alpha
 */
export interface AveMessages {
  /** A combobox's list when no option matches what was typed. */
  readonly noResults: string;
  /** The button of a date field that opens its calendar. */
  readonly chooseDate: string;
  /** The calendar's button to the month before. */
  readonly previousMonth: string;
  /** The calendar's button to the month after. */
  readonly nextMonth: string;
  /** The first date of a date range field. */
  readonly rangeStart: string;
  /** The last date of a date range field. */
  readonly rangeEnd: string;
  /** The button of a file upload that takes one file. */
  readonly chooseFile: string;
  /** The button of a file upload that takes several files. */
  readonly chooseFiles: string;
  /** Next to the button: the file can be dropped instead. */
  readonly dropFile: string;
  /** Next to the button: the files can be dropped instead. */
  readonly dropFiles: string;
  /** The name of a file upload's list of files. */
  readonly files: string;
  /** The button that takes a file off the list, with the file's name. */
  readonly removeFile: (name: string) => string;
  /** Why a file was not taken: it is larger than the limit, written as a size ("20 МБ"). */
  readonly fileTooLarge: (limit: string) => string;
  /** Why a file was not taken: its type is not one the field accepts. */
  readonly fileTypeRejected: string;
  /** Why a file was not taken: the field already holds the most files it takes. */
  readonly tooManyFiles: (max: number) => string;
  /** Said to screen readers after files were taken, with their number. */
  readonly filesAdded: (count: number) => string;
  /** Describes a required control that ARIA cannot mark `aria-required`, such as a file upload's button. */
  readonly required: string;
}

/**
 * The kit's messages in English, the fallback for any locale the kit does not know.
 *
 * @alpha
 */
export const aveMessagesEn: AveMessages = {
  noResults: 'No results',
  chooseDate: 'Choose a date',
  previousMonth: 'Previous month',
  nextMonth: 'Next month',
  rangeStart: 'Start date',
  rangeEnd: 'End date',
  chooseFile: 'Choose a file',
  chooseFiles: 'Choose files',
  dropFile: 'or drag it here',
  dropFiles: 'or drag them here',
  files: 'Files',
  removeFile: (name) => `Remove ${name}`,
  fileTooLarge: (limit) => `The file is larger than ${limit}. Choose a smaller file.`,
  fileTypeRejected: 'Files of this type are not accepted.',
  tooManyFiles: (max) => `You can attach at most ${String(max)} ${max === 1 ? 'file' : 'files'}.`,
  filesAdded: (count) => `Files attached: ${String(count)}`,
  required: 'Required',
};

/**
 * The kit's messages in Russian.
 *
 * @alpha
 */
export const aveMessagesRu: AveMessages = {
  noResults: 'Ничего не найдено',
  chooseDate: 'Выбрать дату',
  previousMonth: 'Предыдущий месяц',
  nextMonth: 'Следующий месяц',
  rangeStart: 'Дата начала',
  rangeEnd: 'Дата окончания',
  chooseFile: 'Выбрать файл',
  chooseFiles: 'Выбрать файлы',
  dropFile: 'или перетащите его сюда',
  dropFiles: 'или перетащите их сюда',
  files: 'Файлы',
  removeFile: (name) => `Удалить «${name}»`,
  fileTooLarge: (limit) => `Файл больше ${limit}. Выберите файл поменьше.`,
  fileTypeRejected: 'Файлы этого типа не принимаются.',
  // After "не больше" the noun is genitive: 1, 21 файла; 2, 5, 11 файлов.
  tooManyFiles: (max) =>
    `Можно прикрепить не больше ${String(max)} ${new Intl.PluralRules('ru').select(max) === 'one' ? 'файла' : 'файлов'}.`,
  filesAdded: (count) => `Прикреплено файлов: ${String(count)}`,
  required: 'Обязательное поле',
};

/**
 * The kit's messages in Uzbek, Latin script.
 *
 * @alpha
 */
export const aveMessagesUzLatn: AveMessages = {
  noResults: 'Hech narsa topilmadi',
  chooseDate: 'Sanani tanlash',
  previousMonth: 'Oldingi oy',
  nextMonth: 'Keyingi oy',
  rangeStart: 'Boshlanish sanasi',
  rangeEnd: 'Tugash sanasi',
  chooseFile: 'Faylni tanlash',
  chooseFiles: 'Fayllarni tanlash',
  dropFile: 'yoki uni shu yerga torting',
  dropFiles: 'yoki ularni shu yerga torting',
  files: 'Fayllar',
  removeFile: (name) => `«${name}» faylini olib tashlash`,
  fileTooLarge: (limit) => `Fayl ${limit} dan katta. Kichikroq fayl tanlang.`,
  fileTypeRejected: 'Bu turdagi fayllar qabul qilinmaydi.',
  tooManyFiles: (max) => `Koʻpi bilan ${String(max)} ta fayl biriktirish mumkin.`,
  filesAdded: (count) => `Biriktirilgan fayllar: ${String(count)}`,
  required: 'Majburiy maydon',
};

/**
 * The kit's messages in Uzbek, Cyrillic script.
 *
 * @alpha
 */
export const aveMessagesUzCyrl: AveMessages = {
  noResults: 'Ҳеч нарса топилмади',
  chooseDate: 'Санани танлаш',
  previousMonth: 'Олдинги ой',
  nextMonth: 'Кейинги ой',
  rangeStart: 'Бошланиш санаси',
  rangeEnd: 'Тугаш санаси',
  chooseFile: 'Файлни танлаш',
  chooseFiles: 'Файлларни танлаш',
  dropFile: 'ёки уни шу ерга тортинг',
  dropFiles: 'ёки уларни шу ерга тортинг',
  files: 'Файллар',
  removeFile: (name) => `«${name}» файлини олиб ташлаш`,
  fileTooLarge: (limit) => `Файл ${limit} дан катта. Кичикроқ файл танланг.`,
  fileTypeRejected: 'Бу турдаги файллар қабул қилинмайди.',
  tooManyFiles: (max) => `Кўпи билан ${String(max)} та файл бириктириш мумкин.`,
  filesAdded: (count) => `Бириктирилган файллар: ${String(count)}`,
  required: 'Мажбурий майдон',
};

/**
 * The kit's messages for a locale (a BCP 47 tag): Russian for `ru` and its regions, Uzbek in Cyrillic for
 * `uz-Cyrl`, Uzbek in Latin script for any other `uz`, English otherwise.
 *
 * @alpha
 */
export function aveMessagesFor(locale: string): AveMessages {
  const [language = '', ...subtags] = locale.toLowerCase().split(/[-_]/);
  if (language === 'ru') return aveMessagesRu;
  if (language === 'uz') return subtags.includes('cyrl') ? aveMessagesUzCyrl : aveMessagesUzLatn;
  return aveMessagesEn;
}

/** The messages an application or a part of it replaces, over the kit's messages for its locale. */
const AVE_MESSAGES = new InjectionToken<Partial<AveMessages>>('AVE_MESSAGES');

/**
 * Replaces some of the kit's messages, in the application's, a route's or a component's providers: for a wording of
 * the application's own, or a locale the kit does not ship.
 *
 * ```ts
 * providers: [provideAveMessages({ noResults: 'Контрагент не найден' })]
 * ```
 *
 * @alpha
 */
export function provideAveMessages(messages: Partial<AveMessages>): Provider {
  return { provide: AVE_MESSAGES, useValue: messages };
}

/**
 * The messages for the caller's injector: the kit's for `LOCALE_ID`, with the nearest `provideAveMessages` over
 * them. Call it in an injection context.
 *
 * @alpha
 */
export function injectAveMessages(): AveMessages {
  const own = inject(AVE_MESSAGES, { optional: true }) ?? {};
  return { ...aveMessagesFor(inject(LOCALE_ID)), ...own };
}
