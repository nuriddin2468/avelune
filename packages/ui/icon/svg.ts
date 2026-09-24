import type { IconAttribute, IconAttributes, IconNode, IconTag } from '@avelune/icons';

/** An application's SVG, read into the elements `<ave-icon>` draws (ADR 0036). */
export interface SvgDrawing {
  /** The coordinate system, as four numbers separated by spaces. */
  readonly viewBox: string;
  /** Paint attributes of the root `<svg>`. */
  readonly paint: IconAttributes;
  /** The elements that draw, without editor metadata. */
  readonly nodes: readonly IconNode[];
}

/** The drawing, or every problem found in the SVG; never both. */
export type SvgResult =
  | { readonly drawing: SvgDrawing; readonly problems?: never }
  | { readonly drawing?: never; readonly problems: readonly string[] };

/** One element as the markup writes it, before the kit's rules apply. */
interface RawElement {
  readonly name: string;
  readonly attributes: readonly (readonly [string, string])[];
  readonly children: RawElement[];
  readonly index: number;
  hasText: boolean;
}

/** Paint that elements inherit, allowed on the root `<svg>` too. */
const paintAttributes = [
  'clip-rule',
  'fill',
  'fill-opacity',
  'fill-rule',
  'opacity',
  'paint-order',
  'stroke',
  'stroke-dasharray',
  'stroke-dashoffset',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-miterlimit',
  'stroke-opacity',
  'stroke-width',
] as const satisfies readonly IconAttribute[];

/** Paint, clipping and placement: what every drawn element and container may carry. */
const graphicAttributes = [
  ...paintAttributes,
  'clip-path',
  'id',
  'mask',
  'transform',
] as const satisfies readonly IconAttribute[];

/** The attributes each tag may carry. */
const tagAttributes: Readonly<Record<IconTag, readonly IconAttribute[]>> = {
  circle: [...graphicAttributes, 'cx', 'cy', 'r', 'pathLength'],
  clipPath: [...graphicAttributes, 'clipPathUnits'],
  defs: ['id'],
  ellipse: [...graphicAttributes, 'cx', 'cy', 'rx', 'ry', 'pathLength'],
  g: graphicAttributes,
  line: [...graphicAttributes, 'x1', 'x2', 'y1', 'y2', 'pathLength'],
  linearGradient: ['id', 'x1', 'x2', 'y1', 'y2', 'gradientUnits', 'gradientTransform', 'spreadMethod', 'href'],
  mask: [...graphicAttributes, 'x', 'y', 'width', 'height', 'maskUnits', 'maskContentUnits'],
  path: [...graphicAttributes, 'd', 'pathLength'],
  polygon: [...graphicAttributes, 'points', 'pathLength'],
  polyline: [...graphicAttributes, 'points', 'pathLength'],
  radialGradient: [
    'id',
    'cx',
    'cy',
    'r',
    'fx',
    'fy',
    'fr',
    'gradientUnits',
    'gradientTransform',
    'spreadMethod',
    'href',
  ],
  rect: [...graphicAttributes, 'x', 'y', 'width', 'height', 'rx', 'ry', 'pathLength'],
  stop: ['id', 'offset', 'stop-color', 'stop-opacity'],
  use: [...graphicAttributes, 'href', 'x', 'y', 'width', 'height'],
};

/** Tags whose children are kept; every other tag is a leaf. */
const containers: ReadonlySet<IconTag> = new Set(['clipPath', 'defs', 'g', 'linearGradient', 'mask', 'radialGradient']);

/** Elements that describe the file rather than draw it: dropped with their content. */
const descriptions = new Set(['desc', 'metadata', 'title']);

/** Why the elements people most often meet are refused, so the message says what to do instead. */
const refusals: Readonly<Record<string, string>> = {
  a: 'links are not allowed in an icon',
  animate: 'icons do not animate; the kit animates components, not their icons',
  animateMotion: 'icons do not animate; the kit animates components, not their icons',
  animateTransform: 'icons do not animate; the kit animates components, not their icons',
  filter: 'filters are not supported; draw the effect with shapes',
  foreignObject: 'embedded HTML is not allowed',
  image: 'embedded images are not allowed; use <img> for pictures',
  marker: 'markers are not supported; draw the arrowheads as paths',
  pattern: 'patterns are not supported; draw the fill with shapes',
  script: 'scripts are not allowed',
  set: 'icons do not animate; the kit animates components, not their icons',
  style: 'a <style> sheet is not supported; export with presentation attributes',
  switch: '<switch> is not supported',
  symbol: '<symbol> is not supported; export the drawing itself',
  text: 'text is not supported; convert it to outlines',
  textPath: 'text is not supported; convert it to outlines',
  tspan: 'text is not supported; convert it to outlines',
  view: '<view> is not supported',
};

