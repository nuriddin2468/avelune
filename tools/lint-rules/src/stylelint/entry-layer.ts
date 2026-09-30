// The layer an @avelune/ui entry point declares in its entry.json (ADR 0001, 0091), for the Stylelint rules that
// treat a pattern's stylesheets apart from a component's.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

/**
 * The `layer` of the entry.json nearest above `file`: the entry point the stylesheet belongs to. `undefined` for a
 * file outside every entry point (the global stylesheets, code linted without a file name).
 */
export function entryLayerOf(file: string | undefined): string | undefined {
  if (file === undefined) return undefined;
  for (let dir = dirname(file); dir !== dirname(dir); dir = dirname(dir)) {
    const manifest = join(dir, 'entry.json');
    if (!existsSync(manifest)) continue;
    const json: unknown = JSON.parse(readFileSync(manifest, 'utf8'));
    const layer: unknown = typeof json === 'object' && json !== null ? Reflect.get(json, 'layer') : undefined;
    return typeof layer === 'string' ? layer : undefined;
  }
  return undefined;
}
