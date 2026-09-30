// The manifests of a built Storybook (`features.componentsManifest`, ADR 0090), read the way the MCP docs toolset reads
// them: `manifests/components.json`, `manifests/docs.json` for the docs pages without a story file (ADR 0101), and the
// files their `$ref`s point at.
import { existsSync, readFileSync } from 'node:fs';
import { join, normalize, posix } from 'node:path';

/** An input or an output as docgen shows it: the table of `docs-show`. */
export interface Member {
  readonly name: string;
  readonly description: string;
  /** The type as shown: `AveSelectSize`, `boolean`, `'sm' | 'md'`. */
  readonly type: string;
  /** The members of a union of literals, which docgen knows even when it shows the type by its alias's name. */
  readonly union: readonly (string | number)[];
}

/** What docgen says about a story file's `component`. */
export interface Docgen {
  readonly className: string;
  readonly selector: string;
  /** The class's JSDoc, which `docs-show` shows first. */
  readonly description: string;
  /** The tags of the class's JSDoc: `beta`. */
  readonly tags: readonly string[];
  readonly inputs: readonly string[];
  readonly outputs: readonly string[];
  /** The inputs whose description (from the JSDoc) is empty. */
  readonly undescribed: readonly string[];
  readonly members: readonly Member[];
}

export interface StoryDoc {
  readonly id: string;
  readonly name: string;
  readonly snippet?: string;
  readonly warning?: string;
  readonly error?: string;
}

/** One entry of the manifest: a story file with its docs page, or a docs page without a story file. */
export interface ManifestEntry {
  readonly id: string;
  /** The story file, relative to the workspace: `packages/ui/accordion/accordion.stories.ts`. */
  readonly storiesPath?: string;
  /** Its first docs page, relative to the workspace: `packages/ui/theme/theme.mdx`. */
  readonly docsPath?: string;
  readonly docgen?: Docgen;
  readonly docgenError?: string;
  readonly stories: readonly StoryDoc[];
  /** The content of its docs pages (MDX), joined. */
  readonly docs: string;
}

type Json = Record<string, unknown>;

const isObject = (value: unknown): value is Json =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const text = (value: unknown): string | undefined => (typeof value === 'string' ? value : undefined);
const strings = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8')) as unknown;
}

/** Resolves a `$ref` of the manifest (a path relative to `manifests/`, then a JSON pointer). */
function resolveRef(root: string, ref: unknown): unknown {
  const value = isObject(ref) ? text(ref['$ref']) : undefined;
  if (value === undefined) return undefined;
  const [file = '', pointer = ''] = value.split('#');
  const path = normalize(join(root, 'manifests', file));
  if (!existsSync(path)) throw new Error(`The manifest refers to ${file}, which the build does not hold`);
  let target: unknown = readJson(path);
  for (const key of pointer.split('/').filter(Boolean)) {
    target = isObject(target) ? target[key.replace(/~1/g, '/').replace(/~0/g, '~')] : undefined;
  }
  return target;
}

/** A story file or a docs page as a workspace path; the manifest writes it relative to `apps/storybook`. */
function workspacePath(path: string | undefined): string | undefined {
  return path === undefined ? undefined : posix.join('apps/storybook', path);
}

function readDocgen(value: unknown): Pick<ManifestEntry, 'docgen' | 'docgenError' | 'storiesPath'> {
  if (!isObject(value)) return {};
  const path = workspacePath(text(value['path']));
  const error = isObject(value['error']) ? text(value['error']['message']) : undefined;
  const meta = value['angularComponentMeta'];
  if (!isObject(meta)) {
    return {
      ...(path === undefined ? {} : { storiesPath: path }),
      docgenError: error ?? 'docgen has no Angular metadata',
    };
  }
  const argTypes = isObject(value['argTypes']) ? value['argTypes'] : {};
  const inputs = strings(meta['inputs']);
  const undescribed = inputs.filter((input) => {
    const argType = argTypes[input];
    return !isObject(argType) || (text(argType['description']) ?? '').trim() === '';
  });
  const members = Object.values(argTypes)
    .filter(isObject)
    .map((argType): Member => {
      const type = isObject(argType['type']) ? argType['type'] : {};
      const table = isObject(argType['table']) ? argType['table'] : {};
      const shown = isObject(table['type']) ? text(table['type']['summary']) : undefined;
      const values = type['name'] === 'enum' && Array.isArray(type['value']) ? type['value'] : [];
      return {
        name: text(argType['name']) ?? '',
        description: text(argType['description']) ?? '',
        type: shown ?? '',
        union: values.filter((item): item is string | number => typeof item === 'string' || typeof item === 'number'),
      };
    });
  return {
    ...(path === undefined ? {} : { storiesPath: path }),
    ...(error === undefined ? {} : { docgenError: error }),
    docgen: {
      className: text(meta['name']) ?? '',
      selector: text(meta['selector']) ?? '',
      description: text(value['description']) ?? '',
      tags: isObject(value['jsDocTags']) ? Object.keys(value['jsDocTags']) : [],
      inputs,
      outputs: strings(meta['outputs']),
      undescribed,
      members,
    },
  };
}

