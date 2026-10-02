// @avelune/stylelint-config: the kit's rules for an application's CSS (ADR 0024, 0104). The package's build bundles this
// file with the rules it imports into packages/stylelint-config/dist/index.js; the rules it shares with
// stylelint.config.mjs come from ../stylelint/application-rules.ts, so the kit's own config and an application's cannot
// drift.
import { createRequire } from 'node:module';
import type { Config } from 'stylelint';
import strictValue from 'stylelint-declaration-strict-value';
import logicalCss from 'stylelint-plugin-logical-css';
import { applicationRules } from '../stylelint/application-rules.ts';
import { knownTokens } from '../stylelint/known-tokens.ts';
import { mediaQueryTokens } from '../stylelint/media-query-tokens.ts';
import { nestingSameElement } from '../stylelint/nesting-same-element.ts';
import { noTokenDeclarations } from '../stylelint/no-token-declarations.ts';

/** The kit's tokens.css, from the @avelune/tokens this package depends on. */
const tokensCss = createRequire(import.meta.url).resolve('@avelune/tokens/tokens.css');

/**
 * The kit's Stylelint config for an application: values from tokens only, no `!important`, id selectors or
 * `::ng-deep`, motion and the focus ring left to the kit, logical properties, query widths that equal the kit's
 * breakpoints, and `--ave-*` names that are tokens and never declared. The application's own custom properties are
 * its own; formatting is its choice.
 *
 * ```js
 * // stylelint.config.mjs
 * export default {
 *   extends: ['@avelune/stylelint-config'],
 *   // Code written before the kit warns until it is migrated (the adoption plan).
 *   overrides: [{ files: ['src/app/legacy/**'], defaultSeverity: 'warning' }],
 * };
 * ```
 */
const config: Config = {
  plugins: [strictValue, ...logicalCss, mediaQueryTokens, nestingSameElement, noTokenDeclarations, knownTokens],
  defaultSeverity: 'error',
  reportDescriptionlessDisables: true,
  reportInvalidScopeDisables: true,
  reportNeedlessDisables: true,
  rules: {
    ...applicationRules(tokensCss),
    'avelune/no-token-declarations': true,
    'avelune/known-tokens': [true, { tokens: tokensCss }],
  },
};

export default config;
