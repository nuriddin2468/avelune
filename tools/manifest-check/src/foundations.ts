// The token reference of the Foundations docs pages (ADR 0102): between `{/* tokens:<group> */}` and `{/* /tokens */}`,
// a table of the group's tokens generated from `@avelune/tokens`, so the MDX an agent reads names every token.

/** A public token as its reference shows it. */
export interface ReferenceToken {
  readonly name: string;
  readonly cssVar: string;
  readonly css: string;
  readonly dark?: string;
  readonly compact?: string;
  readonly reduced?: string;
  readonly description?: string;
}

const MARKER = /\{\/\* tokens:([a-z0-9.-]+) \*\/\}\n[\s\S]*?\{\/\* \/tokens \*\/\}/g;
const OPENING = /\{\/\* tokens:([a-z0-9.-]+) \*\/\}/g;

/** The tokens of a group: `color.bg` holds `color.bg.canvas`, not `color.bg-x`. */
export function tokensOf(group: string, tokens: readonly ReferenceToken[]): ReferenceToken[] {
  return tokens.filter((token) => token.name === group || token.name.startsWith(`${group}.`));
}

/** Text an MDX table cell can hold as prose: no column breaks, no JSX. */
function prose(text: string): string {
  return text
    .replace(/\|/g, '\\|')
    .replace(/[{}]/g, (brace) => `\\${brace}`)
    .replace(/</g, '&lt;');
}

const code = (text: string): string => `\`${text.replace(/\|/g, '\\|')}\``;

/** The longest line of a value in a table cell: a code span does not wrap, and a longer one widens the page. */
const LINE = 40;

/** A value as code, broken after its commas into lines of at most 40 characters where it is longer. */
function value(text: string): string {
  if (text.length <= LINE) return code(text);
  const lines: string[] = [];
  for (const part of text.split(/(?<=,) /)) {
    const last = lines.at(-1);
    if (last !== undefined && last.length + 1 + part.length <= LINE) lines[lines.length - 1] = `${last} ${part}`;
    else lines.push(part);
  }
  return lines.map(code).join('<br />');
}

/** The reference table of a group's tokens, with a column for each mode one of them changes in. */
export function tokenTable(tokens: readonly ReferenceToken[]): string {
  const modes = (
    [
      ['dark', 'Dark'],
      ['compact', 'Compact'],
      ['reduced', 'Reduced motion'],
    ] as const
  ).filter(([mode]) => tokens.some((token) => token[mode] !== undefined));
  const header = ['Token', 'CSS variable', 'Value', ...modes.map(([, title]) => title), 'Description'];
  const rows = tokens.map((token) => [
    code(token.name),
    code(token.cssVar),
    value(token.css),
    ...modes.map(([mode]) => {
      const css = token[mode];
      return css === undefined ? '' : value(css);
    }),
    prose(token.description ?? ''),
  ]);
  return [header, header.map(() => '---'), ...rows].map((cells) => `| ${cells.join(' | ')} |`).join('\n');
}

/** The groups a page's markers name, in order. */
export function groupsOf(mdx: string): string[] {
  return [...mdx.matchAll(OPENING)].map((match) => match[1] ?? '');
}

/** The page with every marked table regenerated from the tokens. */
export function fillTables(mdx: string, tokens: readonly ReferenceToken[]): string {
  return mdx.replace(
    MARKER,
    (_whole, group: string) => `{/* tokens:${group} */}\n\n${tokenTable(tokensOf(group, tokens))}\n\n{/* /tokens */}`,
  );
}

/** What is wrong with the pages' markers: a group without tokens, or a token in no group. */
export function referenceProblems(pages: ReadonlyMap<string, string>, tokens: readonly ReferenceToken[]): string[] {
  const problems: string[] = [];
  const groups = [...pages].flatMap(([page, mdx]) => groupsOf(mdx).map((group) => ({ page, group })));
  for (const { page, group } of groups) {
    if (tokensOf(group, tokens).length === 0) problems.push(`${page}: the group "${group}" holds no token`);
  }
  for (const [page, mdx] of pages) {
    const closed = [...mdx.matchAll(MARKER)].length;
    if (closed !== groupsOf(mdx).length) problems.push(`${page}: a {/* tokens:… */} marker has no {/* /tokens */}`);
  }
  for (const token of tokens) {
    if (!groups.some(({ group }) => tokensOf(group, [token]).length > 0)) {
      problems.push(`the token ${token.name} is in no group of a Foundations docs page: add it to one`);
    }
  }
  return problems;
}
