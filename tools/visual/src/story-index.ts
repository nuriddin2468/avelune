// Which Storybook build the visual suite reads and where its baselines live. Both default to the real ones; the
// proof (proof.spec.ts) points them at the fixture Storybook through the two environment variables.
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { workspaceRoot } from './environment.ts';

/** The static Storybook build: `index.json` and `iframe.html`. */
export const siteDir = resolve(workspaceRoot, process.env['AVELUNE_VISUAL_SITE'] ?? join('dist', 'apps', 'storybook'));

/** Committed baselines: `<story id>/<project>.png`. */
export const baselinesDir = resolve(
  workspaceRoot,
  process.env['AVELUNE_VISUAL_BASELINES'] ?? join('tools', 'visual', 'baselines'),
);

export interface Story {
  readonly id: string;
  readonly title: string;
  readonly name: string;
  readonly tags: readonly string[];
}

/** A story with this tag is also compared in forced-colors mode (project `forced-colors`, ADR 0030). */
export const forcedColorsTag = 'forced-colors';

/** A docs page of a Storybook `index.json`: a component's MDX page, checked by axe in both themes (docs.e2e.ts). */
export interface DocsPage {
  readonly id: string;
  readonly title: string;
}

/** The entries of one type in a Storybook `index.json` (format v5), sorted by id. */
function parseEntries(json: string, type: 'story' | 'docs'): Story[] {
  const index: unknown = JSON.parse(json);
  const version: unknown = typeof index === 'object' && index !== null ? Reflect.get(index, 'v') : undefined;
  const entries: unknown = typeof index === 'object' && index !== null ? Reflect.get(index, 'entries') : undefined;
  if (version !== 5 || typeof entries !== 'object' || entries === null) {
    throw new Error('Expected a Storybook index.json in format v5');
  }
  const found: Story[] = [];
  for (const entry of Object.values(entries) as unknown[]) {
    if (typeof entry !== 'object' || entry === null || Reflect.get(entry, 'type') !== type) continue;
    const id: unknown = Reflect.get(entry, 'id');
    const title: unknown = Reflect.get(entry, 'title');
    const name: unknown = Reflect.get(entry, 'name');
    const tags: unknown = Reflect.get(entry, 'tags') ?? [];
    if (
      typeof id !== 'string' ||
      typeof title !== 'string' ||
      typeof name !== 'string' ||
      !Array.isArray(tags) ||
      !tags.every((tag) => typeof tag === 'string')
    ) {
      throw new Error(`Malformed ${type} entry in index.json: ${JSON.stringify(entry)}`);
    }
    found.push({ id, title, name, tags });
  }
  return found.sort((a, b) => a.id.localeCompare(b.id));
}

/** Every story (not docs page) in a Storybook `index.json` (format v5), sorted by id. */
export function parseStoryIndex(json: string): Story[] {
  const stories = parseEntries(json, 'story');
  if (stories.length === 0) throw new Error('index.json lists no stories');
  return stories;
}

/** Every docs page in a Storybook `index.json` (format v5), sorted by id; a Storybook may have none. */
export function parseDocsIndex(json: string): DocsPage[] {
  return parseEntries(json, 'docs').map(({ id, title }) => ({ id, title }));
}

/** The stories of the Storybook build in `dir`. */
export function readStories(dir: string = siteDir): Story[] {
  return parseStoryIndex(readFileSync(join(dir, 'index.json'), 'utf8'));
}

/** The docs pages of the Storybook build in `dir`. */
export function readDocs(dir: string = siteDir): DocsPage[] {
  return parseDocsIndex(readFileSync(join(dir, 'index.json'), 'utf8'));
}
