// The real Storybook config (apps/storybook/.storybook/main.ts) with this folder's stories, and the real preview head,
// so the visual fixtures render exactly as real stories do: tokens, fonts, theme global.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import config from '../../../../../apps/storybook/.storybook/main.ts';

const tsconfig = join(import.meta.dirname, '..', 'tsconfig.json');
const framework =
  typeof config.framework === 'object'
    ? { ...config.framework, options: { ...config.framework.options, tsconfig } }
    : config.framework;
const realHead = readFileSync(
  join(import.meta.dirname, '..', '..', '..', '..', '..', 'apps', 'storybook', '.storybook', 'preview-head.html'),
  'utf8',
);

export default { ...config, stories: ['../*.stories.ts'], framework, previewHead: (head: string) => head + realHead };
