import type { AveOption } from '@avelune/ui/select';

/** The showcase's reference data: what a work system would load from its server. */

/** Kinds of contract. */
export const contractKinds: readonly AveOption<string>[] = [
  { value: 'supply', label: 'Поставка' },
  { value: 'services', label: 'Оказание услуг' },
  { value: 'works', label: 'Подряд' },
  { value: 'lease', label: 'Аренда' },
  { value: 'agency', label: 'Агентский договор' },
  { value: 'license', label: 'Лицензионный договор' },
  { value: 'nda', label: 'Соглашение о конфиденциальности' },
];

/** Counterparties known to the system: a list people search, with their city and tax number (ИНН). */
export const counterparties: readonly AveOption<number>[] = [
  { value: 1, label: 'ООО «Альфа Технологии»', description: 'Ташкент', meta: '305 112 845' },
  { value: 2, label: 'Oʻzbekiston temir yoʻllari', description: 'Toshkent', meta: '201 052 519' },
  { value: 3, label: 'АО «Узбекнефтегаз»', description: 'Ташкент', meta: '200 504 611' },
  { value: 4, label: 'ООО «Бета Логистик»', description: 'Самарканд', meta: '306 745 210' },
  { value: 5, label: 'Toshkent shahar hokimligi', description: 'Toshkent', meta: '201 122 347' },
  { value: 6, label: 'ГУП «Центр электронного документооборота»', description: 'Ташкент', meta: '207 004 118' },
  { value: 7, label: 'АО «Узбекистон почтаси»', description: 'Ташкент', meta: '200 836 012' },
  {
    value: 8,
    label: 'Samarqand viloyati sogʻliqni saqlash boshqarmasi',
    description: 'Samarqand',
    meta: '201 945 330',
  },
  { value: 9, label: 'ООО «Гамма Консалтинг»', description: 'Бухара', meta: '307 218 904' },
  { value: 10, label: 'Fargʻona neftni qayta ishlash zavodi', description: 'Fargʻona', meta: '200 611 725' },
  { value: 11, label: 'ИП Каримов А. Б.', description: 'Наманган', meta: '489 120 336' },
  { value: 12, label: 'Навоийский горно-металлургический комбинат', description: 'Навои', meta: '200 122 893' },
  { value: 13, label: 'Oʻzbekiston milliy banki', description: 'Toshkent', meta: '200 836 354' },
  { value: 14, label: 'ООО «Дельта Строй»', description: 'Андижан', meta: '308 004 561' },
  { value: 15, label: 'Buxoro viloyati hokimligi', description: 'Buxoro', meta: '201 330 118' },
  { value: 16, label: 'АО «Узавтосаноат»', description: 'Ташкент', meta: '200 467 903' },
];

/** Departments that approve contracts. */
export const approvers: readonly AveOption<string>[] = [
  { value: 'legal', label: 'Юридический отдел' },
  { value: 'finance', label: 'Финансовый отдел' },
  { value: 'security', label: 'Служба безопасности' },
  { value: 'procurement', label: 'Отдел закупок' },
];

/** The regions a contract delivers to: a long list, searched (ADR 0057). */
export const regions: readonly AveOption<string>[] = [
  { value: 'karakalpakstan', label: 'Республика Каракалпакстан' },
  { value: 'andijan', label: 'Андижанская область' },
  { value: 'bukhara', label: 'Бухарская область' },
  { value: 'jizzakh', label: 'Джизакская область' },
  { value: 'kashkadarya', label: 'Кашкадарьинская область' },
  { value: 'navoi', label: 'Навоийская область' },
  { value: 'namangan', label: 'Наманганская область' },
  { value: 'samarkand', label: 'Самаркандская область' },
  { value: 'surkhandarya', label: 'Сурхандарьинская область' },
  { value: 'syrdarya', label: 'Сырдарьинская область' },
  { value: 'tashkent-region', label: 'Ташкентская область' },
  { value: 'fergana', label: 'Ферганская область' },
  { value: 'khorezm', label: 'Хорезмская область' },
  { value: 'tashkent', label: 'город Ташкент' },
];
