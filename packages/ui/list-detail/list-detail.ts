import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  Component,
  Directive,
  ElementRef,
  Injector,
  PLATFORM_ID,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  model,
  untracked,
  viewChild,
} from '@angular/core';
import { lucideArrowLeft } from '@avelune/icons/lucide';
import { AveButton } from '@avelune/ui/button';
import { injectAveMessages } from '@avelune/ui/i18n';
import { AveIcon, provideAveIcons } from '@avelune/ui/icon';

/**
 * Marks the list of a list–detail page (ADR 0096): a Tree, a List or a DataTable, at the page's start.
 *
 * ```html
 * <ave-tree aveListDetailList label="Подразделения" [nodes]="nodes" [(selected)]="selected" />
 * ```
 *
 * @beta
 */
@Directive({ selector: '[aveListDetailList]' })
export class AveListDetailList {}

/**
 * Marks the record a list–detail page shows beside its list (ADR 0096): a Card, a form, or an EmptyState while none is
 * chosen.
 *
 * ```html
 * <ave-card aveListDetailDetail>…</ave-card>
 * ```
 *
 * @beta
 */
@Directive({ selector: '[aveListDetailDetail]' })
export class AveListDetailDetail {}

/**
 * A list beside the record it opens (brief §9.4, ADR 0091, 0096): the page's heading over the list and the chosen
 * record, side by side from `container.md`. Below it one shows: the list, or, while `detail` is true, the record
 * under a button back to the list. Focus follows the pane that shows.
 *
 * ```html
 * <ave-list-detail heading="Подразделения" [(detail)]="reading">
 *   <ave-tree aveListDetailList label="Подразделения" [nodes]="nodes" [(selected)]="selected" (selectedChange)="reading.set(true)" />
 *   <ave-card aveListDetailDetail>…</ave-card>
 * </ave-list-detail>
 * ```
 *
 * @beta
 */
@Component({
  selector: 'ave-list-detail',
  imports: [AveButton, AveIcon],
  providers: [provideAveIcons([lucideArrowLeft])],
  host: { '[attr.data-view]': "detail() ? 'detail' : 'list'" },
  template: `
    <div class="header">
      <h1 class="heading">{{ heading() }}</h1>
      @if (description(); as description) {
        <p class="description">{{ description }}</p>
      }
    </div>
    <div class="panes">
      <div #list class="list" tabindex="-1" data-focus-ring="inset">
        <ng-content select="[aveListDetailList]" />
      </div>
      <div #record class="detail">
        <button #back aveButton type="button" variant="ghost" (click)="detail.set(false)">
          <ave-icon name="arrow-left" decorative />
          {{ backName() }}
        </button>
        <ng-content select="[aveListDetailDetail]" />
      </div>
    </div>
  `,
  styleUrl: './list-detail.css',
})
export class AveListDetail {
  /** The page's heading, its `h1`: "Подразделения". */
  readonly heading = input.required<string>();

  /** What the page holds, muted under the heading; none by default. */
  readonly description = input('');

  /**
   * Whether the chosen record shows instead of the list, below `container.md`; wider, both show whatever it says. Set
   * it when a record is chosen; the back button sets it to false.
   */
  readonly detail = model(false);

  /** The back button's words: "Все подразделения". The kit's "Назад к списку" by default. */
  readonly backLabel = input<string>();

  private readonly messages = injectAveMessages();
  protected readonly backName = computed(() => this.backLabel() ?? this.messages.backToList);

  private readonly list = viewChild.required<ElementRef<HTMLElement>>('list');
  private readonly record = viewChild.required<ElementRef<HTMLElement>>('record');
  private readonly back = viewChild.required<unknown, ElementRef<HTMLElement>>('back', { read: ElementRef });

  /** The element of the list that had focus when the record showed, for going back. */
  private returnTo: HTMLElement | null = null;

  constructor() {
    const document = inject(DOCUMENT);
    const injector = inject(Injector);
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return;
    const hidden = (element: HTMLElement) => getComputedStyle(element).display === 'none';
    // Below container.md the pane that had focus hides: focus goes to the one that shows (ADR 0096). The element with
    // focus is read before the panes change, since a hidden one loses it.
    let first = true;
    effect(() => {
      const detail = this.detail();
      if (first) {
        first = false;
        return;
      }
      untracked(() => {
        const active = document.activeElement;
        afterNextRender(
          () => {
            const list = this.list().nativeElement;
            if (detail) {
              if (!hidden(list) || !(active instanceof HTMLElement) || !list.contains(active)) return;
              this.returnTo = active;
              this.back().nativeElement.focus();
            } else if (
              hidden(this.record().nativeElement) &&
              // Safari leaves focus on the page when a button is clicked.
              (active === this.back().nativeElement || active === document.body)
            ) {
              (this.returnTo ?? list).focus();
              this.returnTo = null;
            }
          },
          { injector },
        );
      });
    });
  }
}
