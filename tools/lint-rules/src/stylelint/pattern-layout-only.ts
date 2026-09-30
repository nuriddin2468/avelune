// avelune/pattern-layout-only: a pattern places the kit's components in its template but never restyles them
// (ADR 0091). In a stylesheet of an entry point whose entry.json says `patterns`, a rule whose subject is a kit element
// (`ave-card`, `button[aveIconButton]`) may set layout properties only; a new look is a component's variant.
import stylelint, { type Rule } from 'stylelint';
import { entryLayerOf } from './entry-layer.ts';

const {
  createPlugin,
  utils: { report, ruleMessages, validateOptions },
} = stylelint;

export const ruleName = 'avelune/pattern-layout-only';

const messages = ruleMessages(ruleName, {
  rejected: (property: string, selector: string) =>
    `A pattern places kit elements but never restyles them: ${property} on "${selector}" is not a layout property (ADR 0091).`,
});

/** Where a component stands and how large it is: display, position and inset, grid and flex placement, margins, sizes. */
const layout = new Set([
  'display',
  'position',
  'inset',
  'inset-block',
  'inset-block-start',
  'inset-block-end',
  'inset-inline',
  'inset-inline-start',
  'inset-inline-end',
  'z-index',
  'grid-area',
  'grid-column',
  'grid-column-start',
  'grid-column-end',
  'grid-row',
  'grid-row-start',
  'grid-row-end',
  'order',
  'align-self',
  'justify-self',
  'place-self',
  'flex',
  'flex-grow',
  'flex-shrink',
  'flex-basis',
  'margin',
  'margin-block',
  'margin-block-start',
  'margin-block-end',
  'margin-inline',
  'margin-inline-start',
  'margin-inline-end',
  'inline-size',
  'min-inline-size',
  'max-inline-size',
  'block-size',
  'min-block-size',
  'max-block-size',
]);

/** The last compound of a selector: the element it selects (`button[aveIconButton].menu` of `.bar > button[…].menu`). */
function subject(selector: string): string {
  let flat = selector.trim();
  // Arguments of :not(), :is() and quoted attribute values may hold spaces and combinators.
  for (let previous = ''; previous !== flat;) {
    previous = flat;
    flat = flat.replace(/\([^()]*\)/g, '()');
  }
  flat = flat.replace(/"[^"]*"|'[^']*'/g, '""');
  return flat.split(/\s*[>+~]\s*|\s+/).at(-1) ?? '';
}

/** A kit component's element: an `ave-` element or an element with an `ave…` attribute. */
function isKitElement(compound: string): boolean {
  return /^ave-[a-z0-9]/i.test(compound) || /\[\s*ave[a-z]/i.test(compound);
}

interface Ancestor {
  readonly type: string;
  readonly selectors?: string[];
  readonly parent?: Ancestor | undefined;
}

/** Whether a rule selects a kit element; a nested `&…` rule selects its parent's element (ADR 0024). */
function selectsKitElement(node: Ancestor | undefined): string | undefined {
  if (node === undefined) return undefined;
  if (node.type !== 'rule') return selectsKitElement(node.parent);
  for (const selector of node.selectors ?? []) {
    const compound = subject(selector);
    if (compound.startsWith('&') ? selectsKitElement(node.parent) !== undefined : isKitElement(compound)) {
      return selector;
    }
  }
  return undefined;
}

const rule: Rule<true> = (primary) => (root, result) => {
  if (!validateOptions(result, ruleName, { actual: primary, possible: [true] })) return;
  if (entryLayerOf(root.source?.input.file) !== 'patterns') return;
  root.walkDecls((declaration) => {
    const property = declaration.prop.toLowerCase();
    if (layout.has(property)) return;
    const selector = selectsKitElement(declaration.parent);
    if (selector === undefined) return;
    report({
      result,
      ruleName,
      node: declaration,
      word: declaration.prop,
      message: messages.rejected,
      messageArgs: [declaration.prop, selector],
    });
  });
};

rule.ruleName = ruleName;
rule.messages = messages;

export const patternLayoutOnly = createPlugin(ruleName, rule);
