// What the manifests must hold for an agent that reads them through the Storybook MCP docs toolset (ADR 0090, 0101,
// 0102): every component and directive of the kit, every input and output, every other export and its fields, every
// public token and class, and for every story a snippet an application can paste.
import type { KitComponent, KitExport } from './api-report.ts';
import { entryPoint, isFoundations, storiesEntry, type ManifestEntry } from './manifest.ts';

/** The components declared in story files: frames, which must never reach an application. */
export interface Frames {
  readonly selectors: readonly string[];
  readonly classNames: readonly string[];
}

/** What an application's CSS may name: the public tokens' custom properties and the global stylesheet's classes. */
export interface PublicCss {
  readonly variables: readonly string[];
  readonly classes: readonly string[];
}

export interface CheckInput {
  readonly components: readonly KitComponent[];
  readonly exports: readonly KitExport[];
  readonly entries: readonly ManifestEntry[];
  readonly frames: Frames;
  readonly css: PublicCss;
  /** Entry points whose components are the kit's own plumbing, with the reason. */
  readonly exempt: ReadonlyMap<string, string>;
  /** Exports that only the kit's own entry points use, with the reason (ADR 0101). */
  readonly exemptExports: ReadonlyMap<string, string>;
}

/** The tags a component's JSDoc may carry: release tags (ADR 0101). */
const RELEASE_TAGS: readonly string[] = ['alpha', 'beta', 'public', 'deprecated'];

