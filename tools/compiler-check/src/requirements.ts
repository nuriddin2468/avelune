// The compiler strictness every tsconfig in the workspace must resolve to (brief §5.1, ADR 0022).
// tsconfig.base.json sets these; `check` fails on any tsconfig that resolves to something weaker, and the fixtures in
// fixtures/violations prove that each of them rejects a violation.
import type { AngularCompilerOptions } from '@angular/compiler-cli';

/** TypeScript options with the value they must have. */
export const requiredCompilerOptions = {
  strict: true,
  noUncheckedIndexedAccess: true,
  noImplicitOverride: true,
  noPropertyAccessFromIndexSignature: true,
  exactOptionalPropertyTypes: true,
  noImplicitReturns: true,
  noFallthroughCasesInSwitch: true,
  allowUnreachableCode: false,
} as const satisfies AngularCompilerOptions;

/** The flags `strict` turns on (TypeScript 6.0). Each can be switched off on its own, so none may be `false`. */
export const strictFlags = [
  'noImplicitAny',
  'strictNullChecks',
  'strictFunctionTypes',
  'strictBindCallApply',
  'strictPropertyInitialization',
  'strictBuiltinIteratorReturn',
  'noImplicitThis',
  'useUnknownInCatchVariables',
] as const satisfies readonly (keyof AngularCompilerOptions)[];

/** Angular compiler options with the value they must have. */
export const requiredAngularOptions = {
  strictTemplates: true,
  strictInputAccessModifiers: true,
  strictInjectionParameters: true,
  strictStandalone: true,
  typeCheckHostBindings: true,
} as const satisfies AngularCompilerOptions;

/** The flags `strictTemplates` turns on (Angular 22.1). Each can be switched off on its own, so none may be `false`. */
export const strictTemplatesFlags = [
  'strictInputTypes',
  'strictNullInputTypes',
  'strictAttributeTypes',
  'strictSafeNavigationTypes',
  'strictDomLocalRefTypes',
  'strictOutputEventTypes',
  'strictDomEventTypes',
  'strictContextGenerics',
  'strictLiteralTypes',
] as const satisfies readonly (keyof AngularCompilerOptions)[];

/** Every extended template diagnostic must be an error: `defaultCategory` and each entry of `checks`. */
export const requiredDiagnosticCategory = 'error';

/** Everything a violation fixture must prove: each option above, and each extended diagnostic of the compiler. */
export function provableOptions(): readonly string[] {
  return [
    ...Object.keys(requiredCompilerOptions).filter((option) => option !== 'strict'),
    ...strictFlags,
    ...Object.keys(requiredAngularOptions).filter((option) => option !== 'strictTemplates'),
    ...strictTemplatesFlags,
  ];
}
