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
  /** A list whose options a server is sending (ADR 0056). */
  readonly loading: string;
  /** A list whose options did not come from the server. */
  readonly loadFailed: string;
  /** The button that asks the server for a list's options again. */
  readonly retry: string;
  /** Said to screen readers after a list failed: Enter in its input asks again. */
  readonly retryWithEnter: string;
  /** Said to screen readers once a list has loaded, with the number of its options. */
  readonly optionsFound: (count: number) => string;
  /** The button of a date field that opens its calendar. */
  readonly chooseDate: string;
  /** The calendar's button to the month before. */
  readonly previousMonth: string;
  /** The calendar's button to the month after. */
  readonly nextMonth: string;
  /** The calendar's button to the year before, among the months. */
  readonly previousYear: string;
  /** The calendar's button to the year after, among the months. */
  readonly nextYear: string;
  /** The calendar's button to the twelve years before, among the years. */
  readonly previousYears: string;
  /** The calendar's button to the twelve years after, among the years. */
  readonly nextYears: string;
  /** Describes the calendar's heading among the days: pressing it shows the months. */
  readonly chooseMonth: string;
  /** Describes the calendar's heading among the months: pressing it shows the years. */
  readonly chooseYear: string;
  /** The first date of a date range field. */
  readonly rangeStart: string;
  /** The last date of a date range field. */
  readonly rangeEnd: string;
  /** The name of a date range field's list of presets. */
  readonly rangePresets: string;
  /** A date range preset: today. */
  readonly rangeToday: string;
  /** A date range preset: yesterday. */
  readonly rangeYesterday: string;
  /** A date range preset: this week, from the locale's first day. */
  readonly rangeThisWeek: string;
  /** A date range preset: the week before this one. */
  readonly rangeLastWeek: string;
  /** A date range preset: this month, whole. */
  readonly rangeThisMonth: string;
  /** A date range preset: the month before this one. */
  readonly rangeLastMonth: string;
  /** A date range preset: this quarter, whole. */
  readonly rangeThisQuarter: string;
  /** A date range preset: this year, whole. */
  readonly rangeThisYear: string;
  /** A date range preset: the last 7 days, today among them. */
  readonly rangeLast7Days: string;
  /** A date range preset: the last 30 days, today among them. */
  readonly rangeLast30Days: string;
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
  /** The thumb of a range slider that sets the lower end. */
  readonly lowerValue: string;
  /** The thumb of a range slider that sets the upper end. */
  readonly upperValue: string;
  /** The button that takes a selection field's value away; screen readers hear the field's label after it. */
  readonly clear: string;
  /** The button that closes or dismisses a banner, a dialog or a notification. */
  readonly close: string;
  /** The button of a tag that takes its value away; screen readers hear the tag's words after it. */
  readonly remove: string;
  /** Describes a searchable multiselect's input with the labels of what is chosen, which its tags show (ADR 0081). */
  readonly chosenValues: (labels: string) => string;
  /** Names the icon of a message that informs: an alert, a banner or a notification. */
  readonly alertInfo: string;
  /** Names the icon of a message that confirms a success. */
  readonly alertSuccess: string;
  /** Names the icon of a message that warns. */
  readonly alertWarning: string;
  /** Names the icon of a message that reports an error. */
  readonly alertDanger: string;
  /** The button of a confirmation that keeps things as they are. */
  readonly cancel: string;
  /** The name of the region of the page where notifications (toasts) appear. */
  readonly notifications: string;
  /** The name of a page's breadcrumbs: the path from the top of the product to the page. */
  readonly breadcrumbs: string;
  /** Names the icon after a link that opens a new tab; screen readers hear it with the link's words. */
  readonly opensInNewTab: string;
  /** The name of a list's pagination: the landmark of its pages. */
  readonly pagination: string;
  /** The button of a pagination to the page before. */
  readonly previousPage: string;
  /** The button of a pagination to the page after. */
  readonly nextPage: string;
  /** A page's button in a pagination, with its number written for the locale. */
  readonly page: (page: string) => string;
  /** A narrow pagination's words between its arrows: the current page and how many there are. */
  readonly pageOf: (page: string, count: string) => string;
  /** Which items a page shows, and how many there are in all. */
  readonly itemRange: (from: string, to: string, total: string) => string;
  /** Names a pagination's page-size select, and stands before it. */
  readonly pageSize: string;
  /** The name of a table's pagination, with the table's name, so two tables' landmarks differ (ADR 0087). */
  readonly pagesOf: (list: string) => string;
  /** Said before a row's title by its checkbox in a table: "Выбрать ДК-2026/114". */
  readonly selectRow: string;
  /** The checkbox in a table's header that chooses every row of the page. */
  readonly selectPage: string;
  /** The control that sets a table column's width, with the column's header. */
  readonly columnWidth: (header: string) => string;
  /** A table without rows, when the application gives no empty state of its own. */
  readonly noRecords: string;
  /** A table whose rows did not come from the server. */
  readonly recordsFailed: string;
  /** Names the mark of a step that is done; screen readers hear it with the step's words. */
  readonly stepComplete: string;
  /** Names the mark of a step that needs attention before the steps after it. */
  readonly stepError: string;
  /** The application shell's first link, which moves focus past the bar and the navigation to the page (ADR 0092). */
  readonly skipToContent: string;
  /** Names the product's navigation, and its button and drawer on a phone, when the application gives no name. */
  readonly navigation: string;
  /** A list's filters: the filter panel's heading and its button in a search header (ADR 0094). */
  readonly filters: string;
  /** The button that takes every applied filter away. */
  readonly clearFilters: string;
  /** The button that closes the filters' drawer over the list they narrowed. */
  readonly showResults: string;
  /** Names the list of the filters applied to a list, shown as tags above it. */
  readonly appliedFilters: string;
}