const escape = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** The name a template writes: `ave-accordion-item`, or the kit's attribute (`aveCardTitle` of `[aveCardTitle]`). */
export function selectorName(selector: string): string {
  const first = selector.split(',')[0]?.trim() ?? '';
  const attributes = [...first.matchAll(/\[([A-Za-z][\w-]*)\]/g)].map((match) => match[1] ?? '');
  return attributes.filter((attribute) => attribute.startsWith('ave')).at(-1) ?? first.replace(/\[.*$/, '');
}

/** Whether a docs page names an element, an attribute or a binding: in code quotes, or written in markup. */
export function names(docs: string, name: string): boolean {
  const word = escape(name);
  return new RegExp(`\`${word}\`|[\\s\\[(<]${word}\\)?\\]?(?:=|\\s|/?>)`).test(docs);
}

const word = (name: string): RegExp => new RegExp(`(?<![\\w$-])${escape(name)}(?![\\w$-])`);

/** Whether a text names an interface's field: in code quotes, as a key (`disabled: true`) or read (`sort.direction`). */
export function namesField(text: string, field: string): boolean {
  const name = escape(field);
  return new RegExp(`\`(?:[\\w$]+\\.)?${name}(?:\\(\\))?\\??\`|(?<![\\w$-])${name}\\??:|\\.${name}(?![\\w$-])`).test(
    text,
  );
}

/**
 * The first line where `…` stands for something left out rather than ending or starting a word of text ("Загрузка…",
 * "…9012", "…{{ tail }}"); comments may hold it.
 */
export function looseEllipsis(snippet: string): string | undefined {
  const code = snippet
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[ \t])\/\/.*$/gm, '$1');
  return code.split('\n').find((line) => /(?<![\p{L}\p{N}])…(?![\p{L}\p{N}]|\{\{)/u.test(line));
}

const TYPESCRIPT_LINE =
  /^\s*(?:(?:import|export|const|let|type|interface)\s|this\.|\{\s*[a-z]\w*\??:|(?:(?:readonly|private|protected|public|static)\s+)*[a-z]\w*(?:\s*:\s*[^=\n]+?)?\s+=\s+\S)/m;
const MARKUP_LINE = /^\s*(?:\/\/\s*)?<[a-z]/m;

/** What a snippet is: markup alone, a whole component, or TypeScript outside one, with or without markup (ADR 0101). */
export function snippetKind(snippet: string): 'markup' | 'component' | 'mixed' | 'fragment' {
  // An attribute's value, such as `[items]="[{ label: … }]"`, is markup however it reads.
  const text = snippet.replace(/"[^"]*"/g, '""');
  if (text.includes('@Component(')) return 'component';
  if (!TYPESCRIPT_LINE.test(text)) return 'markup';
  return MARKUP_LINE.test(text) ? 'mixed' : 'fragment';
}

function storyProblems(entry: ManifestEntry, frames: Frames): string[] {
  const problems: string[] = [];
  for (const story of entry.stories) {
    const where = `${entry.id}: story "${story.name}"`;
    if (story.error !== undefined) {
      problems.push(`${where}: the snippet failed: ${story.error}`);
      continue;
    }
    if (story.snippet === undefined || story.snippet.trim() === '') {
      problems.push(`${where} has no snippet: set parameters.docs.source.code to the markup an application writes`);
      continue;
    }
    if (story.warning !== undefined) {
      problems.push(`${where} has an incomplete snippet: ${story.warning.split('\n')[0] ?? ''}`);
    }
    const snippet = story.snippet;
    const frame = [...frames.selectors, ...frames.classNames].find((name) =>
      new RegExp(`(?<![\\w-])${escape(name)}(?![\\w-])`).test(snippet),
    );
    if (frame !== undefined) problems.push(`${where}: the snippet shows the story frame ${frame}`);
    if (snippet.includes("selector: 'app-demo'")) {
      problems.push(
        `${where}: Storybook derived the snippet from the story's args, whose fields are strings where inputs take ` +
          `unions ('md'): set parameters.docs.source.code (ADR 0101)`,
      );
    }
    const loose = looseEllipsis(snippet);
    if (loose !== undefined) {
      problems.push(
        `${where}: the snippet leaves something out with "…" (${loose.trim()}): write it, or name it in a comment (ADR 0101)`,
      );
    }
    const kind = snippetKind(snippet);
    if (kind === 'mixed') {
      problems.push(
        `${where}: the snippet mixes markup and TypeScript: write the markup alone, or a whole component (ADR 0101)`,
      );
    } else if (kind === 'fragment') {
      problems.push(
        `${where}: the snippet is TypeScript outside a component: write the whole component, its imports, ` +
          `@Component and the fields it uses (ADR 0101)`,
      );
    }
  }
  return problems;
}

function docgenProblems(entry: ManifestEntry): string[] {
  const docgen = entry.docgen;
  if (docgen === undefined) return [];
  const problems = docgen.tags
    .filter((tag) => !RELEASE_TAGS.includes(tag))
    .map(
      (tag) =>
        `${entry.id}: the JSDoc of ${docgen.className} has a @${tag} tag, which cuts its description there: ` +
        `TypeScript reads "@${tag}" after white space as a tag, in a code fence too; keep control flow out of ` +
        `JSDoc examples (ADR 0101)`,
    );
  for (const member of docgen.members) {
    const shown = member.type.split('|').map((part) => part.trim());
    const hidden = member.union.filter(
      (value) => !shown.includes(`'${String(value)}'`) && !shown.includes(String(value)),
    );
    const missing = hidden.filter((value) => !word(String(value)).test(member.description));
    if (missing.length > 0) {
      problems.push(
        `${entry.id}: the input "${member.name}" is typed ${member.type}, and its JSDoc does not name ` +
          `${missing.map((value) => `\`${String(value)}\``).join(', ')} (ADR 0101)`,
      );
    }
  }
  return problems;
}

function entryProblems(entry: ManifestEntry, input: CheckInput): string[] {
  const point = storiesEntry(entry.storiesPath);
  if (point === undefined) return [];
  const problems: string[] = [];
  const kit = input.components.filter((component) => component.entry === point).map((c) => c.className);
  if (entry.docgenError !== undefined) problems.push(`${entry.id}: docgen failed: ${entry.docgenError}`);
  if (entry.docgen === undefined) {
    if (kit.length > 0 && entry.docgenError === undefined) {
      problems.push(`${entry.id} has no component: set its meta.component to ${kit.join(' or ')}`);
    }
  } else if (!kit.includes(entry.docgen.className)) {
    problems.push(
      `${entry.id}: its component is ${entry.docgen.className}, not the kit's` +
        (kit.length > 0 ? ` (${kit.join(', ')})` : '; leave meta.component out'),
    );
  }
  return [...problems, ...docgenProblems(entry), ...storyProblems(entry, input.frames)];
}

function componentProblems(component: KitComponent, entries: readonly ManifestEntry[]): string[] {
  const own = entries.filter((entry) => entryPoint(entry) === component.entry);
  const where = `${component.className} (@avelune/ui/${component.entry})`;
  if (own.length === 0) return [`${where} has no story file or docs page in the manifest`];
  const docs = own.map((entry) => entry.docs).join('\n');
  const documented = entries.find((entry) => entry.docgen?.className === component.className);
  const problems: string[] = [];
  if (documented === undefined && !names(docs, selectorName(component.selector))) {
    problems.push(`${where} is neither a story file's component nor named on its docs page`);
  }
  const bindings = [
    ...component.inputs.map((name) => ({ kind: 'input', name, listed: documented?.docgen?.inputs ?? [] })),
    // A model's change event (`expandedChange`) comes with its input, which two-way binding names.
    ...component.outputs
      .filter((name) => !(name.endsWith('Change') && component.inputs.includes(name.slice(0, -'Change'.length))))
      .map((name) => ({ kind: 'output', name, listed: documented?.docgen?.outputs ?? [] })),
  ];
  for (const { kind, name, listed } of bindings) {
    if (!listed.includes(name) && !names(docs, name)) {
      problems.push(`${where}: the ${kind} "${name}" is neither in docgen nor named on its docs page`);
    }
  }
  for (const name of documented?.docgen?.undescribed ?? []) {
    problems.push(`${where}: the input "${name}" has no description in docgen`);
  }
  return problems;
}

/** Everything an agent reads for an entry point: its docs pages, its components' JSDoc and their inputs' types. */
function readable(point: string, entries: readonly ManifestEntry[]): string {
  return entries
    .filter((entry) => entryPoint(entry) === point)
    .flatMap((entry) => [
      entry.docs,
      entry.docgen?.description ?? '',
      ...(entry.docgen?.members ?? []).flatMap((member) => [member.description, member.type]),
    ])
    .join('\n');
}

function exportProblems(input: CheckInput): string[] {
  const problems: string[] = [];
  const classes = new Set(input.components.map((component) => component.className));
  const points = [...new Set(input.exports.map((item) => item.entry))].filter((point) => !input.exempt.has(point));
  for (const point of points) {
    if (!input.entries.some((entry) => entryPoint(entry) === point)) {
      problems.push(`@avelune/ui/${point} has no story file or docs page in the manifest (ADR 0101)`);
      continue;
    }
    const text = readable(point, input.entries);
    for (const item of input.exports.filter((candidate) => candidate.entry === point)) {
      if (input.exemptExports.has(item.name)) continue;
      const where = `${item.name} (@avelune/ui/${point})`;
      if (!classes.has(item.name) && !word(item.name).test(text)) {
        problems.push(`${where} is named on no docs page, JSDoc or input type of its entry point (ADR 0101)`);
      }
      for (const field of item.fields.filter((name) => !namesField(text, name))) {
        problems.push(
          `${item.name}.${field} (@avelune/ui/${point}) is named on no docs page or JSDoc of its entry point (ADR 0101)`,
        );
      }
    }
  }
  return problems;
}

function foundationsProblems(input: CheckInput): string[] {
  const text = input.entries
    .filter(isFoundations)
    .map((entry) => entry.docs)
    .join('\n');
  return [
    ...input.css.variables
      .filter((name) => !word(name).test(text))
      .map((name) => `the token ${name} is on no Foundations docs page (ADR 0102)`),
    ...input.css.classes
      .filter((name) => !word(name).test(text))
      .map((name) => `the class ${name} of the global stylesheet is on no Foundations docs page (ADR 0102)`),
  ];
}

/** Every way the manifest falls short of the kit's public API; none means an agent can find all of it. */
export function manifestProblems(input: CheckInput): string[] {
  const entries = input.entries.filter((entry) => !input.exempt.has(entryPoint(entry) ?? ''));
  return [
    ...entries.flatMap((entry) => entryProblems(entry, input)),
    ...input.components
      .filter((component) => !input.exempt.has(component.entry))
      .flatMap((component) => componentProblems(component, input.entries)),
    ...exportProblems(input),
    ...foundationsProblems(input),
  ];
}
