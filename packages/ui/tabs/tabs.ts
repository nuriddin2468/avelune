import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  afterRenderEffect,
  contentChildren,
  effect,
  inject,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { Tab, TabList, Tabs } from '@angular/aria/tabs';
import { AveIcon } from '@avelune/ui/icon';
import { AveTab } from './tab';

/** Where the indicator stands: its offset from the list's left edge, and its share of the list's width. */
interface IndicatorBox {
  readonly offset: number;
  readonly scale: number;
}

/** The chosen tab's measure: where the indicator goes, and how far the list scrolls to show the whole tab. */
interface Measure {
  readonly indicator: IndicatorBox;
  readonly scrollBy: number;
}

/**
 * The kit's tabs (brief §9.4, ADR 0071): a list of tabs over the panel of the chosen one, on Angular Aria's tabs (the
 * WAI-ARIA tabs pattern). Each `<ave-tab>` is a tab and its panel; the kit draws the list from them. The tab that has
 * focus is chosen, the arrows move between tabs, and a bar under the chosen tab slides to the next one.
 *
 * ```html
 * <ave-tabs label="Разделы договора" [(selected)]="section">
 *   <ave-tab value="facts" label="Сведения">…</ave-tab>
 *   <ave-tab value="files" label="Файлы">…</ave-tab>
 * </ave-tabs>
 * ```
 *
 * @alpha
 */
@Component({
  selector: 'ave-tabs',
  imports: [AveIcon, Tab, TabList],
  hostDirectives: [Tabs],
  host: {
    // Once the person uses the tabs, by pointer or keyboard, the indicator slides.
    '(pointerdown)': 'slide.set(true)',
    '(keydown)': 'slide.set(true)',
    '[style.--ave-tabs-indicator-offset.px]': 'indicatorOffset()',
    '[style.--ave-tabs-indicator-scale]': 'indicatorScale()',
  },
  template: `
    <div class="bar">
      <div
        #list
        ngTabList
        class="list"
        [attr.aria-label]="label()"
        [attr.data-slide]="slide() ? '' : null"
        [(selectedTab)]="selected"
      >
        @for (tab of tabs(); track tab) {
          <button
            ngTab
            type="button"
            class="tab"
            data-focus-ring="inset"
            [value]="tab.value()"
            [disabled]="tab.disabled()"
          >
            @if (tab.icon(); as name) {
              <ave-icon [name]="name" decorative />
            }
            <span class="label">{{ tab.label() }}</span>
          </button>
        }
        <span class="indicator"></span>
      </div>
    </div>
    <ng-content />
  `,
  styleUrl: './tabs.css',
})
export class AveTabs {
  /** Names the list of tabs for assistive technology: what the tabs divide ("Разделы договора"). */
  readonly label = input.required<string>();

  /** The `value` of the chosen tab; the first enabled tab while it names none. */
  readonly selected = model<string>();

  /** The tabs, in order. */
  protected readonly tabs = contentChildren(AveTab);

  /** Whether the indicator slides: only once the person has used the tabs, never as the page opens. */
  protected readonly slide = signal(false);

  /** The indicator's offset from the list's left edge, in pixels; measured from the chosen tab. */
  protected readonly indicatorOffset = signal(0);

  /** The indicator's share of the list's width; 0, so no bar, until the chosen tab has been measured. */
  protected readonly indicatorScale = signal(0);

  private readonly list = viewChild.required<ElementRef<HTMLElement>>('list');

  /** Bumped when the list or a tab changes size, so the indicator is measured again. */
  private readonly resized = signal(0);

  constructor() {
    effect(() => {
      const tabs = this.tabs();
      const value = this.selected();
      if (tabs.some((tab) => tab.value() === value)) return;
      this.selected.set(tabs.find((tab) => !tab.disabled())?.value());
    });

    afterRenderEffect({
      earlyRead: () => {
        this.selected();
        this.tabs();
        this.resized();
        return this.measure();
      },
      write: (measure) => {
        const { indicator, scrollBy } = measure();
        this.indicatorOffset.set(indicator.offset);
        this.indicatorScale.set(indicator.scale);
        // Focus shows a tab that is only partly outside the list; the list scrolls to show all of it.
        if (scrollBy !== 0) this.list().nativeElement.scrollLeft += scrollBy;
      },
    });

    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const observer = new ResizeObserver(() => {
        this.resized.update((count) => count + 1);
      });
      const list = this.list().nativeElement;
      // A tab's words can change width without the list's (a web font arriving), and tabs come and go.
      const observeTabs = (): void => {
        observer.observe(list);
        for (const tab of list.querySelectorAll('[role="tab"]')) observer.observe(tab);
      };
      const tabsChanged = new MutationObserver(observeTabs);
      tabsChanged.observe(list, { childList: true });
      observeTabs();
      destroyRef.onDestroy(() => {
        observer.disconnect();
        tabsChanged.disconnect();
      });
    });
  }

  /** The chosen tab's box in the list: the indicator's offset and share of the list's width, and the scroll to it. */
  private measure(): Measure {
    const list = this.list().nativeElement;
    const tab = list.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');
    if (tab === null || list.clientWidth === 0) return { indicator: { offset: 0, scale: 0 }, scrollBy: 0 };
    // From the boxes, not offsetLeft and offsetWidth, which round to whole pixels. The list's content starts inside
    // its border, and may be scrolled.
    const box = tab.getBoundingClientRect();
    const start = list.getBoundingClientRect().left + list.clientLeft;
    const end = start + list.clientWidth;
    let scrollBy = 0;
    if (box.right > end) scrollBy = box.right - end;
    if (box.left - scrollBy < start) scrollBy = box.left - start;
    return {
      indicator: { offset: box.left - start + list.scrollLeft, scale: box.width / list.clientWidth },
      scrollBy: Math.round(scrollBy),
    };
  }
}
