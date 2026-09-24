// The browser floor rule of ADR 0014: per browser, .browserslistrc starts at the higher of two floors, the first
// version with every CSS feature Avelune requires (ADR 0005, from MDN browser-compat-data) and Angular's supported
// set (@angular/build's Baseline date). Lower is unsupported; higher needs a new ADR and the product owner.
import bcd from '@mdn/browser-compat-data' with { type: 'json' };
import type { Identifier, SimpleSupportStatement } from '@mdn/browser-compat-data/types';
import browserslist from 'browserslist';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

/** browserslist family → browser-compat-data browser. */
const families = {
  chrome: 'chrome',
  edge: 'edge',
  firefox: 'firefox',
  safari: 'safari',
  ios_saf: 'safari_ios',
} as const;

export type Browser = (typeof families)[keyof typeof families];
export type Floor = ReadonlyMap<Browser, number>;

const browsers = Object.values(families);

/**
 * The features ADR 0005 marks "required", as browser-compat-data paths. Popover is the global attribute the kit uses;
 * iOS Safari before 18.3 implements it without light dismiss (tracked in ROADMAP.md).
 */
export const requiredFeatures = [
  'css.at-rules.starting-style',
  'css.properties.transition-behavior',
  'html.global_attributes.popover',
  'css.types.easing-function.linear-function',
  'css.at-rules.layer',
  'css.at-rules.container',
  'css.types.color.oklch',
] as const;

function isFamily(name: string): name is keyof typeof families {
  return name in families;
}

/** The oldest version of each browser in a browserslist result. */
export function floorOf(entries: readonly string[]): Floor {
  const floor = new Map<Browser, number>();
  for (const entry of entries) {
    const [family = '', range = ''] = entry.split(' ');
    // Ranges such as "17.4-17.7" start at their first version.
    const version = parseFloat(range);
    if (isFamily(family)) floor.set(families[family], Math.min(floor.get(families[family]) ?? Infinity, version));
  }
  return floor;
}

/** The floor that `.browserslistrc` in `root` declares. */
export function configuredFloor(root: string): Floor {
  return floorOf(browserslist(undefined, { path: root }));
}

/** Angular's supported set: Baseline widely available on the date @angular/build pins. */
export function angularFloor(): Floor {
  const require = createRequire(import.meta.url);
  const source = readFileSync(
    join(require.resolve('@angular/build/package.json'), '..', 'src', 'utils', 'supported-browsers.js'),
    'utf8',
  );
  const date = /const BASELINE_DATE = '(\d{4}-\d{2}-\d{2})'/.exec(source)?.[1];
  if (date === undefined) throw new Error('@angular/build no longer pins BASELINE_DATE where this check reads it');
  return floorOf(browserslist(`baseline widely available on ${date}`));
}

/** The first version with full support (unprefixed, unflagged, not partial, not removed), or Infinity. */
function firstFullVersion(feature: Identifier | undefined, browser: Browser): number {
  const statements: readonly SimpleSupportStatement[] = [feature?.__compat?.support[browser] ?? []].flat();
  const versions = statements
    .filter(
      (statement) =>
        statement.flags === undefined &&
        statement.prefix === undefined &&
        statement.alternative_name === undefined &&
        statement.partial_implementation !== true &&
        statement.version_removed === undefined &&
        typeof statement.version_added === 'string' &&
        statement.version_added !== 'preview',
    )
    .map((statement) => parseFloat(String(statement.version_added).replace('≤', '')));
  return Math.min(Infinity, ...versions);
}

/** Per browser, the first version that supports every required feature. */
export function featureFloor(features: readonly string[] = requiredFeatures): Floor {
  const floor = new Map<Browser, number>();
  for (const path of features) {
    const feature = path.split('.').reduce<unknown>((node, key) => Reflect.get(Object(node), key), bcd) as
      Identifier | undefined;
    if (feature?.__compat === undefined) throw new Error(`browser-compat-data has no ${path}`);
    for (const browser of browsers) {
      floor.set(browser, Math.max(floor.get(browser) ?? 0, firstFullVersion(feature, browser)));
    }
  }
  return floor;
}

/** Where the configured floor breaks the rule of ADR 0014. */
export function floorProblems(configured: Floor, features: Floor, angular: Floor): string[] {
  const problems: string[] = [];
  for (const browser of browsers) {
    const version = configured.get(browser);
    const needed = features.get(browser) ?? Infinity;
    const supported = angular.get(browser) ?? Infinity;
    const expected = Math.max(needed, supported);
    if (version === undefined)
      problems.push(`${browser}: missing from .browserslistrc; the floor is ${String(expected)}`);
    else if (version < supported)
      problems.push(`${browser} ${String(version)}: below Angular's supported set (${String(supported)})`);
    else if (version < needed)
      problems.push(`${browser} ${String(version)}: below the required CSS features (${String(needed)})`);
    else if (version > expected) {
      problems.push(
        `${browser} ${String(version)}: above the floor of ADR 0014 (${String(expected)}); raising it needs a new ADR`,
      );
    }
  }
  return problems;
}