function readStories(value: unknown): { readonly stories: StoryDoc[]; readonly storiesPath?: string } {
  if (!isObject(value)) return { stories: [] };
  const path = workspacePath(text(value['path']));
  const records = isObject(value['stories']) ? Object.values(value['stories']) : [];
  const stories = records.filter(isObject).map((story): StoryDoc => {
    const snippet = text(story['snippet']);
    const warning = text(story['warning']);
    const error = isObject(story['error']) ? text(story['error']['message']) : undefined;
    return {
      id: text(story['id']) ?? '',
      name: text(story['name']) ?? '',
      ...(snippet === undefined ? {} : { snippet }),
      ...(warning === undefined ? {} : { warning }),
      ...(error === undefined ? {} : { error }),
    };
  });
  return { stories, ...(path === undefined ? {} : { storiesPath: path }) };
}

interface DocsPage {
  readonly path?: string;
  readonly content: string;
}

/** The docs pages of an entry: its MDX as written, and where it lives. */
function readDocs(root: string, docs: unknown): DocsPage[] {
  if (!isObject(docs)) return [];
  return Object.values(docs)
    .filter(isObject)
    .map((doc) => {
      const mdx = resolveRef(root, doc['mdx']);
      if (!isObject(mdx)) return { content: '' };
      const path = workspacePath(text(mdx['path']));
      return { ...(path === undefined ? {} : { path }), content: text(mdx['content']) ?? '' };
    });
}

/** The docs pages without a story file (`manifests/docs.json`), which the docs toolset lists under "Docs". */
function readStandaloneDocs(root: string): ManifestEntry[] {
  const file = join(root, 'manifests', 'docs.json');
  if (!existsSync(file)) return [];
  const manifest = readJson(file);
  if (!isObject(manifest) || manifest['v'] !== 1 || !isObject(manifest['docs'])) {
    throw new Error(
      'The docs manifest is not the split format (v 1) this check reads; Storybook changed it (ADR 0101)',
    );
  }
  return Object.entries(manifest['docs']).map(([id, doc]): ManifestEntry => {
    const [page] = readDocs(root, { [id]: doc });
    return {
      id,
      ...(page?.path === undefined ? {} : { docsPath: page.path }),
      stories: [],
      docs: page?.content ?? '',
    };
  });
}

/** Every entry of the manifests of the Storybook built into `root`. */
export function readManifest(root: string): ManifestEntry[] {
  const file = join(root, 'manifests', 'components.json');
  if (!existsSync(file)) {
    throw new Error(`${file} does not exist: build Storybook with features.componentsManifest`);
  }
  const manifest = readJson(file);
  if (!isObject(manifest) || manifest['v'] !== 1 || !isObject(manifest['components'])) {
    throw new Error(
      'The components manifest is not the split format (v 1) this check reads; Storybook changed it (ADR 0090)',
    );
  }
  const entries = Object.values(manifest['components'])
    .filter(isObject)
    .map((component): ManifestEntry => {
      const docgen = readDocgen(resolveRef(root, component['docgen']));
      const { stories, storiesPath } = readStories(resolveRef(root, component['stories']));
      const pages = readDocs(root, component['docs']);
      const path = docgen.storiesPath ?? storiesPath;
      const docsPath = pages.find((page) => page.path !== undefined)?.path;
      return {
        id: text(component['id']) ?? '',
        ...(path === undefined ? {} : { storiesPath: path }),
        ...(docsPath === undefined ? {} : { docsPath }),
        ...(docgen.docgen === undefined ? {} : { docgen: docgen.docgen }),
        ...(docgen.docgenError === undefined ? {} : { docgenError: docgen.docgenError }),
        stories,
        docs: pages.map((page) => page.content).join('\n'),
      };
    });
  return [...entries, ...readStandaloneDocs(root)];
}

/** The entry point a story file or a docs page belongs to: `packages/ui/date-picker/…` → `date-picker`. */
export function storiesEntry(path: string | undefined): string | undefined {
  return path === undefined ? undefined : /^packages\/ui\/([^/]+)\//.exec(path)?.[1];
}

/** The entry point of an entry, from its story file or, without one, its docs page. */
export function entryPoint(entry: ManifestEntry): string | undefined {
  return storiesEntry(entry.storiesPath ?? entry.docsPath);
}

/** Whether an entry is a Foundations page: a story file under `apps/storybook/src/foundations` (ADR 0102). */
export function isFoundations(entry: ManifestEntry): boolean {
  return (entry.storiesPath ?? entry.docsPath ?? '').startsWith('apps/storybook/src/foundations/');
}
