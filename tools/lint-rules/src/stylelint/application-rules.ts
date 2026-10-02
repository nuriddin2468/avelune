// The Stylelint rules that hold any CSS to the kit's tokens, its motion catalog and its focus ring: the kit's own
// (stylelint.config.mjs) and an application's (@avelune/stylelint-config) take them from here, so the two cannot
// drift (ADR 0024, 0104).
import type { Config } from 'stylelint';

/** Length and time units that only tokens may carry. %, fr, deg and logical viewport units stay allowed. */
const tokenUnits = [
  'px',
  'rem',
  'em',
  'ex',
  'ch',
  'cap',
  'ic',
  'lh',
  'rlh',
  'pt',
  'pc',
  'cm',
  'mm',
  'in',
  'q',
  'ms',
  's',
];

/** Colour constructors and easing functions: a raw colour or curve is always a missing token. */
const rawFunctions = [
  'rgb',
  'rgba',
  'hsl',
  'hsla',
  'hwb',
  'lab',
  'lch',
  'oklab',
  'oklch',
  'color',
  'color-mix',
  'cubic-bezier',
  'linear',
  'steps',
];

/** Motion shorthands hide their parts from strict values; the focus ring's properties belong to focus.css alone. */
export const motionShorthands = ['transition', 'animation'];
const focusRing = ['outline', 'outline-color', 'outline-style', 'outline-width', 'outline-offset'];

/** Keywords allowed in place of a token, including the system colours that forced-colors styles need. */
export const keywords = [
  '0',
  'auto',
  'none',
  'inherit',
  'initial',
  'unset',
  'revert',
  'transparent',
  'currentColor',
  '/^(Canvas|CanvasText|LinkText|VisitedText|ActiveText|ButtonFace|ButtonText|ButtonBorder|Field|FieldText|Highlight|HighlightText|SelectedItem|SelectedItemText|Mark|MarkText|GrayText|AccentColor|AccentColorText)$/',
];

/** Properties that take only a token or one of `allowed` (brief §5.3). */
export function strictValues(allowed: readonly string[]): [string[], Record<string, unknown>] {
  return [
    [
      '/color$/',
      'fill',
      'stroke',
      '/^font(-family|-size|-weight)?$/',
      'line-height',
      '/radius$/',
      'box-shadow',
      'z-index',
      '/^(transition|animation)-(duration|timing-function|delay)$/',
      '/^(margin|padding)(-|$)/',
      '/gap$/',
    ],
    { ignoreValues: allowed, expandShorthand: true, disableFix: true },
  ];
}

/**
 * Physical properties and keywords that stay allowed because their logical form is missing at the browser floor.
 * logical.spec.ts derives both lists from MDN browser-compat-data and .browserslistrc and fails if they drift.
 */
const physicalKeywords = ['caption-side', 'offset-anchor', 'offset-position'];
const physicalProperties = ['overflow-x', 'overflow-y', 'overscroll-behavior-x', 'overscroll-behavior-y'];

/**
 * The rules every CSS file is held to: token-only values, no escape hatches, motion and the focus ring left to the
 * kit, logical properties, and query widths that equal the kit's breakpoints. `tokensCss` is the path of
 * `@avelune/tokens/tokens.css`. They need the plugins stylelint-declaration-strict-value, stylelint-plugin-logical-css
 * and the `avelune` ones.
 */
export function applicationRules(tokensCss: string): NonNullable<Config['rules']> {
  return {
    'color-no-hex': true,
    'color-named': 'never',
    'function-disallowed-list': rawFunctions,
    'unit-disallowed-list': [tokenUnits, { ignoreMediaFeatureNames: { px: ['width', 'min-width', 'max-width'] } }],
    'scale-unlimited/declaration-strict-value': strictValues(keywords),
    'declaration-no-important': true,
    'selector-max-id': 0,
    'selector-disallowed-list': ['/::ng-deep/', '/\\/deep\\//', '/>>>/'],
    // Motion longhands only, so that strict values check each part; never `all`. The focus ring is one rule in
    // packages/ui/styles/focus.css: nothing else sets an outline, animates one or styles :focus (ADR 0030).
    'property-disallowed-list': [...motionShorthands, ...focusRing],
    'declaration-property-value-disallowed-list': { 'transition-property': ['all', '/outline/'] },
    'selector-pseudo-class-disallowed-list': ['focus'],
    // Keyframes live in the kit's motion catalog alone (brief §6.3, ADR 0005).
    'at-rule-disallowed-list': ['keyframes'],
    // Angular's emulated shim scopes only the outer selector of a nested rule, so a nested rule may refine the same
    // element (&:hover, &[aria-disabled='true'], &::before) but never reach another one (ADR 0024).
    'avelune/nesting-same-element': true,
    'logical-css/require-logical-keywords': [true, { ignore: physicalKeywords }],
    'logical-css/require-logical-properties': [true, { ignore: physicalProperties }],
    'logical-css/require-logical-units': true,
    'avelune/media-query-tokens': [true, { tokens: tokensCss }],
  };
}
