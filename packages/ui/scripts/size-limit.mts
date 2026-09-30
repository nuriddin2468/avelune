// Size budgets (brief §5.4, ADR 0028): one size-limit check per entry point, with the limit its entry.json declares.
// A check measures the entry point's FESM bundle from the library build, bundled and minified by esbuild (the bundler
// of Angular's application builder) and compressed with brotli. Angular and the other peers are left out, and so are
// the other @avelune/ui entry points and @avelune/tokens/brand, the brand generator that @avelune/ui/theme loads lazily
// (ADR 0089): each carries its own budget.
//
//   size-limit --config scripts/size-limit.mts       (the ui:size target, after ui:build-lib)
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

/** A budget as size-limit reads it: a number and B or kB (1 kB = 1000 B). */
const limitPattern = /^\d+(\.\d+)? k?B$/;

export interface EntryBudget {
  /** The entry point's folder, the part after @avelune/ui/. */
  readonly name: string;
  /** Its size limit, brotli-compressed. */
  readonly limit: string;
}

/** Every entry point of the library in `uiRoot` (a folder with entry.json) and its declared budget. */
export function entryBudgets(uiRoot: string): EntryBudget[] {
  return readdirSync(uiRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(join(uiRoot, entry.name, 'entry.json')))
    .map((entry) => {
      const manifest: unknown = JSON.parse(readFileSync(join(uiRoot, entry.name, 'entry.json'), 'utf8'));
      const limit: unknown =
        typeof manifest === 'object' && manifest !== null ? Reflect.get(manifest, 'sizeLimit') : null;
      if (typeof limit !== 'string' || !limitPattern.test(limit)) {
        throw new Error(`${entry.name}/entry.json must declare "sizeLimit" as a number and B or kB, like "1.2 kB"`);
      }
      return { name: entry.name, limit };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export interface SizeCheck {
  readonly name: string;
  readonly path: string;
  readonly limit: string;
  readonly ignore: readonly string[];
}

/**
 * The size-limit checks for the library in `uiRoot`, built into `fesmDir`. Paths are relative to `configDir`, the
 * folder of the config file, as size-limit resolves them.
 */
export function sizeChecks(uiRoot: string, fesmDir: string, configDir: string): SizeCheck[] {
  return entryBudgets(uiRoot).map(({ name, limit }) => ({
    name: `@avelune/ui/${name}`,
    path: relative(configDir, join(fesmDir, `avelune-ui-${name}.mjs`)),
    limit,
    ignore: ['@avelune/ui/*', '@avelune/tokens/brand'],
  }));
}

const uiRoot = join(import.meta.dirname, '..');

export default sizeChecks(uiRoot, join(uiRoot, '..', '..', 'dist', 'packages', 'ui', 'fesm2022'), import.meta.dirname);
