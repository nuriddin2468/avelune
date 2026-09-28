import { signal } from '@angular/core';
import type { AveOption } from '@avelune/ui/select';

/**
 * A pretend server of counterparties for the stories (ADR 0056): 120 of them, searched by name or tax number, twenty
 * a page, after a delay, and failing its first request, or every one, when asked to. Stories and specs only; nothing is fetched.
 */

const names = [
  'Альфа Технологии',
  'Бета Логистик',
  'Гамма Консалтинг',
  'Дельта Строй',
  'Эпсилон Трейд',
  'Oʻzbekiston temir yoʻllari',
  'Toshkent issiqlik manbai',
  'Samarqand invest',
  'Fargʻona tekstil',
  'Навои Цемент',
  'Андижан Агро',
  'Buxoro savdo',
] as const;
const forms = ['ООО', 'АО', 'ЧП', 'MChJ'] as const;
const cities = ['Ташкент', 'Самарканд', 'Бухара', 'Наманган', 'Fargʻona', 'Andijon'] as const;

/** The directory: a name, a city and a tax number each. */
const directory: readonly AveOption<number>[] = Array.from({ length: 120 }, (_, index) => {
  const name = names[index % names.length] ?? '';
  const form = forms[Math.floor(index / names.length) % forms.length] ?? '';
  const tax = String(300_000_000 + index * 7_919).replace(/(\d{3})(?=\d)/g, '$1 ');
  return {
    value: index + 1,
    label: `${form} «${name}» №${String(Math.floor(index / names.length) + 1)}`,
    description: cities[index % cities.length] ?? '',
    meta: tax,
  };
});

/** A page of the directory's matches. */
export interface CounterpartyPage {
  /** The page's counterparties. */
  readonly options: readonly AveOption<number>[];
  /** Whether more pages follow. */
  readonly hasMore: boolean;
}

/** Twenty matches a page, by name or tax number, in any case and with the tax number's spaces or without. */
function search(text: string, page: number): CounterpartyPage {
  const wanted = text.trim().toLocaleLowerCase().replace(/\s/g, '');
  const matches = directory.filter(
    (option) =>
      option.label.toLocaleLowerCase().replace(/\s/g, '').includes(wanted) ||
      (option.meta ?? '').replace(/\s/g, '').includes(wanted),
  );
  return { options: matches.slice(page * 20, page * 20 + 20), hasMore: matches.length > page * 20 + 20 };
}

/**
 * The state a combobox shows for the pretend server, and the handlers of its `query` and `loadMore`: a search starts
 * the list anew, a page adds to it; an answer to a request made before another is dropped.
 */
export function counterpartyServer(options: { readonly latency: number; readonly fails?: 'first' | 'always' }) {
  const shown = signal<readonly AveOption<number>[]>([]);
  const loading = signal(false);
  const failed = signal(false);
  const hasMore = signal(false);
  let text = '';
  let page = 0;
  let request = 0;
  let fails = options.fails === 'always' ? Number.POSITIVE_INFINITY : options.fails === 'first' ? 1 : 0;

  const load = (append: boolean) => {
    const id = ++request;
    loading.set(true);
    failed.set(false);
    setTimeout(() => {
      if (id !== request) return;
      loading.set(false);
      if (fails > 0) {
        fails--;
        failed.set(true);
        if (append) page--;
        return;
      }
      const result = search(text, page);
      shown.update((current) => (append ? [...current, ...result.options] : result.options));
      hasMore.set(result.hasMore);
    }, options.latency);
  };

  return {
    options: shown.asReadonly(),
    loading: loading.asReadonly(),
    failed: failed.asReadonly(),
    hasMore: hasMore.asReadonly(),
    /** The combobox's `query`: the first page of the matches. */
    query(next: string): void {
      text = next;
      page = 0;
      load(false);
    },
    /** The combobox's `loadMore`: the next page. */
    loadMore(): void {
      page++;
      load(true);
    },
  };
}
