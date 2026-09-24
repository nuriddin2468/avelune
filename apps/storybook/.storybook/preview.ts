import type { Decorator, Preview } from '@storybook/angular-vite';
// The kit's global stylesheet, loaded as an application loads it: through the bundler, which resolves the tokens and
// the fonts next to it (ADR 0030).
import '@avelune/ui/styles.css';

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

const preview: Preview = {
  decorators: [withModes],
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
  },
};

export default preview;
