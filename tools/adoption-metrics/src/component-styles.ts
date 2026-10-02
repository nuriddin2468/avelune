// The `styles` of a component, read from its TypeScript source with TypeScript's parser (ADR 0105): each literal as
// CSS to lint, and a count of those with an interpolation, which cannot be linted as written.
import ts from 'typescript';

/** A component file's literal styles, and how many styles it has with an interpolation. */
export interface ComponentStyles {
  readonly styles: readonly string[];
  readonly dynamic: number;
}

/** The literal text of a `styles` entry, `null` for one with an interpolation, `undefined` for anything else. */
function literal(node: ts.Node): string | null | undefined {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isTemplateExpression(node)) return null;
  return undefined;
}

/** The `styles` of every `@Component({ … })` in a file. */
export function componentStyles(source: string, file: string): ComponentStyles {
  const sourceFile = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
  const styles: string[] = [];
  let dynamic = 0;
  const take = (node: ts.Node) => {
    const text = literal(node);
    if (text === null) dynamic++;
    else if (text !== undefined) styles.push(text);
  };
  const visit = (node: ts.Node): void => {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'Component') {
      const [metadata] = node.arguments;
      if (metadata !== undefined && ts.isObjectLiteralExpression(metadata)) {
        for (const property of metadata.properties) {
          if (!ts.isPropertyAssignment(property) || property.name.getText(sourceFile) !== 'styles') continue;
          const value = property.initializer;
          if (ts.isArrayLiteralExpression(value)) value.elements.forEach(take);
          else take(value);
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return { styles, dynamic };
}
