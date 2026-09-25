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

/** Counterparties known to the system: a list people search. */
export const counterparties: readonly AveOption<number>[] = [
  { value: 1, label: 'ООО «Альфа Технологии»' },
  { value: 2, label: 'Oʻzbekiston temir yoʻllari' },
  { value: 3, label: 'АО «Узбекнефтегаз»' },
  { value: 4, label: 'ООО «Бета Логистик»' },
  { value: 5, label: 'Toshkent shahar hokimligi' },
  { value: 6, label: 'ГУП «Центр электронного документооборота»' },
  { value: 7, label: 'АО «Узбекистон почтаси»' },
  { value: 8, label: 'Samarqand viloyati sogʻliqni saqlash boshqarmasi' },
  { value: 9, label: 'ООО «Гамма Консалтинг»' },
  { value: 10, label: 'Fargʻona neftni qayta ishlash zavodi' },
  { value: 11, label: 'ИП Каримов А. Б.' },
  { value: 12, label: 'Навоийский горно-металлургический комбинат' },
  { value: 13, label: 'Oʻzbekiston milliy banki' },
  { value: 14, label: 'ООО «Дельта Строй»' },
  { value: 15, label: 'Buxoro viloyati hokimligi' },
  { value: 16, label: 'АО «Узавтосаноат»' },
];

/** Departments that approve contracts. */
export const approvers: readonly AveOption<string>[] = [
  { value: 'legal', label: 'Юридический отдел' },
  { value: 'finance', label: 'Финансовый отдел' },
  { value: 'security', label: 'Служба безопасности' },
  { value: 'procurement', label: 'Отдел закупок' },
];
