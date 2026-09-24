// Turns Lucide's icon nodes into the kit's typed icon data (ADR 0020, 0033). Pure functions; the CLI is generate.ts.

/**
 * The shapes `<ave-icon>` draws, with the attributes each may carry. An icon with another shape (Lucide also uses
 * ellipse, polyline and polygon) fails until the component draws it too; AveIcon's type check keeps both in step.
 */
export const elementAttributes = {
  path: { required: ['d'], optional: [] },
  circle: { required: ['cx', 'cy', 'r'], optional: [] },
  line: { required: ['x1', 'x2', 'y1', 'y2'], optional: [] },
  rect: { required: ['height', 'width', 'x', 'y'], optional: ['rx', 'ry'] },
} as const satisfies Readonly<
  Record<string, { readonly required: readonly string[]; readonly optional: readonly string[] }>
>;

export type Tag = keyof typeof elementAttributes;

/** One element of an icon as the generated file stores it: the tag, then its attributes in name order. */
export interface Element {
  readonly tag: Tag;
  readonly attributes: Readonly<Record<string, string>>;
}

export class IconError extends Error {
  readonly problems: readonly string[];

  constructor(problems: readonly string[]) {
    super(problems.join('\n'));
    this.problems = problems;
  }
}

const isTag = (tag: string): tag is Tag => Object.hasOwn(elementAttributes, tag);

/** Checks one Lucide node list and returns it as elements; every problem is collected, not just the first. */
function toElements(name: string, nodes: unknown, problems: string[]): Element[] {
  if (!Array.isArray(nodes) || nodes.length === 0) {
    problems.push(`${name}: no elements`);
    return [];
  }
  const elements: Element[] = [];
  for (const [index, node] of nodes.entries()) {
    const where = `${name}, element ${String(index + 1)}`;
    const [tag, attributes] = Array.isArray(node) ? (node as unknown[]) : [];
    if (typeof tag !== 'string' || typeof attributes !== 'object' || attributes === null) {
      problems.push(`${where}: not a [tag, attributes] pair`);
      continue;
    }
    if (!isTag(tag)) {
      problems.push(`${where}: <${tag}> is not a shape the kit draws`);
      continue;
    }
    const { required, optional } = elementAttributes[tag];
    const allowed: readonly string[] = [...required, ...optional];
    const entries = Object.entries(attributes as Record<string, unknown>);
    for (const [key, value] of entries) {
      if (key === 'fill') problems.push(`${where}: fill; the kit's icons are outlines only (ADR 0020)`);
      else if (!allowed.includes(key)) problems.push(`${where}: <${tag}> attribute "${key}" is not allowed`);
      else if (typeof value !== 'string' || value === '') problems.push(`${where}: "${key}" is empty`);
    }
    for (const key of required) {
      if (!entries.some(([present]) => present === key)) problems.push(`${where}: <${tag}> lacks "${key}"`);
    }
    elements.push({
      tag,
      attributes: Object.fromEntries(
        entries.filter(([key]) => allowed.includes(key)).sort(([a], [b]) => a.localeCompare(b)),
      ) as Record<string, string>,
    });
  }
  return elements;
}

/** The kit's icons from Lucide's icon nodes. Fails on an unknown, repeated or unsorted name, and on any shape outside the kit's rules. */
export function selectIcons(names: readonly string[], lucide: unknown): ReadonlyMap<string, readonly Element[]> {
  const problems: string[] = [];
  const nodes = typeof lucide === 'object' && lucide !== null ? (lucide as Record<string, unknown>) : {};
  const icons = new Map<string, readonly Element[]>();
  for (const [index, name] of names.entries()) {
    const previous = names[index - 1];
    if (previous !== undefined && previous.localeCompare(name) >= 0) {
      problems.push(`${name}: the list must be in order and without repeats (after ${previous})`);
    }
    if (!Object.hasOwn(nodes, name)) {
      problems.push(`${name}: not a Lucide icon (aliases do not count; use the name in icon-nodes.json)`);
      continue;
    }
    icons.set(name, toElements(name, nodes[name], problems));
  }
  if (problems.length > 0) throw new IconError(problems);
  return icons;
}

/** The generated TypeScript module: the element type, the icon data, the name union and the list of names. */
export function iconsModule(icons: ReadonlyMap<string, readonly Element[]>, source: string): string {
  const tags = Object.entries(elementAttributes).map(([tag, { required, optional }]) => {
    const fields = [
      `readonly tag: '${tag}'`,
      ...required.map((key) => `readonly ${key}: string`),
      ...optional.map((key) => `readonly ${key}?: string`),
    ];
    return `  | { ${fields.join('; ')} }`;
  });
  const data = [...icons].map(([name, elements]) => {
    const items = elements.map(
      ({ tag, attributes }) =>
        `{ tag: '${tag}', ${Object.entries(attributes)
          .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
          .join(', ')} }`,
    );
    return `  ${JSON.stringify(name)}: [${items.join(', ')}],`;
  });
  return [
    `// Generated by packages/icons/scripts/generate.ts from ${source} (ISC, LICENSE-lucide.txt) and`,
    '// scripts/icons.config.ts. Do not edit: change the config and run `pnpm nx run icons:generate --update` (ADR 0033).',
    '',
    "/** One element of an icon, on Lucide's 24 × 24 grid, stroked with the current colour. */",
    'export type IconElement =',
    ...tags,
    ';',
    '',
    "/** The kit's icons: outlines on a 24 × 24 grid (ADR 0020). */",
    'export const icons = {',
    ...data,
    '} as const satisfies Readonly<Record<string, readonly IconElement[]>>;',
    '',
    '/** The name of an icon in the kit. */',
    'export type IconName = keyof typeof icons;',
    '',
    '/** Every icon name, in order. */',
    `export const iconNames = [${[...icons.keys()].map((name) => JSON.stringify(name)).join(', ')}] as const satisfies readonly IconName[];`,
    '',
  ].join('\n');
}
