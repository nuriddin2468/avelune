// Root ESLint flat config for the kit, its apps and tools (brief §5.2, ADR 0023). Every rule is an error: a warning
// that does not fail the build is a rule nobody follows. tools/lint-rules proves each group with a failing fixture.
import comments from '@eslint-community/eslint-plugin-eslint-comments/configs';
import js from '@eslint/js';
import nx from '@nx/eslint-plugin';
import angular from 'angular-eslint';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { kitElements, plugin as avelune } from './tools/lint-rules/src/index.ts';

/** Layers from lowest to highest. A project may depend only on its own layer or a lower one (ADR 0001). */
const layers = ['layer:tokens', 'layer:foundations', 'layer:components', 'layer:composites', 'layer:patterns'];

/** Which project tags may depend on which (ADR 0001). */
const depConstraints = [
  ...layers.map((layer, index) => ({ sourceTag: layer, onlyDependOnLibsWithTags: layers.slice(0, index + 1) })),
  { sourceTag: 'type:app', onlyDependOnLibsWithTags: layers },
  { sourceTag: 'type:tool', onlyDependOnLibsWithTags: ['layer:tokens', 'type:tool'] },
  { sourceTag: 'type:config', onlyDependOnLibsWithTags: ['layer:tokens', 'type:tool', 'type:config'] },
];

const animations = '@angular/animations is deprecated and banned; motion is CSS plus animate.enter/leave (ADR 0005).';
const material = 'Angular Material is not used; behaviour comes from native HTML, Angular Aria and the CDK (ADR 0002).';

/** Imports nobody may use, and deep imports into @avelune/ui entry points (ADR 0001, 0002, 0005). */
const restrictedImports = {
  paths: [
    { name: '@angular/animations', message: animations },
    { name: '@angular/platform-browser/animations', message: animations },
    { name: '@angular/platform-browser/animations/async', message: animations },
    { name: '@angular/material', message: material },
  ],
  patterns: [
    { group: ['@angular/animations/*'], message: animations },
    { group: ['@angular/material/*'], message: material },
    {
      regex: '^@avelune/ui/[^/]+/(?!testing$).+',
      message: 'Import @avelune/ui/<name> or @avelune/ui/<name>/testing; entry-point internals are private (ADR 0001).',
    },
  ],
};

/** Angular rules beyond `recommended` that encode brief §9.1 and ADR 0004 (signal API, host object, encapsulation). */
const angularRules = {
  '@angular-eslint/component-selector': [
    'error',
    [
      { type: 'element', prefix: 'ave', style: 'kebab-case' },
      { type: 'attribute', prefix: 'ave', style: 'camelCase' },
    ],
  ],
  '@angular-eslint/directive-selector': ['error', { type: 'attribute', prefix: 'ave', style: 'camelCase' }],
  '@angular-eslint/prefer-signals': 'error',
  '@angular-eslint/prefer-signal-model': 'error',
  '@angular-eslint/prefer-output-emitter-ref': 'error',
  '@angular-eslint/prefer-output-readonly': 'error',
  '@angular-eslint/prefer-host-metadata-property': 'error',
  '@angular-eslint/use-component-view-encapsulation': 'error',
  '@angular-eslint/use-lifecycle-interface': 'error',
  '@angular-eslint/no-attribute-decorator': 'error',
  '@angular-eslint/no-queries-metadata-property': 'error',
  '@angular-eslint/no-async-lifecycle-method': 'error',
  '@angular-eslint/no-lifecycle-call': 'error',
  '@angular-eslint/require-lifecycle-on-prototype': 'error',
  '@angular-eslint/computed-must-return': 'error',
  '@angular-eslint/reactive-context-must-read-signal': 'error',
  '@angular-eslint/contextual-decorator': 'error',
  '@angular-eslint/no-duplicates-in-metadata-arrays': 'error',
  '@angular-eslint/relative-url-prefix': 'error',
  '@angular-eslint/consistent-component-styles': 'error',
  '@angular-eslint/no-developer-preview': 'error',
  'no-restricted-syntax': [
    'error',
    {
      selector: "Property[key.name='encapsulation'] > MemberExpression[property.name=/^(None|ShadowDom)$/]",
      message:
        'Components use emulated encapsulation: None leaks styles, ShadowDom breaks focus and layers (ADR 0004).',
    },
    {
      selector: "CallExpression[callee.name='Component'] > ObjectExpression > Property[key.name='styles']",
      message:
        'Component styles live in a .css file next to the component (styleUrl), where Stylelint checks them (ADR 0024).',
    },
  ],
};

