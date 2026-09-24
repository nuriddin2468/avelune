import type { Decorator, Preview } from '@storybook/angular-vite';
// The kit's global stylesheet, loaded as an application loads it: through the bundler, which resolves the tokens and
// the fonts next to it (ADR 0030).
import '@avelune/ui/styles.css';
import { ThemedDocsContainer } from './docs-theme';

type Theme = 'light' | 'dark';
type Density = 'comfortable' | 'compact';
type Motion = 'full' | 'reduced';

/**
 * Writes the theme, density and motion globals as data attributes on <html>, the selectors tokens.css uses
 * (ADR 0017). The AveTheme service (Phase 4) does the same in applications.
 */
const withModes: Decorator = (story, context) => {
  const root = document.documentElement;
  const theme: Theme = context.globals['theme'] === 'dark' ? 'dark' : 'light';
  const density: Density = context.globals['density'] === 'compact' ? 'compact' : 'comfortable';
  const motion: Motion = context.globals['motion'] === 'reduced' ? 'reduced' : 'full';
  root.dataset['theme'] = theme;
  root.dataset['density'] = density;
  root.dataset['motion'] = motion;
  root.lang = 'en';
  return story();
};

type ArgTypesEnhancer = NonNullable<Preview['argTypesEnhancers']>[number];

/**
 * Boolean arguments get a radio control. Storybook's boolean toggle draws its unselected option at half opacity,
 * which cannot reach 4.5:1 in the light theme, and the docs sweep fails it (ADR 0034, addendum). The enhancer runs
 * before Storybook infers types and controls from the args, so it reads the args itself; a control it sets is kept,
 * as is one a story sets.
 */
const booleanAsRadio: ArgTypesEnhancer = ({ argTypes, initialArgs }) => {
  const enhanced = { ...argTypes };
  for (const name of Object.keys(initialArgs)) {
    const value: unknown = initialArgs[name];
    const argType = argTypes[name];
    if (typeof value !== 'boolean' || argType?.control !== undefined) continue;
    enhanced[name] = { name, ...argType, control: { type: 'inline-radio' }, options: [false, true] };
  }
  return enhanced;
};

const preview: Preview = {
  decorators: [withModes],
  argTypesEnhancers: [booleanAsRadio],
  globalTypes: {
    theme: {
      description: 'Colour theme',
      toolbar: { title: 'Theme', icon: 'mirror', items: ['light', 'dark'], dynamicTitle: true },
    },
    density: {
      description: 'Density',
      toolbar: { title: 'Density', icon: 'component', items: ['comfortable', 'compact'], dynamicTitle: true },
    },
    motion: {
      description: 'Motion preference',
      toolbar: { title: 'Motion', icon: 'play', items: ['full', 'reduced'], dynamicTitle: true },
    },
  },
  initialGlobals: { theme: 'light', density: 'comfortable', motion: 'full' },
  parameters: {
    layout: 'fullscreen',
    // Any axe violation fails the story once addon-vitest runs them (Phase 3, ADR 0006).
    a11y: { test: 'error' },
    backgrounds: { disable: true },
    docs: { container: ThemedDocsContainer },
  },
};

export default preview;
