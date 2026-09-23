// Reads a token package from disk into the path → contents map that checkTokens() takes.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import type { Files } from './check.ts';

/** Every file under `root`, skipping node_modules, keyed by its path relative to `root` with / separators. */
export function readFiles(root: string): Map<string, string> {
  const files = new Map<string, string>();
  if (!existsSync(root)) return files;
  const walk = (directory: string) => {
    for (const entry of readdirSync(directory)) {
      if (entry === 'node_modules') continue;
      const path = join(directory, entry);
      if (statSync(path).isDirectory()) walk(path);
      else files.set(relative(root, path).split(sep).join('/'), readFileSync(path, 'utf8'));
    }
  };
  walk(root);
  return files;
}

/** `base` with every file of `overlay` added or replaced: how failing fixtures change one file of a valid package. */
export function overlay(base: Files, changes: Files): Map<string, string> {
  return new Map([...base, ...changes]);
}
