// The components manifest of a built Storybook (`features.componentsManifest`, ADR 0090), read the way the MCP docs
// toolset reads it: `manifests/components.json` and the files its `$ref`s point at.
import { existsSync, readFileSync } from 'node:fs';
import { join, normalize } from 'node:path';

/** What docgen says about a story file's `component`. */
export interface Docgen {
  readonly className: string;
  readonly selector: string;
  readonly inputs: readonly string[];
  readonly outputs: readonly string[];
  /** The inputs whose description (from the JSDoc) is empty. */
  readonly undescribed: readonly string[];
}

export interface StoryDoc {
  readonly id: string;
  readonly name: string;
  readonly snippet?: string;
  readonly warning?: string;
  readonly error?: string;
}

/** One entry of the manifest: a story file with its docs page. */
export interface ManifestEntry {
  readonly id: string;
  /** The story file, relative to the workspace: `packages/ui/accordion/accordion.stories.ts`. */
  readonly storiesPath?: string;
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

/** The story file as a workspace path; the manifest writes it relative to the Storybook's config folder. */
function workspacePath(path: string | undefined): string | undefined {
  return path?.replace(/^(?:\.\.\/)+/, '');
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
  return {
    ...(path === undefined ? {} : { storiesPath: path }),
    ...(error === undefined ? {} : { docgenError: error }),
    docgen: {
      className: text(meta['name']) ?? '',
      selector: text(meta['selector']) ?? '',
      inputs,
      outputs: strings(meta['outputs']),
      undescribed,
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

/** Every entry of the components manifest of the Storybook built into `root`. */
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
  return Object.values(manifest['components'])
    .filter(isObject)
    .map((component): ManifestEntry => {
      const docgen = readDocgen(resolveRef(root, component['docgen']));
      const { stories, storiesPath } = readStories(resolveRef(root, component['stories']));
      const docs = isObject(component['docs'])
        ? Object.values(component['docs'])
            .filter(isObject)
            .map((doc) => {
              const mdx = resolveRef(root, doc['mdx']);
              return isObject(mdx) ? (text(mdx['content']) ?? '') : '';
            })
            .join('\n')
        : '';
      const path = docgen.storiesPath ?? storiesPath;
      return {
        id: text(component['id']) ?? '',
        ...(path === undefined ? {} : { storiesPath: path }),
        ...(docgen.docgen === undefined ? {} : { docgen: docgen.docgen }),
        ...(docgen.docgenError === undefined ? {} : { docgenError: docgen.docgenError }),
        stories,
        docs,
      };
    });
}

/** The entry point a story file belongs to: `packages/ui/date-picker/…` → `date-picker`. */
export function storiesEntry(path: string | undefined): string | undefined {
  return path === undefined ? undefined : /^packages\/ui\/([^/]+)\//.exec(path)?.[1];
}