/** Root attributes that only size or describe the file; the kit sizes and names the icon itself. */
const rootIgnored = new Set([
  'aria-hidden',
  'aria-label',
  'baseProfile',
  'enable-background',
  'focusable',
  'height',
  'id',
  'preserveAspectRatio',
  'role',
  'version',
  'width',
  'x',
  'y',
]);

/** CSS properties of an exported `style` that do not change how the shapes are painted; dropped. */
const inertStyle =
  /^(?:-.*|color|color-interpolation(?:-filters)?|color-rendering|direction|display|enable-background|font(?:-.*)?|image-rendering|isolation|letter-spacing|line-height|marker(?:-start|-mid|-end)?|mix-blend-mode|overflow|shape-rendering|solid-(?:color|opacity)|text-.*|vector-effect|visibility|word-spacing|writing-mode)$/;

const idPattern = /^[A-Za-z_][\w.:-]*$/;
const urlReference = /url\(\s*(['"]?)#([^'")\s]+)\1\s*\)/g;
const entityPattern = /&(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);/g;
const namedEntities: Readonly<Record<string, string>> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

function isTag(name: string): name is IconTag {
  return Object.hasOwn(tagAttributes, name);
}

/** Decodes the XML entities of an attribute value; any other `&` is a problem. */
function decode(value: string, where: string, problems: string[]): string {
  if (value.replace(entityPattern, '').includes('&'))
    problems.push(`${where}: an unknown entity (only XML's five and &#…;)`);
  return value.replace(entityPattern, (_, entity: string) =>
    entity.startsWith('#')
      ? String.fromCodePoint(Number.parseInt(entity.slice(entity[1] === 'x' ? 2 : 1), entity[1] === 'x' ? 16 : 10))
      : (namedEntities[entity] ?? ''),
  );
}

/** Reads the markup into raw elements: XML with attributes and nesting, no DTD, no entities beyond XML's own. */
function parseMarkup(text: string, problems: string[]): RawElement | null {
  const name = /[A-Za-z_][\w.:-]*/y;
  const space = /\s*/y;
  let position = 0;
  let count = 0;

  const skipSpace = () => {
    space.lastIndex = position;
    space.exec(text);
    position = space.lastIndex;
  };
  const readName = (): string | null => {
    name.lastIndex = position;
    const match = name.exec(text);
    if (match === null) return null;
    position = name.lastIndex;
    return match[0];
  };
  /** Skips whitespace, comments and the XML declaration; false after anything that may not appear. */
  const skipMisc = (): boolean => {
    for (;;) {
      skipSpace();
      if (text.startsWith('<!--', position)) {
        const end = text.indexOf('-->', position + 4);
        if (end < 0) {
          problems.push('a comment is not closed');
          return false;
        }
        position = end + 3;
      } else if (text.startsWith('<?', position)) {
        const end = text.indexOf('?>', position);
        if (!/^<\?xml\s/.test(text.slice(position, position + 6)) || end < 0) {
          problems.push('processing instructions other than <?xml …?> are not allowed');
          return false;
        }
        position = end + 2;
      } else if (text.startsWith('<!', position)) {
        problems.push('<!DOCTYPE>, entity declarations and CDATA are not allowed');
        return false;
      } else {
        return true;
      }
    }
  };

  const readElement = (): RawElement | null => {
    position += 1;
    const tag = readName();
    const index = ++count;
    if (tag === null) {
      problems.push(`element ${String(index)}: not a valid element name`);
      return null;
    }
    const where = `<${tag}> (element ${String(index)})`;
    const attributes: (readonly [string, string])[] = [];
    for (;;) {
      skipSpace();
      if (text.startsWith('/>', position)) {
        position += 2;
        return { name: tag, attributes, children: [], index, hasText: false };
      }
      if (text.startsWith('>', position)) {
        position += 1;
        break;
      }
      const attribute = readName();
      skipSpace();
      if (attribute === null || text[position] !== '=') {
        problems.push(`${where}: an attribute is not written as name="value"`);
        return null;
      }
      position += 1;
      skipSpace();
      const quote = text[position];
      if (quote !== '"' && quote !== "'") {
        problems.push(`${where}: attribute "${attribute}" is not quoted`);
        return null;
      }
      const end = text.indexOf(quote, position + 1);
      if (end < 0) {
        problems.push(`${where}: attribute "${attribute}" is not closed`);
        return null;
      }
      const raw = text.slice(position + 1, end);
      if (raw.includes('<')) problems.push(`${where}: attribute "${attribute}" contains "<"`);
      attributes.push([attribute, decode(raw, where, problems)]);
      position = end + 1;
    }
    const element: RawElement = { name: tag, attributes, children: [], index, hasText: false };
    for (;;) {
      const next = text.indexOf('<', position);
      if (next < 0) {
        problems.push(`${where}: not closed`);
        return null;
      }
      if (text.slice(position, next).trim() !== '') element.hasText = true;
      position = next;
      if (text.startsWith('</', position)) {
        position += 2;
        const closing = readName();
        skipSpace();
        if (closing !== tag || text[position] !== '>') {
          problems.push(`${where}: closed by </${closing ?? ''}>`);
          return null;
        }
        position += 1;
        return element;
      }
      if (text.startsWith('<!--', position) || text.startsWith('<!', position) || text.startsWith('<?', position)) {
        if (!skipMisc()) return null;
        continue;
      }
      const child = readElement();
      if (child === null) return null;
      element.children.push(child);
    }
  };

  if (!skipMisc()) return null;
  if (!text.startsWith('<', position)) {
    problems.push('the text is not SVG markup');
    return null;
  }
  const root = readElement();
  if (root === null || !skipMisc()) return null;
  if (position < text.length) {
    problems.push('there is content after the closing </svg>');
    return null;
  }
  return root;
}

/** Reads `style="a: b; c: d"` into declarations; an empty declaration is skipped. */
function styleDeclarations(style: string): (readonly [string, string])[] {
  return style
    .split(';')
    .map((declaration) => declaration.trim())
    .filter((declaration) => declaration !== '')
    .map((declaration) => {
      const colon = declaration.indexOf(':');
      const property = (colon < 0 ? declaration : declaration.slice(0, colon)).trim().toLowerCase();
      const value =
        colon < 0
          ? ''
          : declaration
              .slice(colon + 1)
              .replace(/!important\s*$/i, '')
              .trim();
      return [property, value] as const;
    });
}

interface Context {
  readonly problems: string[];
  readonly ids: Set<string>;
  readonly references: { readonly id: string; readonly where: string }[];
}

/** Checks the references in one attribute value and records them; a reference outside the icon is a problem. */
function checkValue(attribute: string, value: string, where: string, context: Context): void {
  if (/javascript:/i.test(value)) {
    context.problems.push(`${where}: "${attribute}" contains a script URL`);
    return;
  }
  if (attribute === 'href') {
    if (!value.startsWith('#') || !idPattern.test(value.slice(1))) {
      context.problems.push(`${where}: href "${value}" points outside the icon; only #id references are allowed`);
    } else {
      context.references.push({ id: value.slice(1), where });
    }
    return;
  }
  if (!value.includes('url(')) return;
  const outside = value.replace(urlReference, '');
  if (!['fill', 'stroke', 'clip-path', 'mask'].includes(attribute) || outside.includes('url(')) {
    context.problems.push(
      `${where}: "${attribute}" refers outside the icon; only url(#id) paint and clipping are allowed`,
    );
    return;
  }
  for (const match of value.matchAll(urlReference)) context.references.push({ id: match[2] ?? '', where });
}

/**
 * Collects the attributes of one element: presentation attributes and `style` declarations the tag allows, with
 * `xlink:href` read as `href`. Returns null for an element hidden with `display: none`.
 */
function readAttributes(
  element: RawElement,
  allowed: readonly string[],
  ignored: ReadonlySet<string>,
  where: string,
  context: Context,
): Record<string, string> | null {
  const attributes: Record<string, string> = {};
  const declarations: (readonly [string, string])[] = [];
  for (const [rawName, value] of element.attributes) {
    const attribute = rawName === 'xlink:href' ? 'href' : rawName;
    if (
      ignored.has(attribute) ||
      attribute === 'xmlns' ||
      /^(?:xmlns|xml|sodipodi|inkscape):/.test(attribute) ||
      attribute.startsWith('data-')
    ) {
      continue;
    }
    if (attribute === 'style') {
      declarations.push(...styleDeclarations(value));
    } else if (attribute === 'display') {
      if (value.trim() === 'none') return null;
    } else if (attribute === 'class') {
      context.problems.push(
        `${where}: class needs a stylesheet, which an icon cannot carry; export with presentation attributes`,
      );
    } else if (/^on/i.test(attribute)) {
      context.problems.push(`${where}: event handler "${attribute}" is not allowed`);
    } else if (allowed.includes(attribute)) {
      attributes[attribute] = value.trim();
    } else {
      context.problems.push(`${where}: attribute "${attribute}" is not supported`);
    }
  }
  // Declarations of `style` override attributes, as CSS does.
  for (const [property, value] of declarations) {
    if (property === 'display') {
      if (value === 'none') return null;
    } else if (allowed.includes(property)) {
      attributes[property] = value;
    } else if (!inertStyle.test(property)) {
      context.problems.push(`${where}: style property "${property}" is not supported`);
    }
  }
  for (const [attribute, value] of Object.entries(attributes)) {
    checkValue(attribute, value, where, context);
    if (attribute === 'id') {
      if (!idPattern.test(value)) context.problems.push(`${where}: id "${value}" is not a valid name`);
      else if (context.ids.has(value)) context.problems.push(`${where}: id "${value}" is used twice`);
      else context.ids.add(value);
    }
  }
  return attributes;
}

/** Converts one raw element and its children into icon nodes; returns null for an element that is dropped. */
function toNode(element: RawElement, context: Context): IconNode | null {
  const where = `<${element.name}> (element ${String(element.index)})`;
  if (descriptions.has(element.name) || /^(?:sodipodi|inkscape):/.test(element.name)) return null;
  if (!isTag(element.name)) {
    const reason = refusals[element.name] ?? 'not an element an icon may contain';
    context.problems.push(`${where}: ${reason}`);
    return null;
  }
  if (element.hasText) context.problems.push(`${where}: text is not supported; convert it to outlines`);
  const attrs = readAttributes(element, tagAttributes[element.name], new Set(), where, context);
  if (attrs === null) return null;
  const tag = element.name;
  if (!containers.has(tag)) {
    for (const child of element.children) {
      context.problems.push(`<${child.name}> (element ${String(child.index)}): a <${tag}> has no children`);
    }
    return { tag, attrs };
  }
  const children = element.children.map((child) => toNode(child, context)).filter((node) => node !== null);
  return { tag, attrs, children };
}

/** Reads the coordinate system of the root: its viewBox, or its width and height in pixels. */
function viewBoxOf(root: RawElement, problems: string[]): string | null {
  const value = (attribute: string) => root.attributes.find(([name]) => name === attribute)?.[1];
  const box = value('viewBox');
  if (box !== undefined) {
    const numbers = box
      .trim()
      .split(/[\s,]+/)
      .map(Number);
    const [, , width = 0, height = 0] = numbers;
    if (numbers.length === 4 && numbers.every(Number.isFinite) && width > 0 && height > 0) return numbers.join(' ');
    problems.push(`<svg>: viewBox "${box}" is not four numbers with a positive width and height`);
    return null;
  }
  const size = (attribute: string) => Number((value(attribute) ?? '').replace(/px$/, ''));
  const width = size('width');
  const height = size('height');
  if (width > 0 && height > 0) return `0 0 ${String(width)} ${String(height)}`;
  problems.push('<svg>: needs a viewBox, or a width and height in pixels');
  return null;
}

/**
 * Reads an application's SVG into a drawing (ADR 0036). Any static SVG is accepted: shapes, groups, gradients, clip
 * paths, masks and references inside the icon, with presentation attributes or `style`. Scripts, style sheets,
 * classes, event handlers, embedded content, text, animation and references outside the icon are problems, all of
 * which are collected. Editor metadata (Inkscape, `<title>`, `<desc>`, `<metadata>`) is dropped.
 */
export function readSvg(source: string): SvgResult {
  const problems: string[] = [];
  const root = parseMarkup(source.replace(/^\uFEFF/, ''), problems);
  if (root === null) return { problems };
  if (root.name !== 'svg') return { problems: [`the root element is <${root.name}>, not <svg>`] };
  const context: Context = { problems, ids: new Set(), references: [] };
  const viewBox = viewBoxOf(root, problems);
  if (root.hasText) problems.push('<svg>: text is not supported; convert it to outlines');
  const paint = readAttributes(root, paintAttributes, new Set([...rootIgnored, 'viewBox']), '<svg>', context) ?? {};
  const nodes = root.children.map((child) => toNode(child, context)).filter((node) => node !== null);
  for (const { id, where } of context.references) {
    if (!context.ids.has(id)) problems.push(`${where}: refers to #${id}, which the icon does not define`);
  }
  if (nodes.length === 0) problems.push('<svg>: draws nothing');
  if (problems.length > 0 || viewBox === null) return { problems };
  return { drawing: { viewBox, paint, nodes } };
}
