// What the components manifest must hold for an agent that reads it through the Storybook MCP docs toolset (ADR 0090):
// every component and directive of the kit, every input and output, and a snippet an application can copy for every
// story.
import type { KitComponent } from './api-report.ts';
import { storiesEntry, type ManifestEntry } from './manifest.ts';

/** The components declared in story files: frames, which must never reach an application. */
export interface Frames {
  readonly selectors: readonly string[];
  readonly classNames: readonly string[];
}

export interface CheckInput {
  readonly components: readonly KitComponent[];
  readonly entries: readonly ManifestEntry[];
  readonly frames: Frames;
  /** Entry points whose components are the kit's own plumbing, with the reason. */
  readonly exempt: ReadonlyMap<string, string>;
}

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
    const frame = [...frames.selectors, ...frames.classNames].find((name) =>
      new RegExp(`(?<![\\w-])${escape(name)}(?![\\w-])`).test(story.snippet ?? ''),
    );
    if (frame !== undefined) problems.push(`${where}: the snippet shows the story frame ${frame}`);
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
  return [...problems, ...storyProblems(entry, input.frames)];
}

function componentProblems(component: KitComponent, entries: readonly ManifestEntry[]): string[] {
  const own = entries.filter((entry) => storiesEntry(entry.storiesPath) === component.entry);
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

/** Every way the manifest falls short of the kit's public API; none means an agent can find all of it. */
export function manifestProblems(input: CheckInput): string[] {
  const entries = input.entries.filter((entry) => !input.exempt.has(storiesEntry(entry.storiesPath) ?? ''));
  return [
    ...entries.flatMap((entry) => entryProblems(entry, input)),
    ...input.components
      .filter((component) => !input.exempt.has(component.entry))
      .flatMap((component) => componentProblems(component, input.entries)),
  ];
}
