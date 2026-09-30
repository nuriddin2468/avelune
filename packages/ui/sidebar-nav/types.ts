import type { AveIconName } from '@avelune/ui/icon';

/**
 * A page of the product's navigation (ADR 0072): its name, where it is, and optionally an icon.
 *
 * @beta
 */
export interface AveSidebarLink {
  /** The page's name, as its heading says it: "Договоры". */
  readonly label: string;
  /** Where the page is, from the root: a path (`'/contracts'`) or the router's commands (`['/contracts']`). */
  readonly link: string | readonly unknown[];
  /** An icon before the words, registered with `provideAveIcons`; decorative. */
  readonly icon?: AveIconName;
  /** Current only on its own page, never on the pages under it: for the home page (`'/'`). */
  readonly exact?: boolean;
  /**
   * How many items wait on the page, drawn as the kit's count at the row's end and read after the page's name
   * ("Входящие 12"); nothing at 0 (ADR 0072, second addendum).
   */
  readonly count?: number;
}

/**
 * A group of pages under one name, which opens and closes (ADR 0072): one level deep.
 *
 * @beta
 */
export interface AveSidebarGroup {
  /** The group's name: "Справочники". Unique among the navigation's groups. */
  readonly label: string;
  /** An icon before the words, registered with `provideAveIcons`; decorative. */
  readonly icon?: AveIconName;
  /** The group's pages, in order. */
  readonly items: readonly AveSidebarLink[];
}

/**
 * A headed part of the navigation (ADR 0072): pages and groups under a heading, such as "Администрирование".
 *
 * @beta
 */
export interface AveSidebarSection {
  /** The heading over the section's pages; it names their list. */
  readonly heading: string;
  /** The section's pages and groups, in order. */
  readonly items: readonly (AveSidebarLink | AveSidebarGroup)[];
}

/**
 * An entry of the navigation: a page, a group of pages, or a headed section.
 *
 * @beta
 */
export type AveSidebarEntry = AveSidebarLink | AveSidebarGroup | AveSidebarSection;
