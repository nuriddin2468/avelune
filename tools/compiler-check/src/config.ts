// Resolves a tsconfig the way ngc does (extends chain, angularCompilerOptions included) and reports every option
// that is weaker than the requirements.
import { readConfiguration, type AngularCompilerOptions } from '@angular/compiler-cli';
import { globSync } from 'node:fs';
import { basename, join, relative } from 'node:path';
import ts from 'typescript';
import {
  requiredAngularOptions,
  requiredCompilerOptions,
  requiredDiagnosticCategory,
  strictFlags,
  strictTemplatesFlags,
} from './requirements.ts';

export interface Finding {
  /** Path relative to the workspace root. */
  readonly file: string;
  /** The option at fault, e.g. `strictNullChecks` or `extendedDiagnostics.checks.unusedLetDeclaration`. */
  readonly option: string;
  readonly message: string;
}

/** "No inputs were found" and "files list is empty": irrelevant to the options, and expected of a base config. */
const noInputs = new Set([18002, 18003]);

/** Folders that never hold a tsconfig of the workspace. Fixtures are deliberate violations, checked by the tests. */
const skipped = new Set(['node_modules', 'dist', 'out-tsc', 'coverage', 'tmp', 'fixtures', '.git', '.nx', '.angular']);

/** Every tsconfig*.json in the workspace, as paths relative to `root`, sorted. */
export function findConfigs(root: string): readonly string[] {
  return globSync('**/tsconfig*.json', {
    cwd: root,
    exclude: (path: string) => skipped.has(basename(path)),
  }).sort();
}

function mismatches(
  options: AngularCompilerOptions,
  required: Readonly<Record<string, boolean>>,
): readonly Omit<Finding, 'file'>[] {
  return Object.entries(required).flatMap(([option, value]) => {
    const actual: unknown = options[option];
    return actual === value
      ? []
      : [{ option, message: `${option} is ${actual === undefined ? 'not set' : String(actual)}; required: ${value}` }];
  });
}

function notFalse(options: AngularCompilerOptions, flags: readonly string[], parent: string) {
  return flags
    .filter((option) => options[option] === false)
    .map((option) => ({ option, message: `${option} is false; ${parent} requires it` }));
}

function diagnostics(options: AngularCompilerOptions): readonly Omit<Finding, 'file'>[] {
  const { defaultCategory, checks = {} } = options.extendedDiagnostics ?? {};
  const findings: Omit<Finding, 'file'>[] = [];
  if (defaultCategory !== requiredDiagnosticCategory) {
    findings.push({
      option: 'extendedDiagnostics.defaultCategory',
      message: `extendedDiagnostics.defaultCategory is ${defaultCategory ?? 'not set'}; required: ${requiredDiagnosticCategory}`,
    });
  }
  for (const [check, category] of Object.entries(checks)) {
    if (category !== requiredDiagnosticCategory) {
      findings.push({
        option: `extendedDiagnostics.checks.${check}`,
        message: `extendedDiagnostics.checks.${check} is ${category}; every extended diagnostic must be an ${requiredDiagnosticCategory}`,
      });
    }
  }
  return findings;
}

/** The findings of one tsconfig; `project` is an absolute path. */
export function checkConfig(project: string, root: string): readonly Finding[] {
  const file = relative(root, project);
  const { options, errors } = readConfiguration(project);
  const problems = errors
    .filter((error) => !noInputs.has(error.code))
    .map((error) => ({ option: '', message: ts.flattenDiagnosticMessageText(error.messageText, '\n') }));
  return [
    ...problems,
    ...mismatches(options, requiredCompilerOptions),
    ...notFalse(options, strictFlags, 'strict'),
    ...mismatches(options, requiredAngularOptions),
    ...notFalse(options, strictTemplatesFlags, 'strictTemplates'),
    ...diagnostics(options),
  ].map((finding) => ({ file, ...finding }));
}

/** The findings of every tsconfig in the workspace. */
export function checkWorkspace(root: string): {
  readonly configs: readonly string[];
  readonly findings: readonly Finding[];
} {
  const configs = findConfigs(root);
  return { configs, findings: configs.flatMap((config) => checkConfig(join(root, config), root)) };
}