/**
 * The kit's messages in English, the fallback for any locale the kit does not know.
 *
 * @alpha
 */
export const aveMessagesEn: AveMessages = {
  noResults: 'No results',
  loading: 'Loading…',
  loadFailed: 'The list did not load.',
  retry: 'Try again',
  retryWithEnter: 'Press Enter to try again.',
  optionsFound: (count) => `Options: ${String(count)}`,
  chooseDate: 'Choose a date',
  previousMonth: 'Previous month',
  nextMonth: 'Next month',
  previousYear: 'Previous year',
  nextYear: 'Next year',
  previousYears: 'Previous years',
  nextYears: 'Next years',
  chooseMonth: 'Choose a month',
  chooseYear: 'Choose a year',
  rangeStart: 'Start date',
  rangeEnd: 'End date',
  rangePresets: 'Periods',
  rangeToday: 'Today',
  rangeYesterday: 'Yesterday',
  rangeThisWeek: 'This week',
  rangeLastWeek: 'Last week',
  rangeThisMonth: 'This month',
  rangeLastMonth: 'Last month',
  rangeThisQuarter: 'This quarter',
  rangeThisYear: 'This year',
  rangeLast7Days: 'Last 7 days',
  rangeLast30Days: 'Last 30 days',
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
  lowerValue: 'Minimum',
  upperValue: 'Maximum',
  clear: 'Clear',
  close: 'Close',
  remove: 'Remove',
  chosenValues: (labels) => `Chosen: ${labels}`,
  alertInfo: 'Information',
  alertSuccess: 'Success',
  alertWarning: 'Warning',
  alertDanger: 'Error',
  cancel: 'Cancel',
  notifications: 'Notifications',
  breadcrumbs: 'Breadcrumb',
  opensInNewTab: 'opens in a new tab',
  pagination: 'Pagination',
  previousPage: 'Previous page',
  nextPage: 'Next page',
  page: (page) => `Page ${page}`,
  pageOf: (page, count) => `Page ${page} of ${count}`,
  itemRange: (from, to, total) => `${from}–${to} of ${total}`,
  pageSize: 'Per page',
  pagesOf: (list) => `${list}: pages`,
  selectRow: 'Select',
  selectPage: 'Select the rows of the page',
  columnWidth: (header) => `Width of ${header}`,
  noRecords: 'No records',
  recordsFailed: 'The records did not load.',
  stepComplete: 'Done',
  stepError: 'Needs attention',
  skipToContent: 'Skip to content',
  navigation: 'Navigation',
  filters: 'Filters',
  clearFilters: 'Clear filters',
  showResults: 'Show results',
  appliedFilters: 'Applied filters',
};

/**
 * The kit's messages in Russian.
 *
 * @alpha
 */
