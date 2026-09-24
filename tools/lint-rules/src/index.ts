// The `avelune` ESLint plugin: rules for the kit itself and for applications that consume it (ADR 0023).
import type { TSESLint } from '@typescript-eslint/utils';
import { entryPointLayers } from './rules/entry-point-layers.ts';
import { noAppearanceInputs } from './rules/no-appearance-inputs.ts';
import { noRawElements } from './rules/no-raw-elements.ts';
import { publicApiJsdoc } from './rules/public-api-jsdoc.ts';

export { kitElements } from './kit-elements.ts';

export const plugin = {
  meta: { name: 'avelune' },
  rules: {
    'entry-point-layers': entryPointLayers,
    'no-appearance-inputs': noAppearanceInputs,
    'no-raw-elements': noRawElements,
    'public-api-jsdoc': publicApiJsdoc,
  },
} satisfies TSESLint.FlatConfig.Plugin;
