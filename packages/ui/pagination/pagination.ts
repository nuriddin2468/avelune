import {
  Component,
  ElementRef,
  Injector,
  LOCALE_ID,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  model,
  numberAttribute,
} from '@angular/core';
import { lucideChevronLeft, lucideChevronRight } from '@avelune/icons/lucide';
import { AveIconButton } from '@avelune/ui/button';
import { aveNumberFormat, injectAveMessages } from '@avelune/ui/i18n';
import { provideAveIcons } from '@avelune/ui/icon';
import { AveTooltip } from '@avelune/ui/tooltip';

/** The places for page numbers when there are more pages than fit (ADR 0074). */
const places = 7;

/**
 * The pages to show in seven places for the current page of `count`: the first, the last, the current and its
 * neighbours, and `0` for each gap between them. Fewer pages show them all.
 */
function pagesToShow(current: number, count: number): number[] {
  if (count <= places) return Array.from({ length: count }, (_, index) => index + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, 0, count];
  if (current >= count - 3) return [1, 0, count - 4, count - 3, count - 2, count - 1, count];
  return [1, 0, current - 1, current, current + 1, 0, count];
}

/**
 * The kit's pagination (brief §9.4, ADR 0074): the pages of a list as a named navigation landmark, with the items the
 * page shows, the previous and next pages, and the page numbers in seven places, the current one on the accent fill.
 * In a narrow container the numbers give way to "Страница 3 из 12". `page` is 1-based; the list pages in place, and
 * the application writes the page into its address if it wants to.
 *
 * ```html
 * <ave-pagination [total]="134" [pageSize]="20" [(page)]="page" />
 * ```
 *
 * @alpha
 */
@Component({
  selector: 'ave-pagination',
  imports: [AveIconButton, AveTooltip],
  providers: [provideAveIcons([lucideChevronLeft, lucideChevronRight])],
  template: `
    @if (total() > 0) {
      <nav class="pagination" [attr.aria-label]="messages.pagination">
        <p class="range" role="status">{{ range() }}</p>
        <div class="pages">
          <button
            aveIconButton
            type="button"
            variant="ghost"
            icon="chevron-left"
            [label]="messages.previousPage"
            [aveTooltip]="messages.previousPage"
            [disabled]="current() <= 1"
            disabledInteractive
            (click)="go(current() - 1)"
          ></button>
          <ol class="numbers">
            @for (place of shown(); track $index) {
              <li [attr.aria-hidden]="place === 0 ? 'true' : null">
                @if (place === 0) {
                  <span class="gap">…</span>
                } @else {
                  <button
                    type="button"
                    class="page"
                    [attr.aria-current]="place === current() ? 'page' : null"
                    [attr.aria-label]="messages.page(format(place))"
                    (click)="go(place, true)"
                  >
                    {{ format(place) }}
                  </button>
                }
              </li>
            }
          </ol>
          <span class="compact">{{ messages.pageOf(format(current()), format(pageCount())) }}</span>
          <button
            aveIconButton
            type="button"
            variant="ghost"
            icon="chevron-right"
            [label]="messages.nextPage"
            [aveTooltip]="messages.nextPage"
            [disabled]="current() >= pageCount()"
            disabledInteractive
            (click)="go(current() + 1)"
          ></button>
        </div>
      </nav>
    }
  `,
  styleUrl: './pagination.css',
})
export class AvePagination {
  /** How many items the list holds in all; nothing is drawn while it holds none. */
  readonly total = input.required({ transform: numberAttribute });

  /** The page shown, from 1; kept within the pages. */
  readonly page = model(1);

  /** How many items a page shows. */
  readonly pageSize = input(20, { transform: numberAttribute });

  protected readonly messages = injectAveMessages();
  private readonly numbers = aveNumberFormat(inject(LOCALE_ID));
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly injector = inject(Injector);

  /** How many pages there are: at least one. */
  protected readonly pageCount = computed(() => Math.max(1, Math.ceil(this.total() / Math.max(1, this.pageSize()))));

  /** The page shown, within the pages. */
  protected readonly current = computed(() => Math.min(Math.max(1, Math.trunc(this.page())), this.pageCount()));

  /** The numbers in their places, `0` for a gap. */
  protected readonly shown = computed(() => pagesToShow(this.current(), this.pageCount()));

  /** Which items the page shows, of how many. */
  protected readonly range = computed(() => {
    const size = Math.max(1, this.pageSize());
    const from = (this.current() - 1) * size + 1;
    const to = Math.min(this.current() * size, this.total());
    return this.messages.itemRange(this.format(from), this.format(to), this.format(this.total()));
  });

  constructor() {
    // A page beyond the last (after a filter, a new page size) becomes the last.
    effect(() => {
      const current = this.current();
      if (this.page() !== current) this.page.set(current);
    });
  }

  /** A number written for the locale. */
  protected format(value: number): string {
    return this.numbers.format(value);
  }

  /** Shows a page; after a page's own button, focus goes to the current page's button. */
  protected go(page: number, fromNumber = false): void {
    const next = Math.min(Math.max(1, page), this.pageCount());
    if (next === this.current()) return;
    this.page.set(next);
    if (!fromNumber) return;
    afterNextRender(
      () => {
        this.host.querySelector<HTMLElement>('.page[aria-current="page"]')?.focus();
      },
      { injector: this.injector },
    );
  }
}
