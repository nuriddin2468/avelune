// The ESLint settings that hold any application to the kit: the imports nobody may use and the template rules that keep
// screens accessible and on tokens. The kit's own config (eslint.config.mjs) and an application's
// (@avelune/eslint-config) take them from here, so the two cannot drift (ADR 0023, 0104).
import type { TSESLint } from '@typescript-eslint/utils';

const animations = '@angular/animations is deprecated and banned; motion is CSS plus animate.enter/leave (ADR 0005).';
const material = 'Angular Material is not used; behaviour comes from native HTML, Angular Aria and the CDK (ADR 0002).';

/** A `no-restricted-imports` option: banned paths and patterns, each with the reason. */
export interface RestrictedImports {
  readonly paths: readonly { readonly name: string; readonly message: string }[];
  readonly patterns: readonly (
    | { readonly group: readonly string[]; readonly message: string }
    | { readonly regex: string; readonly message: string }
  )[];
}

/** Imports nobody may use, and deep imports into @avelune/ui entry points (ADR 0001, 0002, 0005). */
export const restrictedImports: RestrictedImports = {
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

/**
 * Template rules beyond angular-eslint's `templateRecommended` and `templateAccessibility` that every screen follows:
 * no inline styles (brief §5.2), typed buttons, a natural tab order, and no attribute set twice.
 */
export const applicationTemplateRules = {
  '@angular-eslint/template/no-inline-styles': 'error',
  '@angular-eslint/template/button-has-type': 'error',
  '@angular-eslint/template/no-positive-tabindex': 'error',
  '@angular-eslint/template/no-duplicate-attributes': 'error',
  // An icon button has no content by design: its required `label` input is its name (ADR 0038). Every other
  // button, link and heading still needs content or one of the rule's default attributes.
  '@angular-eslint/template/elements-content': ['error', { allowList: ['aveIconButton'] }],
} satisfies TSESLint.FlatConfig.Rules;
