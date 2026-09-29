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

/** Where a contract is in its life. */
export type ContractStatus = 'draft' | 'approval' | 'signed' | 'expired';

/** The words for each status. */
export const contractStatuses: Readonly<Record<ContractStatus, string>> = {
  draft: 'Черновик',
  approval: 'На согласовании',
  signed: 'Подписан',
  expired: 'Истёк',
};

/** A contract of the department's register, as the list shows it. */
export interface ContractRecord {
  readonly id: number;
  readonly number: string;
  readonly subject: string;
  readonly counterparty: string;
  /** In sums, without VAT. */
  readonly amount: number;
  readonly status: ContractStatus;
  /** ISO dates. */
  readonly signedOn: string | null;
  readonly endsOn: string;
}

/** What the older contracts of the register were for, in turn. */
const olderSubjects = [
  'Техническое обслуживание лифтов',
  'Поставка канцелярских товаров',
  'Охрана административного здания',
  'Аренда автотранспорта с водителем',
  'Сопровождение программного обеспечения бухгалтерского учёта',
  'Uy-joy fondini taʼmirlash ishlari',
  'Поставка питьевой воды',
  'Обучение сотрудников охране труда',
  'Aloqa xizmatlari koʻrsatish',
  'Вывоз твёрдых бытовых отходов',
] as const;

/**
 * The register's older contracts, ДК-2025/107 down to ДК-2025/80: made up in turn from a few subjects and the known
 * counterparties, so the register is long enough to page.
 */
const olderContracts: readonly ContractRecord[] = Array.from({ length: 28 }, (_, index) => {
  const id = 107 - index;
  const month = String((index % 12) + 1).padStart(2, '0');
  return {
    id,
    number: `ДК-2025/${String(id)}`,
    subject: olderSubjects[index % olderSubjects.length] ?? '',
    counterparty: counterparties[index % counterparties.length]?.label ?? '',
    amount: 12_500_000 * ((index % 9) + 2),
    status: 'signed',
    signedOn: `2025-${month}-10`,
    endsOn: `2027-${month}-28`,
  };
});

/** The department's register of contracts. */
export const contracts: readonly ContractRecord[] = [
  {
    id: 114,
    number: 'ДК-2026/114',
    subject: 'Поставка серверного оборудования для центра обработки данных',
    counterparty: 'ООО «Альфа Технологии»',
    amount: 1_250_000_000,
    status: 'approval',
    signedOn: null,
    endsOn: '2026-12-31',
  },
  {
    id: 113,
    number: 'ДК-2026/113',
    subject: 'Перевозка грузов по железной дороге',
    counterparty: 'Oʻzbekiston temir yoʻllari',
    amount: 480_000_000,
    status: 'signed',
    signedOn: '2026-03-02',
    endsOn: '2027-03-01',
  },
  {
    id: 112,
    number: 'ДК-2026/112',
    subject: 'Аренда складского помещения в Самарканде',
    counterparty: 'ООО «Бета Логистик»',
    amount: 96_000_000,
    status: 'signed',
    signedOn: '2026-02-14',
    endsOn: '2026-03-26',
  },
  {
    id: 111,
    number: 'ДК-2026/111',
    subject: 'Консультационные услуги по внедрению электронного документооборота',
    counterparty: 'ГУП «Центр электронного документооборота»',
    amount: 215_500_000,
    status: 'draft',
    signedOn: null,
    endsOn: '2026-09-30',
  },
  {
    id: 109,
    number: 'ДК-2025/109',
    subject: 'Ремонт кровли административного здания',
    counterparty: 'ООО «Дельта Строй»',
    amount: 312_000_000,
    status: 'expired',
    signedOn: '2025-04-10',
    endsOn: '2025-12-31',
  },
  {
    id: 108,
    number: 'ДК-2025/108',
    subject: 'Sogʻliqni saqlash muassasalari uchun tibbiy jihozlar yetkazib berish',
    counterparty: 'Samarqand viloyati sogʻliqni saqlash boshqarmasi',
    amount: 2_040_000_000,
    status: 'signed',
    signedOn: '2025-11-20',
    endsOn: '2026-11-19',
  },
  ...olderContracts,
];
