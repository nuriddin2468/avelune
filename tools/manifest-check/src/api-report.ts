// The kit's components and directives as the committed API reports declare them (ADR 0007): the class, its selector,
// the names its inputs and outputs have in a template, and those its host directives add.

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

/** The entry point a report describes: `avelune-ui-date-picker.api.md` → `date-picker`; testing reports have none. */
export function reportEntry(fileName: string): string | undefined {
  const match = /^avelune-ui-(.+)\.api\.md$/.exec(fileName);
  if (match?.[1] === undefined || match[1].endsWith('-testing')) return undefined;
  return match[1];
}
