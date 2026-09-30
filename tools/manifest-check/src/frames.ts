// The components a story file declares for itself: frames that lay stories out, which a snippet must never show.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import type { Frames } from './check.ts';

/**
 * The selectors and class names of the components and directives declared in `source`, a story file. Read from its
 * syntax, so a whole component written inside a snippet's string is not one (ADR 0101).
 */
export function framesOf(source: string): Frames {
  const file = ts.createSourceFile('frames.stories.ts', source, ts.ScriptTarget.Latest, true);
  const selectors: string[] = [];
  const classNames: string[] = [];
  const visit = (node: ts.Node): void => {
    if (ts.isClassDeclaration(node) && node.name !== undefined) {
      const call = ts
        .getDecorators(node)
        ?.map((decorator) => decorator.expression)
        .find(
          (expression): expression is ts.CallExpression =>
            ts.isCallExpression(expression) &&
            ts.isIdentifier(expression.expression) &&
            ['Component', 'Directive'].includes(expression.expression.text),
        );
      if (call !== undefined) {
        classNames.push(node.name.text);
        const [config] = call.arguments;
        for (const property of config !== undefined && ts.isObjectLiteralExpression(config) ? config.properties : []) {
          if (
            ts.isPropertyAssignment(property) &&
            property.name.getText(file) === 'selector' &&
            ts.isStringLiteralLike(property.initializer)
          ) {
            selectors.push(property.initializer.text);
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  return { selectors, classNames };
}

/** Every frame of the kit's story files under `packages/ui`. */
export function kitFrames(uiRoot: string): Frames {
  const selectors: string[] = [];
  const classNames: string[] = [];
  for (const entry of readdirSync(uiRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    for (const file of readdirSync(join(uiRoot, entry.name))) {
      if (!file.endsWith('.stories.ts')) continue;
      const frames = framesOf(readFileSync(join(uiRoot, entry.name, file), 'utf8'));
      selectors.push(...frames.selectors);
      classNames.push(...frames.classNames);
    }
  }
  return { selectors, classNames };
}
