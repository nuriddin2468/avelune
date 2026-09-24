// avelune/no-raw-elements: in consumer templates, a native element the kit replaces must carry a kit directive
// (brief §5.2). `<button>` without `aveButton` looks and behaves unlike every other product on the kit.
import { createRule } from './create-rule.ts';

/** Kit attributes that make a native element a kit element, per element name. An empty list bans the element. */
export type RawElementMarkers = Readonly<Record<string, readonly string[]>>;

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

export const noRawElements = createRule<[{ readonly elements: RawElementMarkers }], 'needsMarker' | 'replaced'>({
  meta: {
    type: 'problem',
    docs: { description: 'Native elements that the kit replaces must carry a kit directive' },
    schema: [
      {
        type: 'object',
        properties: {
          elements: {
            type: 'object',
            additionalProperties: { type: 'array', items: { type: 'string' }, uniqueItems: true },
          },
        },
        required: ['elements'],
        additionalProperties: false,
      },
    ],
    messages: {
      needsMarker: 'Raw <{{element}}>: add a kit directive ({{markers}}) so it looks and behaves like the kit.',
      replaced: 'Raw <{{element}}> is not allowed: use the Avelune component that replaces it.',
    },
  },
  defaultOptions: [{ elements: {} }],
  create(context, [{ elements }]) {
    return {
      Element(node: unknown) {
        if (!isTemplateElement(node)) {
          return;
        }
        const markers = elements[node.name.toLowerCase()];
        if (markers === undefined) {
          return;
        }
        const names = new Set([...node.attributes, ...node.inputs].map((attribute) => attribute.name));
        if (markers.some((marker) => names.has(marker))) {
          return;
        }
        const { start, end } = node.startSourceSpan;
        context.report({
          loc: { start: { line: start.line + 1, column: start.col }, end: { line: end.line + 1, column: end.col } },
          messageId: markers.length > 0 ? 'needsMarker' : 'replaced',
          data: { element: node.name, markers: markers.join(', ') },
        });
      },
    };
  },
});
