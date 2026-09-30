// The kit's public API as the committed API reports declare it (ADR 0007): each component and directive with its
// selector, the names its inputs and outputs have in a template and those its host directives add; and every export,
// with the fields of its interfaces (ADR 0101).

/** A component or a directive that an application places in a template. */
export interface KitComponent {
  /** The entry point that exports it: `accordion` for `@avelune/ui/accordion`. */
  readonly entry: string;
  readonly className: string;
  readonly selector: string;
  /** The names a template binds, the host directives' included. */
  readonly inputs: readonly string[];
  readonly outputs: readonly string[];
  /** Inputs and outputs a host directive adds under the kit's name, which Storybook's docgen does not list. */
  readonly hostInputs: readonly string[];
  readonly hostOutputs: readonly string[];
}

const DECLARATION = /ɵɵ(?:Component|Directive)Declaration</g;

/** The type arguments of a declaration, split at the top-level commas. */
function typeArguments(text: string, open: number): string[] {
  const args: string[] = [];
  let depth = 0;
  let start = open;
  let quote: string | undefined;
  for (let index = open; index < text.length; index++) {
    const char = text.charAt(index);
    if (quote !== undefined) {
      if (char === quote) quote = undefined;
      continue;
    }
    if (char === '"' || char === "'") quote = char;
    else if (char === '<' || char === '{' || char === '[' || char === '(') depth++;
    else if (char === '>' || char === '}' || char === ']' || char === ')') {
      if (depth === 0) {
        args.push(text.slice(start, index).trim());
        return args;
      }
      depth--;
    } else if (char === ',' && depth === 0) {
      args.push(text.slice(start, index).trim());
      start = index + 1;
    }
  }
  throw new Error('An unterminated declaration in an API report');
}

const names = (text: string, pattern: RegExp): string[] => [...text.matchAll(pattern)].map((match) => match[1] ?? '');

/** Every component and directive of one entry point's report (`avelune-ui-<entry>.api.md`). */
export function parseApiReport(entry: string, report: string): KitComponent[] {
  const components: KitComponent[] = [];
  for (const match of report.matchAll(DECLARATION)) {
    const args = typeArguments(report, match.index + match[0].length);
    const [type = '', selector = '', , inputs = '', outputs = ''] = args;
    const hostDirectives = args.length >= 9 ? (args[8] ?? '') : '';
    const className = type.replace(/<.*$/s, '');
    const hostInputs = [...hostDirectives.matchAll(/inputs: \{([^}]*)\}/g)].flatMap((block) =>
      names(block[1] ?? '', /"[^"]+": "([^"]+)"/g),
    );
    const hostOutputs = [...hostDirectives.matchAll(/outputs: \{([^}]*)\}/g)].flatMap((block) =>
      names(block[1] ?? '', /"[^"]+": "([^"]+)"/g),
    );
    components.push({
      entry,
      className,
      selector: selector.replace(/^"|"$/g, ''),
      inputs: [...names(inputs, /"alias": "([^"]+)"/g), ...hostInputs],
      outputs: [...names(outputs, /"[^"]+": "([^"]+)"/g), ...hostOutputs],
      hostInputs,
      hostOutputs,
    });
  }
  return components;
}

/** An export of an entry point that is not `@internal`: a class, a function, a constant, a type or an interface. */
export interface KitExport {
  readonly entry: string;
  readonly name: string;
  /** The fields and methods of an interface, which an application writes or reads; none for other exports. */
  readonly fields: readonly string[];
}

const EXPORT = /^export (?:declare )?(?:abstract )?(?:class|function|const|type|interface) (\w+)|^export \{ (\w+) \}/gm;

/** Every export of one entry point's report that is not `@internal`, with the fields of its interfaces. */
export function parseExports(entry: string, report: string): KitExport[] {
  const exports: KitExport[] = [];
  for (const match of report.matchAll(EXPORT)) {
    const name = match[1] ?? match[2] ?? '';
    const before = report.slice(0, match.index).trimEnd().split('\n').at(-1) ?? '';
    if (before.startsWith('// @internal')) continue;
    const fields: string[] = [];
    if (match[0].includes(' interface ')) {
      const end = report.indexOf('\n}', match.index);
      const body = report.slice(report.indexOf('{\n', match.index) + 2, end);
      // Members sit four spaces in; a member's own lines sit deeper.
      let internal = false;
      for (const line of body.split('\n')) {
        if (line.startsWith('    // @internal')) internal = true;
        const member = /^ {4}(?:readonly )?(\w+)\??[:(<]/.exec(line);
        if (member?.[1] === undefined) continue;
        if (!internal) fields.push(member[1]);
        internal = false;
      }
    }
    exports.push({ entry, name, fields });
  }
  return exports;
}

/** The entry point a report describes: `avelune-ui-date-picker.api.md` → `date-picker`; testing reports have none. */
export function reportEntry(fileName: string): string | undefined {
  const match = /^avelune-ui-(.+)\.api\.md$/.exec(fileName);
  if (match?.[1] === undefined || match[1].endsWith('-testing')) return undefined;
  return match[1];
}
