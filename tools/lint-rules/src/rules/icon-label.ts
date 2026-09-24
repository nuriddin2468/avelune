// avelune/icon-label: every <ave-icon> is either named or decorative (brief §9.1, ADR 0033). An icon without either is
// an image a screen reader cannot name; one with both is a contradiction. AveIcon throws on both in development; this
// rule finds them before anything runs.
import { createRule } from './create-rule.ts';

interface Position {
  readonly line: number;
  readonly col: number;
}

/** The part of an angular-eslint template `Element` node this rule reads. */
interface TemplateElement {
  readonly name: string;
  readonly attributes: readonly { readonly name: string }[];
  readonly inputs: readonly { readonly name: string }[];
  readonly startSourceSpan: { readonly start: Position; readonly end: Position };
}

function isTemplateElement(node: unknown): node is TemplateElement {
  return (
    typeof node === 'object' &&
    node !== null &&
    typeof Reflect.get(node, 'name') === 'string' &&
    Array.isArray(Reflect.get(node, 'attributes')) &&
    Array.isArray(Reflect.get(node, 'inputs')) &&
    typeof Reflect.get(node, 'startSourceSpan') === 'object'
  );
}

export const iconLabel = createRule<[], 'missing' | 'both'>({
  meta: {
    type: 'problem',
    docs: { description: 'Every <ave-icon> needs a label or decorative, not both' },
    schema: [],
    messages: {
      missing:
        '<ave-icon> needs a label when it carries meaning, or decorative when the text next to it says the same.',
      both: '<ave-icon> is labelled and decorative at once; keep one.',
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      Element(node: unknown) {
        if (!isTemplateElement(node) || node.name !== 'ave-icon') return;
        const has = (list: readonly { readonly name: string }[], name: string) =>
          list.some((attribute) => attribute.name === name);
        const label = has(node.attributes, 'label') || has(node.inputs, 'label');
        const decorative = has(node.attributes, 'decorative') || has(node.inputs, 'decorative');
        // Two bindings may exclude each other at run time, where AveIcon checks them; two attributes cannot.
        const both = has(node.attributes, 'label') && has(node.attributes, 'decorative');
        if (label || decorative) {
          if (!both) return;
        }
        const { start, end } = node.startSourceSpan;
        context.report({
          loc: { start: { line: start.line + 1, column: start.col }, end: { line: end.line + 1, column: end.col } },
          messageId: both ? 'both' : 'missing',
        });
      },
    };
  },
});
