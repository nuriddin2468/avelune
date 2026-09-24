// avelune/no-appearance-inputs: kit components expose variant, size and state, never free-form appearance inputs
// (brief §9.1, AGENTS.md non-negotiable 7). A new look is a new variant through an RFC.
import { AST_NODE_TYPES, type TSESTree } from '@typescript-eslint/utils';
import { createRule } from './create-rule.ts';

/** Input names that hand appearance to the consumer, compared case-insensitively. */
const appearanceNames = new Set([
  'class',
  'classname',
  'style',
  'styles',
  'color',
  'colour',
  'ngclass',
  'ngstyle',
  'appearance',
]);

/** For `input(…)`, `input.required(…)`, `model(…)` and `model.required(…)`: the argument holding the options. */
function signalInput(value: TSESTree.Expression | null): { readonly options: TSESTree.Node | undefined } | null {
  if (value?.type !== AST_NODE_TYPES.CallExpression) {
    return null;
  }
  const { callee } = value;
  if (callee.type === AST_NODE_TYPES.Identifier && (callee.name === 'input' || callee.name === 'model')) {
    return { options: value.arguments[1] };
  }
  if (
    callee.type === AST_NODE_TYPES.MemberExpression &&
    callee.object.type === AST_NODE_TYPES.Identifier &&
    (callee.object.name === 'input' || callee.object.name === 'model') &&
    callee.property.type === AST_NODE_TYPES.Identifier &&
    callee.property.name === 'required'
  ) {
    return { options: value.arguments[0] };
  }
  return null;
}

function aliasOf(options: TSESTree.Node | undefined): string | null {
  if (options?.type !== AST_NODE_TYPES.ObjectExpression) {
    return null;
  }
  for (const property of options.properties) {
    if (
      property.type === AST_NODE_TYPES.Property &&
      property.key.type === AST_NODE_TYPES.Identifier &&
      property.key.name === 'alias' &&
      property.value.type === AST_NODE_TYPES.Literal &&
      typeof property.value.value === 'string'
    ) {
      return property.value.value;
    }
  }
  return null;
}

export const noAppearanceInputs = createRule<[], 'appearance'>({
  meta: {
    type: 'problem',
    docs: { description: 'Components expose variant, size and state, not appearance inputs' },
    schema: [],
    messages: {
      appearance:
        'Input "{{name}}" hands appearance to the consumer. Expose variant, size and state only; a new look is a new variant through an RFC (brief §9.1).',
    },
  },
  defaultOptions: [],
  create(context) {
    return {
      PropertyDefinition(node) {
        const call = signalInput(node.value);
        if (call === null) {
          return;
        }
        const names = [node.key.type === AST_NODE_TYPES.Identifier ? node.key.name : null, aliasOf(call.options)];
        for (const name of names) {
          if (name !== null && appearanceNames.has(name.toLowerCase())) {
            context.report({ node: node.key, messageId: 'appearance', data: { name } });
          }
        }
      },
    };
  },
});
