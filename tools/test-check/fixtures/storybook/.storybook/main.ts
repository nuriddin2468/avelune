// The real Storybook config (apps/storybook/.storybook/main.ts): only the stories and the tsconfig that lists them
// differ, so these fixtures run with the real addons and framework options.
import { join } from 'node:path';
import config from '../../../../../apps/storybook/.storybook/main.ts';

const tsconfig = join(import.meta.dirname, '..', 'tsconfig.json');
const framework =
  typeof config.framework === 'object'
    ? { ...config.framework, options: { ...config.framework.options, tsconfig } }
    : config.framework;

export default { ...config, stories: ['../*.stories.ts'], staticDirs: [], framework };
