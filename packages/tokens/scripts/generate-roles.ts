// The brand generator's data (ADR 0089): brand/roles.ts, compiled from palette.config.ts, the semantic colour files and
// contrast-pairs.json, so the kit's tokens stay the one source of every tenant's theme. Its fingerprint also covers the
// generator's code.
//
//   node scripts/generate-roles.ts            fail when brand/roles.ts is not what the sources compile to
//   node scripts/generate-roles.ts --update   rewrite it (then review the diff: it changes every tenant's theme)
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { format, resolveConfig } from 'prettier';
import type { BrandData, BrandPair, BrandRef, BrandRole } from '../brand/data.ts';
import { paletteConfig } from './palette.config.ts';
import { steps } from './palette.ts';
import { cssVarName } from './token-values.ts';

const packageRoot = join(import.meta.dirname, '..');
const output = join(packageRoot, 'brand', 'roles.ts');
const fingerprintOutput = join(packageRoot, 'brand', 'fingerprint.ts');

type Json = Readonly<Record<string, unknown>>;
const isObject = (value: unknown): value is Json =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function readJson(file: string): unknown {
  return JSON.parse(readFileSync(join(packageRoot, file), 'utf8')) as unknown;
}

/** `{color.orange.600}` → a step, `{color.neutral-alpha.48}` → an alpha series, `{color.white}` → white. */
function refOf(name: string, value: unknown): BrandRef {
  const match = typeof value === 'string' ? /^\{color\.([a-z-]+)(?:\.(\d+))?\}$/.exec(value) : null;
  const [, scale, number] = match ?? [];
  if (scale === 'white' && number === undefined) return 'white';
  if (scale !== undefined && number !== undefined) {
    if (scale in paletteConfig.alpha) return `${scale}.${Number(number)}`;
    if (scale in paletteConfig.scales && (steps as readonly number[]).includes(Number(number))) {
      return `${scale}.${Number(number)}`;
    }
  }
  throw new Error(`roles: ${name} is ${JSON.stringify(value)}, not a reference to a colour primitive`);
}

/** Every colour token of a semantic theme file, by name, with its reference. */
function colourTokens(file: string): Map<string, unknown> {
  const tokens = new Map<string, unknown>();
  const walk = (node: Json, path: readonly string[], type: unknown): void => {
    const own = node['$type'] ?? type;
    if ('$value' in node) {
      if (own === 'color') tokens.set(path.join('.'), node['$value']);
      return;
    }
    for (const [key, child] of Object.entries(node)) {
      if (!key.startsWith('$') && isObject(child)) walk(child, [...path, key], own);
    }
  };
  const root = readJson(file);
  if (!isObject(root)) throw new Error(`roles: ${file} is not a token file`);
  walk(root, [], undefined);
  return tokens;
}

const light = colourTokens('src/semantic.light.tokens.json');
const dark = colourTokens('src/semantic.dark.tokens.json');
const roles: BrandRole[] = [...light].map(([name, value]) => ({
  name,
  cssVar: cssVarName(name.split('.')),
  light: refOf(name, value),
  dark: refOf(name, dark.get(name)),
}));

const family = (role: string): string => {
  const scale = roles.find((candidate) => candidate.name === `color.${role}.bg`)?.light.split('.')[0];
  if (scale === undefined || !(scale in paletteConfig.scales)) throw new Error(`roles: color.${role}.bg is not a step`);
  return scale;
};

const pairsFile = readJson('contrast-pairs.json');
if (!isObject(pairsFile) || !Array.isArray(pairsFile['pairs']) || !Array.isArray(pairsFile['neverText'])) {
  throw new Error('roles: contrast-pairs.json has no pairs or neverText');
}
const strings = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
const pairs = pairsFile['pairs'].filter(isObject).map((pair): BrandPair => ({
  reason: typeof pair['reason'] === 'string' ? pair['reason'] : '',
  minimum: typeof pair['minimum'] === 'number' ? pair['minimum'] : 0,
  foreground: strings(pair['foreground']),
  background: strings(pair['background']),
  ...(pair['over'] === undefined ? {} : { over: strings(pair['over']) }),
}));

const data: Omit<BrandData, 'fingerprint'> = {
  steps: [...steps],
  lightness: paletteConfig.lightness,
  chromaCurve: paletteConfig.chromaCurve,
  scales: paletteConfig.scales,
  brand: paletteConfig.brand,
  families: {
    accent: family('accent'),
    info: family('info'),
    success: family('success'),
    warning: family('warning'),
    danger: family('danger'),
  },
  alpha: Object.fromEntries(
    Object.entries(paletteConfig.alpha).map(([series, { base }]) => [
      series,
      base === 'white' ? ('white' as const) : (`${base.scale}.${base.step}` as const),
    ]),
  ),
  roles,
  pairs,
  neverText: pairsFile['neverText'].filter(isObject).map((entry) => String(entry['token'])),
};
// The data and the generator's own code: a change to either changes what a brand generates, so it invalidates every
// tenant's cached stylesheet.
const code = ['color.ts', 'data.ts', 'generate.ts', 'presets.ts'].map((file) =>
  readFileSync(join(packageRoot, 'brand', file), 'utf8'),
);
const fingerprint = createHash('sha256')
  .update(JSON.stringify([data, code]))
  .digest('hex')
  .slice(0, 12);

const source = `// Generated by packages/tokens/scripts/generate-roles.ts from palette.config.ts, src/semantic.*.tokens.json and
// contrast-pairs.json. Do not edit: change the sources and run \`pnpm nx run tokens:roles --update\` (ADR 0089).
import type { BrandData } from './data.ts';

export const brandData: BrandData = ${JSON.stringify({ fingerprint, ...data })};
`;
const fingerprintSource = `// Generated by packages/tokens/scripts/generate-roles.ts with roles.ts. Do not edit (ADR 0089).

/**
 * The brand generator's fingerprint: a hash of its data and its code. A tenant's cached brand stylesheet is valid while
 * it holds, so a page applies the cache without loading the generator.
 */
export const aveBrandFingerprint = '${fingerprint}';
`;
const prettier = (await resolveConfig(output)) ?? {};
const generated = await format(source, { ...prettier, filepath: output });
const generatedFingerprint = await format(fingerprintSource, { ...prettier, filepath: fingerprintOutput });
const name = relative(process.cwd(), output);

if (process.argv.includes('--update')) {
  writeFileSync(output, generated);
  writeFileSync(fingerprintOutput, generatedFingerprint);
  console.log(`roles: wrote ${name} (${String(roles.length)} colour roles, ${String(pairs.length)} pairs)`);
} else {
  const read = (file: string): string => {
    try {
      return readFileSync(file, 'utf8');
    } catch {
      return '';
    }
  };
  if (read(output) !== generated || read(fingerprintOutput) !== generatedFingerprint) {
    console.error(
      `roles: ${name} is not what the tokens compile to: a semantic colour, a contrast pair, the palette or the generator changed.\n` +
        'Run `pnpm nx run tokens:roles --update` and review the diff: it changes every tenant’s theme (ADR 0089).',
    );
    process.exit(1);
  }
  console.log(`roles: ${name} is up to date`);
}