export const aveMessagesRu: AveMessages = {
  noResults: 'Ничего не найдено',
  loading: 'Загрузка…',
  loadFailed: 'Список не загрузился.',
  retry: 'Повторить',
  retryWithEnter: 'Нажмите Enter, чтобы повторить.',
  optionsFound: (count) => `Найдено вариантов: ${String(count)}`,
  chooseDate: 'Выбрать дату',
  previousMonth: 'Предыдущий месяц',
  nextMonth: 'Следующий месяц',
  previousYear: 'Предыдущий год',
  nextYear: 'Следующий год',
  previousYears: 'Предыдущие годы',
  nextYears: 'Следующие годы',
  chooseMonth: 'Выбрать месяц',
  chooseYear: 'Выбрать год',
  rangeStart: 'Дата начала',
  rangeEnd: 'Дата окончания',
  rangePresets: 'Периоды',
  rangeToday: 'Сегодня',
  rangeYesterday: 'Вчера',
  rangeThisWeek: 'Эта неделя',
  rangeLastWeek: 'Прошлая неделя',
  rangeThisMonth: 'Этот месяц',
  rangeLastMonth: 'Прошлый месяц',
  rangeThisQuarter: 'Этот квартал',
  rangeThisYear: 'Этот год',
  rangeLast7Days: 'Последние 7 дней',
  rangeLast30Days: 'Последние 30 дней',
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
  lowerValue: 'Минимум',
  upperValue: 'Максимум',
  clear: 'Очистить',
  close: 'Закрыть',
  remove: 'Убрать',
  chosenValues: (labels) => `Выбрано: ${labels}`,
  alertInfo: 'Информация',
  alertSuccess: 'Успешно',
  alertWarning: 'Предупреждение',
  alertDanger: 'Ошибка',
  cancel: 'Отмена',
  notifications: 'Уведомления',
  breadcrumbs: 'Навигационная цепочка',
  opensInNewTab: 'откроется в новой вкладке',
  pagination: 'Страницы',
  previousPage: 'Предыдущая страница',
  nextPage: 'Следующая страница',
  page: (page) => `Страница ${page}`,
  pageOf: (page, count) => `Страница ${page} из ${count}`,
  itemRange: (from, to, total) => `${from}–${to} из ${total}`,
  pageSize: 'На странице',
  pagesOf: (list) => `${list}: страницы`,
  selectRow: 'Выбрать',
  selectPage: 'Выбрать строки страницы',
  columnWidth: (header) => `Ширина столбца «${header}»`,
  noRecords: 'Записей нет',
  recordsFailed: 'Записи не загрузились.',
  stepComplete: 'Выполнен',
  stepError: 'Требует внимания',
  skipToContent: 'Перейти к содержимому',
  navigation: 'Навигация',
  filters: 'Фильтры',
  clearFilters: 'Сбросить фильтры',
  showResults: 'Показать результаты',
  appliedFilters: 'Применённые фильтры',
};

/**
 * The kit's messages in Uzbek, Latin script.
 *
 * @alpha
 */
export const aveMessagesUzLatn: AveMessages = {
  noResults: 'Hech narsa topilmadi',
  loading: 'Yuklanmoqda…',
  loadFailed: 'Roʻyxat yuklanmadi.',
  retry: 'Qayta urinish',
  retryWithEnter: 'Qayta urinish uchun Enter tugmasini bosing.',
  optionsFound: (count) => `Topilgan variantlar: ${String(count)}`,
  chooseDate: 'Sanani tanlash',
  previousMonth: 'Oldingi oy',
  nextMonth: 'Keyingi oy',
  previousYear: 'Oldingi yil',
  nextYear: 'Keyingi yil',
  previousYears: 'Oldingi yillar',
  nextYears: 'Keyingi yillar',
  chooseMonth: 'Oyni tanlash',
  chooseYear: 'Yilni tanlash',
  rangeStart: 'Boshlanish sanasi',
  rangeEnd: 'Tugash sanasi',
  rangePresets: 'Davrlar',
  rangeToday: 'Bugun',
  rangeYesterday: 'Kecha',
  rangeThisWeek: 'Shu hafta',
  rangeLastWeek: 'Oʻtgan hafta',
  rangeThisMonth: 'Shu oy',
  rangeLastMonth: 'Oʻtgan oy',
  rangeThisQuarter: 'Shu chorak',
  rangeThisYear: 'Shu yil',
  rangeLast7Days: 'Oxirgi 7 kun',
  rangeLast30Days: 'Oxirgi 30 kun',
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
  lowerValue: 'Eng kam',
  upperValue: 'Eng koʻp',
  clear: 'Tozalash',
  close: 'Yopish',
  remove: 'Olib tashlash',
  chosenValues: (labels) => `Tanlangan: ${labels}`,
  alertInfo: 'Maʼlumot',
  alertSuccess: 'Muvaffaqiyatli',
  alertWarning: 'Ogohlantirish',
  alertDanger: 'Xato',
  cancel: 'Bekor qilish',
  notifications: 'Bildirishnomalar',
  breadcrumbs: 'Navigatsiya zanjiri',
  opensInNewTab: 'yangi varaqda ochiladi',
  pagination: 'Sahifalar',
  previousPage: 'Oldingi sahifa',
  nextPage: 'Keyingi sahifa',
  page: (page) => `${page}-sahifa`,
  pageOf: (page, count) => `${page}-sahifa, jami ${count}`,
  itemRange: (from, to, total) => `${from}–${to}, jami ${total}`,
  pageSize: 'Sahifada',
  pagesOf: (list) => `${list}: sahifalar`,
  selectRow: 'Tanlash',
  selectPage: 'Sahifa qatorlarini tanlash',
  columnWidth: (header) => `«${header}» ustunining kengligi`,
  noRecords: 'Yozuvlar yoʻq',
  recordsFailed: 'Yozuvlar yuklanmadi.',
  stepComplete: 'Bajarildi',
  stepError: 'Eʼtibor talab qiladi',
  skipToContent: 'Asosiy qismga oʻtish',
  navigation: 'Navigatsiya',
  filters: 'Filtrlar',
  clearFilters: 'Filtrlarni tozalash',
  showResults: 'Natijalarni koʻrsatish',
  appliedFilters: 'Qoʻllangan filtrlar',
};

