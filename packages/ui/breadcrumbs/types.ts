/**
 * A page above the current one in a breadcrumb trail (ADR 0070): its name, and where it is as Angular's `routerLink`
 * takes it.
 *
 * @alpha
 */
export interface AveBreadcrumb {
  /** The page's name, as its own heading or the navigation says it: "Договоры". */
  readonly label: string;
  /** Where the page is: a path (`'/contracts'`) or the router's commands (`['/contracts', id]`). */
  readonly link: string | readonly unknown[];
}
