// The kit version lag of a consumer (ADR 0007, 0105): the installed @avelune/ui against the latest, as the first part
// of the version that differs and by how much. All @avelune packages share one version, so this is one number.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/** How far a consumer's @avelune/ui is behind the latest. */
export interface Lag {
  /** The installed version, or `null` when the repository does not use the kit. */
  readonly installed: string | null;
  readonly latest: string;
  /** The first part of the version that differs; `none` when up to date or ahead. */
  readonly behind: 'major' | 'minor' | 'patch' | 'none' | 'not-installed';
  /** How many versions of that part behind. */
  readonly distance: number;
}

type Triple = readonly [number, number, number];

/** The `x.y.z` of a version or a range, ignoring a pre-release. */
function triple(version: string): Triple | null {
  const match = /(\d+)\.(\d+)\.(\d+)/.exec(version);
  return match === null ? null : [Number(match[1]), Number(match[2]), Number(match[3])];
}

/** A string field of a parsed JSON file, by path. */
function field(json: unknown, path: readonly string[]): string | undefined {
  const value = path.reduce<unknown>(
    (node, key) => (typeof node === 'object' && node !== null ? Reflect.get(node, key) : undefined),
    json,
  );
  return typeof value === 'string' ? value : undefined;
}

/** The @avelune/ui version a repository uses: the installed package's, else its range's lowest version. */
export function installedVersion(root: string): string | null {
  const installed = join(root, 'node_modules', '@avelune', 'ui', 'package.json');
  if (existsSync(installed)) {
    const version = field(JSON.parse(readFileSync(installed, 'utf8')), ['version']);
    if (version !== undefined) return version;
  }
  const manifest = join(root, 'package.json');
  if (!existsSync(manifest)) return null;
  const json: unknown = JSON.parse(readFileSync(manifest, 'utf8'));
  const range =
    field(json, ['dependencies', '@avelune/ui']) ?? field(json, ['devDependencies', '@avelune/ui']) ?? undefined;
  const version = range === undefined ? null : triple(range);
  return version === null ? null : version.join('.');
}

/** The lag of `installed` behind `latest`. */
export function lag(installed: string | null, latest: string): Lag {
  const from = installed === null ? null : triple(installed);
  const to = triple(latest);
  if (to === null) throw new Error(`--latest ${latest} is not a version`);
  if (installed === null || from === null) return { installed, latest, behind: 'not-installed', distance: 0 };
  const parts = ['major', 'minor', 'patch'] as const;
  for (const [index, part] of parts.entries()) {
    const difference = (to[index] ?? 0) - (from[index] ?? 0);
    if (difference !== 0)
      return { installed, latest, behind: difference > 0 ? part : 'none', distance: Math.max(difference, 0) };
  }
  return { installed, latest, behind: 'none', distance: 0 };
}
