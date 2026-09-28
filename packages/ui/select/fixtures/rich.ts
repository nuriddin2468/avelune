import type { AveOption } from '@avelune/ui/select';

/**
 * Rich options for the stories and specs (ADR 0055): countries with flags, people with avatars, document types with
 * icons, accounts for templates. The images are SVG in data URLs, drawn here, so nothing is fetched. Stories and specs
 * only.
 */

/** An SVG as a data URL. */
function svg(width: number, height: number, body: string): string {
  const markup = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${String(width)} ${String(height)}">${body}</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(markup)}`;
}

/** Horizontal bands of equal height, top first. */
function bands(...colours: readonly string[]): string {
  const height = 12 / colours.length;
  return colours
    .map(
      (colour, index) => `<rect y="${String(index * height)}" width="18" height="${String(height)}" fill="${colour}"/>`,
    )
    .join('');
}

/** Simplified flags, 3:2, the shapes a 20px square shows. */
const flags = {
  uz: svg(
    18,
    12,
    `${bands('#0099b5', '#fff', '#1eb53a')}<rect y="3.8" width="18" height=".4" fill="#ce1126"/><rect y="7.8" width="18" height=".4" fill="#ce1126"/><circle cx="3" cy="2" r="1.3" fill="#fff"/><circle cx="3.5" cy="2" r="1.1" fill="#0099b5"/>`,
  ),
  kz: svg(18, 12, `<rect width="18" height="12" fill="#00afca"/><circle cx="9" cy="5.5" r="2.4" fill="#fec50c"/>`),
  kg: svg(18, 12, `<rect width="18" height="12" fill="#e8112d"/><circle cx="9" cy="6" r="3" fill="#ffef00"/>`),
  tj: svg(18, 12, `${bands('#cc0000', '#fff', '#006600')}<circle cx="9" cy="6" r="1.2" fill="#f8c300"/>`),
  tm: svg(18, 12, `<rect width="18" height="12" fill="#00843d"/><rect x="2.5" width="3" height="12" fill="#d22630"/>`),
  ru: svg(18, 12, bands('#fff', '#0039a6', '#d52b1e')),
  tr: svg(
    18,
    12,
    `<rect width="18" height="12" fill="#e30a17"/><circle cx="6.5" cy="6" r="3" fill="#fff"/><circle cx="7.3" cy="6" r="2.4" fill="#e30a17"/>`,
  ),
  de: svg(18, 12, bands('#000', '#dd0000', '#ffce00')),
  jp: svg(18, 12, `<rect width="18" height="12" fill="#fff"/><circle cx="9" cy="6" r="3.6" fill="#bc002d"/>`),
  gb: svg(
    18,
    12,
    `<rect width="18" height="12" fill="#012169"/><path d="M0 0 18 12M18 0 0 12" stroke="#fff" stroke-width="2.4"/><path d="M9 0v12M0 6h18" stroke="#fff" stroke-width="4"/><path d="M9 0v12M0 6h18" stroke="#c8102e" stroke-width="2.4"/>`,
  ),
} as const;

/** Countries: a flag, the capital on the second line, the code at the end. */
export const countries: readonly AveOption<string>[] = [
  { value: 'uz', label: 'Узбекистан', description: 'Ташкент', meta: 'UZ', image: flags.uz },
  { value: 'kz', label: 'Казахстан', description: 'Астана', meta: 'KZ', image: flags.kz },
  { value: 'kg', label: 'Киргизия', description: 'Бишкек', meta: 'KG', image: flags.kg },
  { value: 'tj', label: 'Таджикистан', description: 'Душанбе', meta: 'TJ', image: flags.tj },
  { value: 'tm', label: 'Туркменистан', description: 'Ашхабад', meta: 'TM', image: flags.tm, disabled: true },
  { value: 'ru', label: 'Россия', description: 'Москва', meta: 'RU', image: flags.ru },
  { value: 'tr', label: 'Турция', description: 'Анкара', meta: 'TR', image: flags.tr },
  { value: 'de', label: 'Германия', description: 'Берлин', meta: 'DE', image: flags.de },
  { value: 'jp', label: 'Япония', description: 'Токио', meta: 'JP', image: flags.jp },
  {
    value: 'gb',
    label: 'Соединённое Королевство Великобритании и Северной Ирландии',
    description: 'Лондон',
    meta: 'GB',
    image: flags.gb,
  },
];

/** The same countries in Uzbek, Latin script. */
export const countriesUz: readonly AveOption<string>[] = [
  { value: 'uz', label: 'Oʻzbekiston Respublikasi', description: 'Toshkent', meta: 'UZ', image: flags.uz },
  { value: 'kz', label: 'Qozogʻiston', description: 'Ostona', meta: 'KZ', image: flags.kz },
  { value: 'kg', label: 'Qirgʻiziston', description: 'Bishkek', meta: 'KG', image: flags.kg },
  { value: 'tj', label: 'Tojikiston', description: 'Dushanbe', meta: 'TJ', image: flags.tj },
];

/** An avatar: initials on a round fill. */
function avatar(initials: string, fill: string): string {
  return svg(
    20,
    20,
    `<circle cx="10" cy="10" r="10" fill="${fill}"/><text x="10" y="13.5" font-family="sans-serif" font-size="9" font-weight="600" text-anchor="middle" fill="#fff">${initials}</text>`,
  );
}

/** People: an avatar, the department on the second line. */
export const employees: readonly AveOption<number>[] = [
  { value: 1, label: 'Каримов Алишер', description: 'Юридический отдел', image: avatar('КА', '#b53700') },
  { value: 2, label: 'Юсупова Дилноза', description: 'Финансовый отдел', image: avatar('ЮД', '#1f6f5c') },
  { value: 3, label: 'Рахимов Бахтиёр', description: 'Служба безопасности', image: avatar('РБ', '#3d4f8a') },
  { value: 4, label: 'Ахмедова Нигора', description: 'Отдел закупок', image: avatar('АН', '#6b4f8a') },
];

/** Document types: an icon, the count of documents at the end. */
export const documentTypes: readonly AveOption<string>[] = [
  { value: 'contract', label: 'Договоры', icon: 'file-text', meta: '128' },
  { value: 'estimate', label: 'Сметы', icon: 'file-spreadsheet', meta: '42' },
  { value: 'scan', label: 'Сканы', icon: 'file-image', meta: '7' },
  { value: 'archive', label: 'Архивы', icon: 'file-archive', meta: '3' },
];

/** A bank account, as a template draws it. */
export interface Account {
  /** The account number, in groups of four. */
  readonly number: string;
  /** The bank that holds it. */
  readonly bank: string;
  /** The balance, as the bank writes it. */
  readonly balance: string;
}

/** Accounts: the value is the account, which the templates draw. */
export const accounts: readonly AveOption<Account>[] = [
  {
    value: { number: '2020 8000 1234 5678 9012', bank: 'Oʻzmilliybank', balance: '125 400 000,00' },
    label: 'Расчётный счёт в Oʻzmilliybank, …9012',
  },
  {
    value: { number: '2020 8000 9876 5432 1098', bank: 'Kapitalbank', balance: '8 250 000,00' },
    label: 'Расчётный счёт в Kapitalbank, …1098',
  },
];
