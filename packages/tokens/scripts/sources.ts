// The token source manifest (sources.json, ADR 0016): the tier of every file and which files override which.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const tiers = ['primitive', 'semantic', 'component'] as const;

export type Tier = (typeof tiers)[number];

export interface Override {
  /** The file whose tokens this one replaces in its mode. */
  readonly base: string;
  /** `same`: exactly the names of the base (dark theme); `subset`: only names the base has (density, motion). */
  readonly names: 'same' | 'subset';
}

export interface SourceManifest {
  readonly tiers: Readonly<Record<Tier, readonly string[]>>;
  readonly overrides: Readonly<Record<string, Override>>;
}

/** A set of source files resolved together, and the files whose tokens it emits. */
export interface Mode {
  /** `base`, or the override file it applies. */
  readonly id: string;
  readonly sources: readonly string[];
  readonly emits: readonly string[];
}

export function readManifest(packageRoot: string): SourceManifest {
  const manifest: unknown = JSON.parse(readFileSync(join(packageRoot, 'sources.json'), 'utf8'));
  if (!isRecord(manifest) || !isRecord(manifest['tiers']) || !isRecord(manifest['overrides'])) {
    throw new Error('sources.json: expected "tiers" and "overrides" objects');
  }
  const tierFiles = manifest['tiers'];
  const overrides = manifest['overrides'];
  const files = new Set<string>();
  for (const tier of tiers) {
    const list = tierFiles[tier];
    if (!Array.isArray(list) || !list.every((file) => typeof file === 'string')) {
      throw new Error(`sources.json: tier "${tier}" must list files`);
    }
    for (const file of list) {
      if (files.has(file)) throw new Error(`sources.json: ${file} is listed twice`);
      files.add(file);
    }
  }
  for (const [file, override] of Object.entries(overrides)) {
    if (!files.has(file)) throw new Error(`sources.json: override ${file} is not in any tier`);
    if (!isRecord(override) || typeof override['base'] !== 'string' || !files.has(override['base'])) {
      throw new Error(`sources.json: override ${file} needs a "base" that is in a tier`);
    }
    if (override['names'] !== 'same' && override['names'] !== 'subset') {
      throw new Error(`sources.json: override ${file} needs "names": "same" or "subset"`);
    }
  }
  return manifest as unknown as SourceManifest;
}

export function tierOf(manifest: SourceManifest, file: string): Tier {
  const tier = tiers.find((candidate) => manifest.tiers[candidate].includes(file));
  if (tier === undefined) throw new Error(`${file} is not listed in sources.json`);
  return tier;
}

/**
 * The base mode resolves every file that is not an override and emits all of them except primitives. Each override
 * mode resolves the same files with its base replaced by the override, and emits only the override.
 */
export function modes(manifest: SourceManifest): readonly Mode[] {
  const all = tiers.flatMap((tier) => manifest.tiers[tier]);
  const overrideFiles = new Set(Object.keys(manifest.overrides));
  const baseSources = all.filter((file) => !overrideFiles.has(file));
  const base: Mode = {
    id: 'base',
    sources: baseSources,
    emits: baseSources.filter((file) => tierOf(manifest, file) !== 'primitive'),
  };
  const overrideModes = Object.entries(manifest.overrides).map(([file, override]) => ({
    id: file,
    sources: baseSources.map((source) => (source === override.base ? file : source)),
    emits: [file],
  }));
  return [base, ...overrideModes];
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
