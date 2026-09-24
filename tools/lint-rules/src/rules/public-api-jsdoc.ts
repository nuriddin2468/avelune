// avelune/public-api-jsdoc: every exported declaration of the kit, and every public member of it, carries a JSDoc
// block (brief §9.3). API Extractor cannot check this (its `ae-undocumented` is off, ADR 0007).
import { AST_NODE_TYPES, AST_TOKEN_TYPES, type TSESLint, type TSESTree } from '@typescript-eslint/utils';
import { createRule } from './create-rule.ts';

/** Members whose meaning comes from an Angular interface; documenting each implementation adds nothing. */
const interfaceMembers = new Set([
  'constructor',
  'ngOnChanges',
  'ngOnInit',
  'ngDoCheck',
  'ngAfterContentInit',
  'ngAfterContentChecked',
  'ngAfterViewInit',
  'ngAfterViewChecked',
  'ngOnDestroy',
  'writeValue',
  'registerOnChange',
  'registerOnTouched',
  'setDisabledState',
  'validate',
  'registerOnValidatorChange',
]);

type Member =
  | TSESTree.PropertyDefinition
  | TSESTree.MethodDefinition
  | TSESTree.AccessorProperty
  | TSESTree.TSAbstractPropertyDefinition
  | TSESTree.TSAbstractMethodDefinition
  | TSESTree.TSAbstractAccessorProperty;

/** True when a `/** … *\/` block ends right before the node or its first decorator, with only whitespace between. */
function hasJsDoc(sourceCode: Readonly<TSESLint.SourceCode>, node: TSESTree.Node): boolean {
  const decorators = 'decorators' in node ? node.decorators : [];
  const start = Math.min(node.range[0], ...decorators.map((decorator) => decorator.range[0]));
  const comment = sourceCode
    .getAllComments()
    .filter((candidate) => candidate.range[1] <= start)
    .at(-1);
  return (
    comment?.type === AST_TOKEN_TYPES.Block &&
    comment.value.startsWith('*') &&
    sourceCode.text.slice(comment.range[1], start).trim() === ''
  );
}

function nameOf(key: TSESTree.Node): string | null {
  if (key.type === AST_NODE_TYPES.Identifier) {
    return key.name;
  }
  return key.type === AST_NODE_TYPES.Literal && typeof key.value === 'string' ? key.value : null;
}

function declarationName(declaration: TSESTree.Node): string {
  if ('id' in declaration && declaration.id?.type === AST_NODE_TYPES.Identifier) {
    return declaration.id.name;
  }
  if (declaration.type === AST_NODE_TYPES.VariableDeclaration) {
    return declaration.declarations
      .map((declarator) => (declarator.id.type === AST_NODE_TYPES.Identifier ? declarator.id.name : '…'))
      .join(', ');
  }
  return 'default';
}

export const publicApiJsdoc = createRule<[], 'declaration' | 'member'>({
  meta: {
    type: 'suggestion',
    docs: { description: 'Exported declarations and their public members carry JSDoc' },
    schema: [],
    messages: {
      declaration: 'Exported {{name}} needs a JSDoc block: it is public API (brief §9.3).',
      member: 'Public member {{name}} needs a JSDoc block: it is public API (brief §9.3).',
    },
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode;

    function checkMember(member: Member | TSESTree.TSPropertySignature | TSESTree.TSMethodSignature): void {
      const name = member.key.type === AST_NODE_TYPES.PrivateIdentifier ? null : nameOf(member.key);
      const hidden =
        'accessibility' in member && (member.accessibility === 'private' || member.accessibility === 'protected');
      if (name === null || hidden || interfaceMembers.has(name) || hasJsDoc(sourceCode, member)) {
        return;
      }
      context.report({ node: member.key, messageId: 'member', data: { name } });
    }

    function checkBody(declaration: TSESTree.Node): void {
      if (declaration.type === AST_NODE_TYPES.ClassDeclaration) {
        for (const member of declaration.body.body) {
          if (member.type !== AST_NODE_TYPES.StaticBlock && member.type !== AST_NODE_TYPES.TSIndexSignature) {
            checkMember(member);
          }
        }
      } else if (declaration.type === AST_NODE_TYPES.TSInterfaceDeclaration) {
        for (const member of declaration.body.body) {
          if (member.type === AST_NODE_TYPES.TSPropertySignature || member.type === AST_NODE_TYPES.TSMethodSignature) {
            checkMember(member);
          }
        }
      } else if (
        declaration.type === AST_NODE_TYPES.TSTypeAliasDeclaration &&
        declaration.typeAnnotation.type === AST_NODE_TYPES.TSTypeLiteral
      ) {
        for (const member of declaration.typeAnnotation.members) {
          if (member.type === AST_NODE_TYPES.TSPropertySignature || member.type === AST_NODE_TYPES.TSMethodSignature) {
            checkMember(member);
          }
        }
      }
    }

    function checkExport(node: TSESTree.ExportNamedDeclaration | TSESTree.ExportDefaultDeclaration): void {
      const { declaration } = node;
      if (declaration === null) {
        return;
      }
      if (!hasJsDoc(sourceCode, node) && !hasJsDoc(sourceCode, declaration)) {
        context.report({ node, messageId: 'declaration', data: { name: declarationName(declaration) } });
      }
      checkBody(declaration);
    }

    return {
      ExportNamedDeclaration: checkExport,
      ExportDefaultDeclaration: checkExport,
    };
  },
});
