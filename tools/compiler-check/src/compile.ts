// Compiles a project with the Angular compiler, exactly as `ngc -p <project> --noEmit` would, and returns every
// diagnostic. Used by the tests to prove that the required options reject each violation fixture.
import { performCompilation, readConfiguration, type Program } from '@angular/compiler-cli';
import { relative } from 'node:path';
import ts from 'typescript';

export interface CompilerDiagnostic {
  /** Path relative to the project's folder; empty for a diagnostic without a file. */
  readonly file: string;
  /** 1-based line; 0 without a file. */
  readonly line: number;
  /** `TS2322` for TypeScript, `NG8101` for Angular. */
  readonly code: string;
  readonly category: 'error' | 'warning' | 'suggestion' | 'message';
  readonly message: string;
}

const categories = {
  [ts.DiagnosticCategory.Error]: 'error',
  [ts.DiagnosticCategory.Warning]: 'warning',
  [ts.DiagnosticCategory.Suggestion]: 'suggestion',
  [ts.DiagnosticCategory.Message]: 'message',
} as const satisfies Record<ts.DiagnosticCategory, CompilerDiagnostic['category']>;

/** Angular reports its own codes as `-99` followed by the code (`ngErrorCode`); ngc prints them as `NG` + code. */
export function formatCode(code: number): string {
  const text = String(code);
  return text.startsWith('-99') ? `NG${text.slice(3)}` : `TS${text}`;
}

/**
 * Every phase, even after an earlier one reported errors. ngc stops at the first phase with errors, which would hide
 * the template diagnostics of one fixture behind the TypeScript error of another.
 */
function gatherAll(program: Program): readonly ts.Diagnostic[] {
  return [
    ...program.getTsOptionDiagnostics(),
    ...program.getNgOptionDiagnostics(),
    ...program.getTsSyntacticDiagnostics(),
    ...program.getTsSemanticDiagnostics(),
    ...program.getNgStructuralDiagnostics(),
    ...program.getNgSemanticDiagnostics(),
  ];
}

export function compile(project: string): readonly CompilerDiagnostic[] {
  const config = readConfiguration(project);
  const diagnostics =
    config.errors.length > 0
      ? config.errors
      : performCompilation({
          rootNames: config.rootNames,
          options: { ...config.options, noEmit: true },
          emitFlags: config.emitFlags,
          gatherDiagnostics: gatherAll,
        }).diagnostics;
  const basePath = config.options.basePath ?? process.cwd();
  return diagnostics.map((diagnostic) => {
    const line =
      diagnostic.file && diagnostic.start !== undefined
        ? diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start).line + 1
        : 0;
    return {
      file: diagnostic.file ? relative(basePath, diagnostic.file.fileName) : '',
      line,
      code: formatCode(diagnostic.code),
      category: categories[diagnostic.category],
      message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'),
    };
  });
}

/**
 * Every extended template diagnostic the installed compiler knows. The list is not exported, so it is read from the
 * compiler's own message for an unknown check name, which `project` (fixtures/diagnostic-names) configures.
 */
export function knownExtendedDiagnostics(project: string): readonly string[] {
  const [message] = compile(project)
    .filter((diagnostic) => diagnostic.message.includes('has an unknown check: "compilerCheckProbe"'))
    .map((diagnostic) => diagnostic.message);
  const list = message?.split('Allowed check names are:')[1];
  if (list === undefined) {
    throw new Error(`the compiler did not list its extended diagnostics for ${project}`);
  }
  return list
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .sort();
}
