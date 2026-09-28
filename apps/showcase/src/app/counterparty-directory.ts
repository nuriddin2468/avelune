import { Injectable, signal } from '@angular/core';
import type { AveOption } from '@avelune/ui/select';
import { counterparties } from './data';

/** How long the pretend server takes to answer a search. */
const latency = 600;

/** How many counterparties one page holds. */
const pageSize = 20;

/**
 * The directory of counterparties, as a work system's server would serve it: searched by name or tax number, a page
 * at a time, after a network's delay. The showcase pretends; the combobox does not know the difference (ADR 0056).
 */
@Injectable({ providedIn: 'root' })
export class CounterpartyDirectory {
  /** The counterparties of the last search, page after page. */
  readonly options = signal<readonly AveOption<number>[]>([]);
  /** Whether a search or a page is on its way. */
  readonly loading = signal(false);
  /** Whether the last search found more than the pages shown. */
  readonly hasMore = signal(false);

  /** The directory: the showcase's counterparties, with branches, so that a search pages. */
  private readonly all: readonly AveOption<number>[] = [
    ...counterparties,
    ...counterparties.flatMap((counterparty, index) =>
      [1, 2, 3, 4, 5, 6, 7, 8].map((branch) => ({
        ...counterparty,
        value: 1000 + index * 10 + branch,
        label: `${counterparty.label}, филиал №${String(branch)}`,
        meta: `${counterparty.meta ?? ''}-${String(branch)}`,
      })),
    ),
  ];

  private text = '';
  private page = 0;
  private request = 0;

  /** The first page of what matches the text: a name, or a tax number with or without its spaces. */
  search(text: string): void {
    this.text = text;
    this.page = 0;
    this.load(false);
  }

  /** The next page of the last search. */
  more(): void {
    this.page++;
    this.load(true);
  }

  /** The counterparty with this value, for a value saved earlier. */
  find(value: number): AveOption<number> | undefined {
    return this.all.find((counterparty) => counterparty.value === value);
  }

  private load(append: boolean): void {
    const id = ++this.request;
    this.loading.set(true);
    setTimeout(() => {
      // An answer to a search made before the last one is dropped.
      if (id !== this.request) return;
      const wanted = this.text.trim().toLocaleLowerCase().replace(/\s/g, '');
      const matches = this.all.filter(
        (counterparty) =>
          counterparty.label.toLocaleLowerCase().replace(/\s/g, '').includes(wanted) ||
          (counterparty.meta ?? '').replace(/\s/g, '').includes(wanted),
      );
      const page = matches.slice(this.page * pageSize, (this.page + 1) * pageSize);
      this.options.update((shown) => (append ? [...shown, ...page] : page));
      this.hasMore.set(matches.length > (this.page + 1) * pageSize);
      this.loading.set(false);
    }, latency);
  }
}
