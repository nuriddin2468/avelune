// The browser floor of .browserslistrc in MDN browser-compat-data terms, and whether a feature is supported there.
import type { BrowserName, Identifier, SimpleSupportStatement } from '@mdn/browser-compat-data/types';
import browserslist from 'browserslist';

/** browserslist family → browser-compat-data browser. */
const families = {
  chrome: 'chrome',
  edge: 'edge',
  firefox: 'firefox',
  safari: 'safari',
  ios_saf: 'safari_ios',
} as const satisfies Record<string, BrowserName>;

export type FloorBrowser = (typeof families)[keyof typeof families];

function isFamily(name: string): name is keyof typeof families {
  return name in families;
}

/** The oldest version of each browser that `.browserslistrc` in `root` targets. */
export function browserFloor(root: string): ReadonlyMap<FloorBrowser, number> {
  const floor = new Map<FloorBrowser, number>();
  for (const entry of browserslist(undefined, { path: root })) {
    const [family = '', range = ''] = entry.split(' ');
    const version = parseFloat(range);
    if (isFamily(family)) {
      const browser = families[family];
      floor.set(browser, Math.min(floor.get(browser) ?? Infinity, version));
    }
  }
  return floor;
}

/** A version number from browser-compat-data: "118", "≤4", "preview" (never at a floor), false. */
function versionOf(value: SimpleSupportStatement['version_added']): number {
  if (value === false || value === 'preview') {
    return Infinity;
  }
  return parseFloat(value.replace('≤', ''));
}

/** The floor browsers that support a feature fully: unprefixed, unflagged, not partial, not removed. */
export function supportedAt(
  feature: Identifier | undefined,
  floor: ReadonlyMap<FloorBrowser, number>,
): ReadonlySet<FloorBrowser> {
  const support = feature?.__compat?.support ?? {};
  const browsers = new Set<FloorBrowser>();
  for (const [browser, version] of floor) {
    const statements: readonly SimpleSupportStatement[] = [support[browser] ?? []].flat();
    const full = statements.some(
      (statement) =>
        statement.flags === undefined &&
        statement.prefix === undefined &&
        statement.alternative_name === undefined &&
        statement.partial_implementation !== true &&
        statement.version_removed === undefined &&
        versionOf(statement.version_added) <= version,
    );
    if (full) {
      browsers.add(browser);
    }
  }
  return browsers;
}

/** True when the logical form is missing in a floor browser that supports the physical form. */
export function logicalFallsShort(
  physical: Identifier | undefined,
  logical: Identifier | undefined,
  floor: ReadonlyMap<FloorBrowser, number>,
): boolean {
  const logicalSupport = supportedAt(logical, floor);
  return [...supportedAt(physical, floor)].some((browser) => !logicalSupport.has(browser));
}