/** Template rules beyond `recommended` and `accessibility`: brief §5.2 (inline styles), typing and a11y. */
const templateRules = {
  '@angular-eslint/template/no-inline-styles': 'error',
  '@angular-eslint/template/button-has-type': 'error',
  '@angular-eslint/template/no-any': 'error',
  '@angular-eslint/template/no-non-null-assertion': 'error',
  '@angular-eslint/template/no-positive-tabindex': 'error',
  '@angular-eslint/template/no-duplicate-attributes': 'error',
  '@angular-eslint/template/no-interpolation-in-attributes': 'error',
  '@angular-eslint/template/no-nested-tags': 'error',
  '@angular-eslint/template/no-outerhtml': 'error',
  '@angular-eslint/template/no-empty-control-flow': 'error',
  '@angular-eslint/template/prefer-at-empty': 'error',
  '@angular-eslint/template/prefer-at-else': 'error',
  '@angular-eslint/template/prefer-contextual-for-variables': 'error',
  '@angular-eslint/template/prefer-self-closing-tags': 'error',
  '@angular-eslint/template/prefer-static-string-properties': 'error',
  '@angular-eslint/template/prefer-class-binding': 'error',
  '@angular-eslint/template/prefer-style-binding': 'error',
  '@angular-eslint/template/prefer-ngsrc': 'error',
  '@angular-eslint/template/require-switch-default': 'error',
};

export default defineConfig(
  {
    ignores: ['**/dist/**', '**/out-tsc/**', '**/.nx/**', '**/.angular/**', '**/coverage/**', '**/node_modules/**'],
  },
  {
    // Deliberate violations: each tool's own tests assert that its check rejects them (brief §5).
    ignores: ['tools/*/fixtures/**'],
  },
  {
    linterOptions: { reportUnusedDisableDirectives: 'error', reportUnusedInlineConfigs: 'error' },
  },
  js.configs.recommended,
  comments.recommended,
  {
    rules: {
      '@eslint-community/eslint-comments/require-description': ['error', { ignore: [] }],
      'no-restricted-imports': ['error', restrictedImports],
    },
  },
  {
    files: ['**/*.ts', '**/*.mts', '**/*.cts'],
    extends: [tseslint.configs.strictTypeChecked, angular.configs.tsRecommended],
    processor: angular.processInlineTemplates,
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      ...angularRules,
      // Numbers in template literals are unambiguous; every other non-string still has to be converted (ADR 0023).
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
      // node:test awaits the promises that describe() and it() return.
      '@typescript-eslint/no-floating-promises': [
        'error',
        {
          allowForKnownSafeCalls: [
            { from: 'package', package: 'node:test', name: ['describe', 'it', 'suite', 'test'] },
          ],
        },
      ],
      // Angular components, directives and services are decorated classes, often with an empty body.
      '@typescript-eslint/no-extraneous-class': ['error', { allowWithDecorator: true }],
    },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    plugins: { avelune },
    // Every template, the kit's own and the consumers': an icon is named or decorative (ADR 0033).
    rules: { ...templateRules, 'avelune/icon-label': 'error' },
  },
  {
    files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['**/*.ts', '**/*.mts', '**/*.cts', '**/*.js', '**/*.mjs', '**/*.cjs'],
    plugins: { '@nx': nx },
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: [],
          depConstraints,
        },
      ],
    },
  },
  {
    // Entry points of @avelune/ui import each other, and their own testing entry points, through their public
    // specifiers, as ng-packagr requires; avelune/entry-point-layers governs those imports (ADR 0023, 0026).
    files: ['packages/ui/**/*.ts'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allowCircularSelfDependency: true,
          allow: [],
          depConstraints,
        },
      ],
    },
  },
  {
    // The kit's own sources: layering between entry points, documented public API, no appearance inputs.
    files: ['packages/ui/**/*.ts'],
    ignores: ['packages/ui/schematics/**', 'packages/ui/**/*.spec.ts', 'packages/ui/**/*.stories.ts'],
    plugins: { avelune },
    rules: {
      'avelune/entry-point-layers': 'error',
      'avelune/public-api-jsdoc': 'error',
      'avelune/no-appearance-inputs': 'error',
    },
  },
  {
    files: ['packages/ui/**/*.spec.ts', 'packages/ui/**/*.stories.ts'],
    plugins: { avelune },
    rules: { 'avelune/entry-point-layers': 'error' },
  },
  {
    // The showcase is linted as a consumer: native elements the kit replaces need a kit directive (brief §5.2).
    files: ['apps/showcase/**/*.html'],
    plugins: { avelune },
    rules: { 'avelune/no-raw-elements': ['error', { elements: kitElements }] },
  },
  {
    // Documented exception (ADR 0023): the Foundations pages draw token swatches by binding token variables to
    // [style.*]. Static style attributes and [ngStyle] stay banned there too.
    files: ['apps/storybook/src/foundations/**/*.html'],
    rules: { '@angular-eslint/template/no-inline-styles': ['error', { allowBindToStyle: true }] },
  },
);
