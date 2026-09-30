import { DOCUMENT, NgTemplateOutlet, isPlatformBrowser } from '@angular/common';
import {
  Component,
  DestroyRef,
  ElementRef,
  PLATFORM_ID,
  afterNextRender,
  computed,
  contentChild,
  inject,
  input,
  model,
  numberAttribute,
  output,
  signal,
} from '@angular/core';
import { AveButton } from '@avelune/ui/button';
import { AveDialogActions, AveDrawer } from '@avelune/ui/dialog';
import { injectAveMessages } from '@avelune/ui/i18n';
import type { AveSearchFilters } from '@avelune/ui/search-header';
import { AveFilterPanelContent } from './content';

let nextPanel = 0;

/**
 * A list's filters (brief §9.4, ADR 0091, 0094): a column at the start of the list from `container.lg`, opened and
 * closed by a search header's button, and a drawer from the start below it. The fields are the application's, on an
 * `ng-template aveFilterPanelContent`, applied as they change; "Сбросить фильтры" shows while any is applied. It keeps
 * `AveSearchFilters`, so `<ave-search-header [filters]="panel">` drives it.
 *
 * ```html
 * <ave-filter-panel #filters [count]="applied().length" (clear)="clearFilters()">
 *   <ng-template aveFilterPanelContent>
 *     <fieldset aveChoiceGroup legend="Статус">…</fieldset>
 *   </ng-template>
 * </ave-filter-panel>
 * ```
 *
 * @alpha
 */
@Component({
  selector: 'ave-filter-panel',
  imports: [AveButton, AveDialogActions, AveDrawer, NgTemplateOutlet],
  host: {
    '[attr.data-mode]': 'mode()',
    '[attr.data-open]': "open() ? '' : null",
  },
  template: `
    @if (mode() === 'drawer') {
      <dialog aveDrawer side="start" size="sm" [heading]="label()" [(open)]="open">
        @if (open()) {
          <div class="fields"><ng-container [ngTemplateOutlet]="content().template" /></div>
        }
        <div aveDialogActions>
          @if (count() > 0) {
            <button aveButton type="button" variant="ghost" (click)="clear.emit()">{{ messages.clearFilters }}</button>
          }
          <button aveButton type="button" variant="primary" (click)="open.set(false)">
            {{ messages.showResults }}
          </button>
        </div>
      </dialog>
    } @else if (mode() === 'column') {
      <section class="column" [id]="id" [attr.aria-labelledby]="headingId" [hidden]="!open()">
        <h2 class="heading" [id]="headingId">{{ label() }}</h2>
        @if (open()) {
          <div class="fields"><ng-container [ngTemplateOutlet]="content().template" /></div>
        }
        @if (count() > 0) {
          <div class="actions">
            <button aveButton type="button" variant="ghost" size="sm" (click)="clear.emit()">
              {{ messages.clearFilters }}
            </button>
          </div>
        }
      </section>
    }
  `,
  styleUrl: './filter-panel.css',
})
export class AveFilterPanel implements AveSearchFilters {
  protected readonly messages = injectAveMessages();

  /** The filters' heading, and the words of the search header's button: the kit's "Фильтры" by default. */
  readonly label = input(this.messages.filters);

  /** How many filters are applied: the search header's button counts them, and the panel offers to clear them. */
  readonly count = input(0, { transform: numberAttribute });

  /** Whether the filters are shown: the column beside the list, or the drawer. Closed by default. */
  readonly open = model(false);

  /** Emits when the person presses "Сбросить фильтры": take every filter away. */
  readonly clear = output();

  /** The id of the column, which the search header's button controls while the filters are a column. */
  readonly id = `ave-filter-panel-${String(nextPanel++)}`;
  protected readonly headingId = `${this.id}-heading`;
  protected readonly content = contentChild.required(AveFilterPanelContent);

  /**
   * A column where the element around the panel reaches `container.lg`, a drawer below it; nothing until the panel
   * has measured it, so a panel open from the start never flashes in the wrong form.
   */
  private readonly mode = signal<'column' | 'drawer' | null>(null);

  /** Whether the filters open in a drawer, below `container.lg`, rather than in a column. */
  readonly modal = computed(() => this.mode() === 'drawer');

  constructor() {
    const document = inject(DOCUMENT);
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const destroyRef = inject(DestroyRef);
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return;
    // The width is the token's, read from the page (ADR 0091); the container is the element the page puts it in.
    afterNextRender(() => {
      const around = host.parentElement;
      const width = Number.parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue('--ave-container-lg'),
      );
      // Without the token's width, the drawer, which fits any page.
      if (Number.isNaN(width) || around === null) {
        this.mode.set('drawer');
        return;
      }
      const measure = (inlineSize: number) => {
        this.mode.set(inlineSize >= width ? 'column' : 'drawer');
      };
      measure(around.getBoundingClientRect().width);
      const sizes = new ResizeObserver((entries) => {
        for (const entry of entries) measure(entry.contentRect.width);
      });
      sizes.observe(around);
      destroyRef.onDestroy(() => {
        sizes.disconnect();
      });
    });
  }

  /** Shows the filters, or hides them: what the search header's button does. */
  toggle(): void {
    this.open.update((open) => !open);
  }
}
