// A screen is a route: pages that differ only in the number of the record they show (`/contracts/114`,
// `/contracts/113`) are one screen, drawn by one template, and the suite checks the first it finds (ADR 0027,
// addendum of 2026-09-29).

/** The route of a path: each numeric segment becomes `:n`. */
export function routeOf(path: string): string {
  return path.replace(/\/\d+(?=\/|$)/g, '/:n');
}
