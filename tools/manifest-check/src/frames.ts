// The components a story file declares for itself: frames that lay stories out, which a snippet must never show.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Frames } from './check.ts';

/** The selectors and class names of the components and directives declared in `source`, a story file. */
export function framesOf(source: string): Frames {
  const declarations = [...source.matchAll(/@(?:Component|Directive)\(\{[\s\S]*?\}\)\s*(?:export\s+)?class (\w+)/g)];
  return {
    selectors: declarations.flatMap((match) => [...match[0].matchAll(/selector: '([^']+)'/g)].map((m) => m[1] ?? '')),
    classNames: declarations.map((match) => match[1] ?? ''),
  };
}

/** Every frame of the kit's story files under `packages/ui`. */
export function kitFrames(uiRoot: string): Frames {
  const selectors: string[] = [];
  const classNames: string[] = [];
  for (const entry of readdirSync(uiRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    for (const file of readdirSync(join(uiRoot, entry.name))) {
      if (!file.endsWith('.stories.ts')) continue;
      const frames = framesOf(readFileSync(join(uiRoot, entry.name, file), 'utf8'));
      selectors.push(...frames.selectors);
      classNames.push(...frames.classNames);
    }
  }
  return { selectors, classNames };
}
