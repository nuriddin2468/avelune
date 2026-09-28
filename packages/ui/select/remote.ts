import {
  DestroyRef,
  ElementRef,
  Injector,
  PLATFORM_ID,
  afterNextRender,
  afterRenderEffect,
  effect,
  inject,
  untracked,
  type OutputEmitterRef,
  type Signal,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { _CdkPrivateStyleLoader, _VisuallyHiddenLoader } from '@angular/cdk/private';
import { injectAveMessages } from '@avelune/ui/i18n';
import { aveDelayedSpinner, aveDurationToken } from '@avelune/ui/theme';

/**
 * Where a combobox's options come from (ADR 0056): `local`, the options given, filtered by label as people type;
 * `server`, the server's answer to the combobox's `query`, shown as given.
 *
 * @alpha
 */
export type AveSearchMode = 'local' | 'server';

/** What a list driven by a server needs from its component. */
export interface RemoteSource {
  /** Where the options come from; `none` for a multiselect without a search. */
  readonly search: Signal<AveSearchMode | 'none'>;
  /** What to search for now: what the input says, or `''` while it shows the chosen label. */
  readonly text: Signal<string>;
  /** Whether the list is open. */
  readonly expanded: Signal<boolean>;
  /** Whether a request is in flight. */
  readonly loading: Signal<boolean>;
  /** Whether the last request failed. */
  readonly error: Signal<boolean>;
  /** Whether the server has more options than the list shows. */
  readonly hasMore: Signal<boolean>;
  /** How many options the list shows. */
  readonly count: Signal<number>;
  /** The element that scrolls the options. */
  readonly list: Signal<HTMLElement | undefined>;
  /** The listbox, which moves the keyboard to an option. */
  readonly listbox: Signal<{ gotoIndex(index: number): void } | undefined>;
  /** Emits the text to search for. */
  readonly query: OutputEmitterRef<string>;
  /** Emits when the list wants its next page. */
  readonly loadMore: OutputEmitterRef<void>;
}

/** What a list driven by a server offers its component's template and handlers. */
export interface RemoteList {
  /** Whether the list shows its spinner: after `timing.spinner-delay` of loading, for `timing.spinner-min-visible`. */
  readonly spinner: Signal<boolean>;
  /** The person typed: the text goes to the server once typing pauses for `timing.search-delay`. */
  typed(): void;
  /** Sends the last request again: the failed search or page. */
  retry(): void;
  /** Asks for the next page, when there is one and nothing is in flight or failed. */
  more(): void;
  /** The list scrolled: within an option of its end, it asks for the next page. */
  scrolled(): void;
}

/** What was last asked of the server. */
type Request = { readonly kind: 'query'; readonly text: string } | { readonly kind: 'more' };

/**
 * The server's side of a combobox's or a searchable multiselect's list (ADR 0056, 0057): the search sent after a
 * pause, the first search when the list opens, the next page at the list's end and on Down from its last option, a
 * retry of what failed, the spinner's timing, and what screen readers hear once the list loads. Call it in the
 * injection context of the component, whose host it listens to.
 */
export function remoteList(source: RemoteSource): RemoteList {
  const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  const browser = isPlatformBrowser(inject(PLATFORM_ID));
  const announcer = inject(LiveAnnouncer);
  const messages = injectAveMessages();
  // CDK's LiveAnnouncer does not load the styles that hide its live element (ADR 0050).
  inject(_CdkPrivateStyleLoader).load(_VisuallyHiddenLoader);
  const injector = inject(Injector);
  const server = () => source.search() === 'server';
  let asked: string | null = null;
  let last: Request | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const cancel = () => {
    clearTimeout(timer);
    timer = undefined;
  };
  inject(DestroyRef).onDestroy(cancel);

  const ask = (request: Request) => {
    cancel();
    last = request;
    if (request.kind === 'query') {
      asked = request.text;
      source.query.emit(request.text);
    } else {
      source.loadMore.emit();
    }
  };
  const more = () => {
    if (server() && source.hasMore() && !source.loading() && !source.error()) ask({ kind: 'more' });
  };

  // The list opens on text not asked for yet: the first search goes at once.
  effect(() => {
    if (!source.expanded() || !server()) return;
    untracked(() => {
      const text = source.text();
      if (asked !== text) ask({ kind: 'query', text });
    });
  });

  // Once a request ends, screen readers hear what came of it.
  let wasLoading = false;
  effect(() => {
    const loading = source.loading();
    const ended = wasLoading && !loading;
    wasLoading = loading;
    if (!ended || !server()) return;
    untracked(() => {
      if (!source.expanded()) return;
      const said = source.error()
        ? `${messages.loadFailed} ${messages.retryWithEnter}`
        : source.count() === 0
          ? messages.noResults
          : messages.optionsFound(source.count());
      void announcer.announce(said, 'polite');
    });
  });

  // Down on the last option, while the server has more, asks for the next page; it is read before Aria's own handler,
  // in the capture phase, while the last option is still the active one. Once the page has come, the keyboard goes
  // on to its first option.
  let pending: number | null = null;
  const down = (event: KeyboardEvent) => {
    if (event.key !== 'ArrowDown' || !source.expanded() || !source.hasMore()) return;
    if (source.list()?.querySelector('.option:last-child')?.getAttribute('data-active') !== 'true') return;
    pending = source.count();
    more();
  };
  host.addEventListener('keydown', down, { capture: true });
  inject(DestroyRef).onDestroy(() => {
    host.removeEventListener('keydown', down, { capture: true });
  });
  afterRenderEffect(() => {
    const count = source.count();
    const loading = source.loading();
    untracked(() => {
      const index = pending;
      if (index === null) return;
      if (count > index) {
        pending = null;
        afterNextRender(() => source.listbox()?.gotoIndex(index), { injector });
      } else if (!loading) {
        pending = null;
      }
    });
  });

  // Options that do not fill the list ask for the next page themselves.
  afterRenderEffect(() => {
    const list = source.list();
    if (list === undefined || !source.expanded() || !source.hasMore() || source.loading() || source.error()) return;
    if (list.scrollHeight <= list.clientHeight) untracked(more);
  });

  return {
    spinner: aveDelayedSpinner(source.loading),
    typed: () => {
      if (!server() || !browser) return;
      cancel();
      timer = setTimeout(
        () => {
          ask({ kind: 'query', text: source.text() });
        },
        aveDurationToken(host, '--ave-timing-search-delay'),
      );
    },
    retry: () => {
      if (last !== null) ask(last);
    },
    more,
    scrolled: () => {
      const list = source.list();
      const option = list?.querySelector<HTMLElement>('[role="option"]');
      if (list === undefined || option === undefined || option === null) return;
      if (list.scrollHeight - list.scrollTop - list.clientHeight <= option.offsetHeight) more();
    },
  };
}
