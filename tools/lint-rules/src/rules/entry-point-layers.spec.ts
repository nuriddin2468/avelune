import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { it } from 'node:test';
import { entryPointLayers } from './entry-point-layers.ts';
import { RuleTester } from './rule-tester.ts';

// fixtures/library is a miniature @avelune/ui: icon (foundations), button (components) with button/testing,
// form-field (composites), no-manifest and bad-layer. Only the manifests exist; the linted files are virtual.
const library = join(import.meta.dirname, '..', '..', 'fixtures', 'library');
const at = (path: string) => join(library, path);
const tester = new RuleTester();

it('reads the same layers as the real library', () => {
  const read = (path: string): unknown => JSON.parse(readFileSync(path, 'utf8'));
  assert.deepEqual(
    read(at('entry.schema.json')),
    read(join(import.meta.dirname, '..', '..', '..', '..', 'packages', 'ui', 'entry.schema.json')),
  );
});

tester.run('entry-point-layers', entryPointLayers, {
  valid: [
    { filename: at('button/button.ts'), code: "import { AveIcon } from '@avelune/ui/icon';" },
    { filename: at('button/button.ts'), code: "import { AveButton } from '@avelune/ui/button';" },
    { filename: at('button/button.ts'), code: "import { tone } from './tone';" },
    { filename: at('button/button.ts'), code: "import { Component } from '@angular/core';" },
    { filename: at('form-field/form-field.ts'), code: "import { AveButton } from '@avelune/ui/button';" },
    { filename: at('button/testing/button-harness.ts'), code: "import type { AveButton } from '@avelune/ui/button';" },
    { filename: at('button/testing/button-harness.ts'), code: "import { hosts } from './hosts';" },
    { filename: at('button/button.spec.ts'), code: "import { AveButtonHarness } from '@avelune/ui/button/testing';" },
    {
      filename: at('button/button.stories.ts'),
      code: "import { AveButtonHarness } from '@avelune/ui/button/testing';",
    },
    // Outside every entry point (the primary index, scripts): the rule does not apply.
    { filename: at('index.ts'), code: "export * from './form-field/form-field';" },
  ],
  invalid: [
    {
      filename: at('button/button.ts'),
      code: "import { AveFormField } from '@avelune/ui/form-field';",
      errors: [
        {
          messageId: 'upward',
          data: { source: 'button', sourceLayer: 'components', target: 'form-field', targetLayer: 'composites' },
        },
      ],
    },
    {
      filename: at('button/button.ts'),
      code: "export * from '@avelune/ui/form-field';",
      errors: [{ messageId: 'upward' }],
    },
    {
      filename: at('button/button.ts'),
      code: "export const lazy = import('@avelune/ui/form-field');",
      errors: [{ messageId: 'upward' }],
    },
    {
      filename: at('button/button.ts'),
      code: "type Field = import('@avelune/ui/form-field').AveFormField;",
      errors: [{ messageId: 'upward' }],
    },
    {
      filename: at('button/button.ts'),
      code: "import { AveIcon } from '@avelune/ui/icon/icon';",
      errors: [{ messageId: 'deepImport', data: { specifier: '@avelune/ui/icon/icon', public: '@avelune/ui/icon' } }],
    },
    {
      filename: at('button/button.ts'),
      code: "import { x } from '@avelune/ui/missing';",
      errors: [{ messageId: 'unknownEntryPoint' }],
    },
    {
      filename: at('button/button.ts'),
      code: "import { AveButtonHarness } from '@avelune/ui/button/testing';",
      errors: [{ messageId: 'testingInRuntime' }],
    },
    {
      filename: at('button/button.ts'),
      code: "import { AveIcon } from '../icon/icon';",
      errors: [{ messageId: 'relativeCrossing' }],
    },
    {
      filename: at('button/button.ts'),
      code: "import { AveButtonHarness } from './testing';",
      errors: [{ messageId: 'relativeCrossing' }],
    },
    {
      filename: at('button/testing/button-harness.ts'),
      code: "import { AveButton } from '../button';",
      errors: [{ messageId: 'relativeCrossing' }],
    },
    {
      filename: at('no-manifest/thing.ts'),
      code: 'export const thing = 1;',
      errors: [{ messageId: 'missingManifest' }],
    },
    {
      filename: at('bad-layer/thing.ts'),
      code: 'export const thing = 1;',
      errors: [
        {
          messageId: 'invalidLayer',
          data: { source: 'bad-layer', layers: 'foundations, components, composites, patterns' },
        },
      ],
    },
  ],
});
