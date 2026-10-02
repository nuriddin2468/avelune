// @avelune/eslint-config: the kit's rules for an application's templates and imports (ADR 0023, 0104). The package's
// build bundles this file with the rules it imports into packages/eslint-config/dist/index.js; the settings it shares
// with eslint.config.mjs come from ../application-rules.ts, so the kit's own config and an application's cannot drift.
import type { TSESLint } from '@typescript-eslint/utils';
import angular from 'angular-eslint';
import type { ESLint, Linter } from 'eslint';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
// The rules for applications only: the kit's own rules (entry-point layers, public API docs) stay out of the bundle.
import { applicationTemplateRules, restrictedImports as restrictedImportsSource } from '../application-rules.ts';
import { kitElements as kitElementsSource } from '../kit-elements.ts';
import { iconLabel } from '../rules/icon-label.ts';
import { noRawElements } from '../rules/no-raw-elements.ts';

/** Options of {@link avelune}. */
export interface AveluneLintOptions {
  /**
   * Globs of code written before the kit, where its rules warn instead of failing until the code is migrated (the
   * adoption plan); every other file stays under errors. Example: `['src/app/legacy/**']`.
   */
  readonly legacy?: readonly string[];
}

/** A `no-restricted-imports` option: banned paths and patterns, each with the reason. */
export interface AveluneRestrictedImports {
  /** Import paths nobody may use. */
  readonly paths: readonly { readonly name: string; readonly message: string }[];
  /** Import patterns nobody may use: Angular Material's and the animations' entry points, deep kit imports. */
  readonly patterns: readonly (
    | { readonly group: readonly string[]; readonly message: string }
    | { readonly regex: string; readonly message: string }
  )[];
}

/** The native elements the kit replaces, and the kit attributes that make each one a kit element. */
export const kitElements: Readonly<Record<string, readonly string[]>> = kitElementsSource;

/**
 * The kit's `no-restricted-imports` option. A later config object's setting of a rule replaces an earlier one, so an
 * application with its own `no-restricted-imports` merges these paths and patterns into it.
 */
export const restrictedImports: AveluneRestrictedImports = restrictedImportsSource;

/** angular-eslint's processor, which lints a component's inline template as an HTML file. */
function inlineTemplates(): NonNullable<typeof angular.processInlineTemplates> {
  const processor = angular.processInlineTemplates;
  if (processor === undefined) {
    throw new Error('@avelune/eslint-config: angular-eslint no longer exports processInlineTemplates');
  }
  return processor;
}

const typescript = ['**/*.ts', '**/*.mts', '**/*.cts'];
const javascript = ['**/*.js', '**/*.mjs', '**/*.cjs'];

/**
 * The `avelune` plugin with the rules for applications. A rule written with `@typescript-eslint/utils` types its context
 * as typescript-eslint's, which ESLint's own plugin type does not accept, so the plugin is checked against
 * typescript-eslint's type and then asserted to ESLint's, as angular-eslint asserts its plugins. The package's tests run
 * both rules through ESLint.
 */
const plugin = {
  meta: { name: 'avelune' },
  rules: { 'icon-label': iconLabel, 'no-raw-elements': noRawElements },
} satisfies TSESLint.FlatConfig.Plugin as unknown as ESLint.Plugin;

/** A rule's setting at warning level, its options kept. */
function asWarning(setting: Linter.RuleEntry<unknown[]>): Linter.RuleEntry<unknown[]> {
  if (Array.isArray(setting)) {
    const [, ...options] = setting;
    return ['warn', ...options];
  }
  return setting === 'off' || setting === 0 ? setting : 'warn';
}

/**
 * The kit's ESLint config for an application: templates follow angular-eslint's recommended and accessibility rules,
 * name every icon and use the kit's elements; scripts never import Angular's animations, Angular Material or a kit
 * entry point's internals. TypeScript strictness and code style stay the application's.
 *
 * ```js
 * // eslint.config.mjs
 * import avelune from '@avelune/eslint-config';
 * import { defineConfig } from 'eslint/config';
 *
 * export default defineConfig(avelune({ legacy: ['src/app/legacy/**'] }));
 * ```
 */
export default function avelune(options: AveluneLintOptions = {}): Linter.Config[] {
  const configs = defineConfig(
    {
      name: 'avelune/inline-templates',
      files: typescript,
      processor: inlineTemplates(),
      languageOptions: { parser: tseslint.parser },
    },
    {
      name: 'avelune/imports',
      files: [...typescript, ...javascript],
      rules: { 'no-restricted-imports': ['error', restrictedImports] },
    },
    {
      name: 'avelune/templates',
      files: ['**/*.html'],
      extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
      plugins: { avelune: plugin },
      rules: {
        ...applicationTemplateRules,
        'avelune/icon-label': 'error',
        'avelune/no-raw-elements': ['error', { elements: kitElements }],
      },
    },
  );
  const legacy = options.legacy ?? [];
  if (legacy.length === 0) return configs;
  // Each config's rules again as warnings, for the files that match both a legacy glob and the config's own files.
  const warnings = configs.flatMap((config): Linter.Config[] => {
    const rules = Object.entries(config.rules ?? {}).flatMap(([name, setting]) =>
      setting === undefined ? [] : [[name, asWarning(setting)] as const],
    );
    if (rules.length === 0) return [];
    const files = config.files ?? ['**/*'];
    return [
      {
        name: `${config.name ?? 'avelune'}/legacy`,
        files: legacy.flatMap((glob) => files.map((pattern) => [glob, ...[pattern].flat()])),
        rules: Object.fromEntries(rules),
      },
    ];
  });
  return [...configs, ...warnings];
}
