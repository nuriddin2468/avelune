// The real Storybook config (apps/storybook/.storybook/main.ts) with this folder's stories, so the visual fixtures
// render exactly as real stories do: the global stylesheet through the real preview, the theme global.
import { join } from 'node:path';
import config from '../../../../../apps/storybook/.storybook/main.ts';

const tsconfig = join(import.meta.dirname, '..', 'tsconfig.json');
const framework =
  typeof config.framework === 'object'
    ? { ...config.framework, options: { ...config.framework.options, tsconfig } }
    : config.framework;

export default { ...config, stories: ['../*.stories.ts'], framework };
