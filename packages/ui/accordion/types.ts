import { InjectionToken, type Signal } from '@angular/core';

/**
 * The heading level of an accordion's items, the page's next level under the heading above them.
 *
 * @beta
 */
export type AveAccordionLevel = 2 | 3 | 4 | 5 | 6;

/** What an accordion tells its items: the level of their headings. */
export const AVE_ACCORDION = new InjectionToken<{ readonly level: Signal<AveAccordionLevel> }>('AVE_ACCORDION');
