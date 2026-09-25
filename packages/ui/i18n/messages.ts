import { InjectionToken, LOCALE_ID, inject, type Provider } from '@angular/core';

/**
 * The words the kit's components show or say themselves (ADR 0047), in the application's locale: uz-Latn, uz-Cyrl,
 * ru or en, chosen by `LOCALE_ID`. Components add their messages here as they arrive.
 *
 * @alpha
 */
export interface AveMessages {
  /** A combobox's list when no option matches what was typed. */
  readonly noResults: string;
}

/**
 * The kit's messages in English, the fallback for any locale the kit does not know.
 *
 * @alpha
 */
export const aveMessagesEn: AveMessages = {
  noResults: 'No results',
};

/**
 * The kit's messages in Russian.
 *
 * @alpha
 */
export const aveMessagesRu: AveMessages = {
  noResults: 'Ничего не найдено',
};

/**
 * The kit's messages in Uzbek, Latin script.
 *
 * @alpha
 */
export const aveMessagesUzLatn: AveMessages = {
  noResults: 'Hech narsa topilmadi',
};

/**
 * The kit's messages in Uzbek, Cyrillic script.
 *
 * @alpha
 */
export const aveMessagesUzCyrl: AveMessages = {
  noResults: 'Ҳеч нарса топилмади',
};

/**
 * The kit's messages for a locale (a BCP 47 tag): Russian for `ru` and its regions, Uzbek in Cyrillic for
 * `uz-Cyrl`, Uzbek in Latin script for any other `uz`, English otherwise.
 *
 * @alpha
 */
export function aveMessagesFor(locale: string): AveMessages {
  const [language = '', ...subtags] = locale.toLowerCase().split(/[-_]/);
  if (language === 'ru') return aveMessagesRu;
  if (language === 'uz') return subtags.includes('cyrl') ? aveMessagesUzCyrl : aveMessagesUzLatn;
  return aveMessagesEn;
}

/** The messages an application or a part of it replaces, over the kit's messages for its locale. */
const AVE_MESSAGES = new InjectionToken<Partial<AveMessages>>('AVE_MESSAGES');

/**
 * Replaces some of the kit's messages, in the application's, a route's or a component's providers: for a wording of
 * the application's own, or a locale the kit does not ship.
 *
 * ```ts
 * providers: [provideAveMessages({ noResults: 'Контрагент не найден' })]
 * ```
 *
 * @alpha
 */
export function provideAveMessages(messages: Partial<AveMessages>): Provider {
  return { provide: AVE_MESSAGES, useValue: messages };
}

/**
 * The messages for the caller's injector: the kit's for `LOCALE_ID`, with the nearest `provideAveMessages` over
 * them. Call it in an injection context.
 *
 * @alpha
 */
export function injectAveMessages(): AveMessages {
  const own = inject(AVE_MESSAGES, { optional: true }) ?? {};
  return { ...aveMessagesFor(inject(LOCALE_ID)), ...own };
}