/**
 * The kit's messages in Uzbek, Cyrillic script.
 *
 * @alpha
 */
export const aveMessagesUzCyrl: AveMessages = {
  noResults: 'Ҳеч нарса топилмади',
  loading: 'Юкланмоқда…',
  loadFailed: 'Рўйхат юкланмади.',
  retry: 'Қайта уриниш',
  retryWithEnter: 'Қайта уриниш учун Enter тугмасини босинг.',
  optionsFound: (count) => `Топилган вариантлар: ${String(count)}`,
  chooseDate: 'Санани танлаш',
  previousMonth: 'Олдинги ой',
  nextMonth: 'Кейинги ой',
  previousYear: 'Олдинги йил',
  nextYear: 'Кейинги йил',
  previousYears: 'Олдинги йиллар',
  nextYears: 'Кейинги йиллар',
  chooseMonth: 'Ойни танлаш',
  chooseYear: 'Йилни танлаш',
  rangeStart: 'Бошланиш санаси',
  rangeEnd: 'Тугаш санаси',
  rangePresets: 'Даврлар',
  rangeToday: 'Бугун',
  rangeYesterday: 'Кеча',
  rangeThisWeek: 'Шу ҳафта',
  rangeLastWeek: 'Ўтган ҳафта',
  rangeThisMonth: 'Шу ой',
  rangeLastMonth: 'Ўтган ой',
  rangeThisQuarter: 'Шу чорак',
  rangeThisYear: 'Шу йил',
  rangeLast7Days: 'Охирги 7 кун',
  rangeLast30Days: 'Охирги 30 кун',
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
  lowerValue: 'Энг кам',
  upperValue: 'Энг кўп',
  clear: 'Тозалаш',
  close: 'Ёпиш',
  remove: 'Олиб ташлаш',
  chosenValues: (labels) => `Танланган: ${labels}`,
  alertInfo: 'Маълумот',
  alertSuccess: 'Муваффақиятли',
  alertWarning: 'Огоҳлантириш',
  alertDanger: 'Хато',
  cancel: 'Бекор қилиш',
  notifications: 'Билдиришномалар',
  breadcrumbs: 'Навигация занжири',
  opensInNewTab: 'янги варақда очилади',
  pagination: 'Саҳифалар',
  previousPage: 'Олдинги саҳифа',
  nextPage: 'Кейинги саҳифа',
  page: (page) => `${page}-саҳифа`,
  pageOf: (page, count) => `${page}-саҳифа, жами ${count}`,
  itemRange: (from, to, total) => `${from}–${to}, жами ${total}`,
  pageSize: 'Саҳифада',
  pagesOf: (list) => `${list}: саҳифалар`,
  selectRow: 'Танлаш',
  selectPage: 'Саҳифа қаторларини танлаш',
  columnWidth: (header) => `«${header}» устунининг кенглиги`,
  noRecords: 'Ёзувлар йўқ',
  recordsFailed: 'Ёзувлар юкланмади.',
  stepComplete: 'Бажарилди',
  stepError: 'Эътибор талаб қилади',
  skipToContent: 'Асосий қисмга ўтиш',
  navigation: 'Навигация',
  filters: 'Фильтрлар',
  clearFilters: 'Фильтрларни тозалаш',
  showResults: 'Натижаларни кўрсатиш',
  appliedFilters: 'Қўлланган фильтрлар',
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
