// Root ESLint flat config.
// Phase 1 baseline: recommended rules and layer boundaries. Phase 3 adds angular-eslint, template a11y,
// restricted imports, disable-comment rules and the custom rules from tools/lint-rules (brief §5.2).
import js from '@eslint/js';
import nx from '@nx/eslint-plugin';
import { defineConfig } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/** Layers from lowest to highest. A project may depend only on its own layer or a lower one (ADR 0001). */
const layers = ['layer:tokens', 'layer:foundations', 'layer:components', 'layer:composites', 'layer:patterns'];

export default defineConfig(
  {
    ignores: ['**/dist/**', '**/out-tsc/**', '**/.nx/**', '**/.angular/**', '**/coverage/**', '**/node_modules/**'],
  },
  {
    // Deliberate violations: each tool's own tests assert that its check rejects them (brief §5).
    ignores: ['tools/*/fixtures/**'],
  },
  {
    linterOptions: { reportUnusedDisableDirectives: 'error' },
  },
  js.configs.recommended,
  {
    files: ['**/*.ts', '**/*.mts', '**/*.cts'],
    extends: [tseslint.configs.recommended],
  },
  {
    files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
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
          depConstraints: [
            ...layers.map((layer, index) => ({
              sourceTag: layer,
              onlyDependOnLibsWithTags: layers.slice(0, index + 1),
            })),
            { sourceTag: 'type:app', onlyDependOnLibsWithTags: layers },
            { sourceTag: 'type:tool', onlyDependOnLibsWithTags: ['layer:tokens', 'type:tool'] },
            { sourceTag: 'type:config', onlyDependOnLibsWithTags: ['layer:tokens', 'type:tool', 'type:config'] },
          ],
        },
      ],
    },
  },
);
