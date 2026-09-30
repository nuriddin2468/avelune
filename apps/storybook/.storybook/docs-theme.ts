// The docs pages follow the Theme toolbar (ADR 0034). Storybook paints a docs page with its own theme, so a kit theme
// alone leaves the stories' text on Storybook's white. Each kit theme gets a Storybook docs theme built from the kit's
// semantic colours, and the container picks it from the globals; the docs page re-renders when a global changes.
import { DocsContainer, type DocsContainerProps } from '@storybook/addon-docs/blocks';
import { createElement, useEffect, useReducer, type PropsWithChildren, type ReactElement } from 'react';
import { GLOBALS_UPDATED, SET_GLOBALS } from 'storybook/internal/core-events';
import { create, type ThemeVars } from 'storybook/theming';
import { cssValue, type Theme } from '../src/foundations/token-data';

function docsTheme(theme: Theme): ThemeVars {
  return create({
    base: theme,
    colorPrimary: cssValue('color.accent.bg', theme),
    colorSecondary: cssValue('color.fg.link', theme),
    appBg: cssValue('color.bg.canvas', theme),
    // The page, and Storybook's code blocks on it, sit on the surface: Storybook's light syntax colours fall below
    // 4.5:1 on the canvas (#eb0000 at 4.43) and pass on the surface in both themes (ADR 0034, addendum).
    appContentBg: cssValue('color.bg.surface', theme),
    appHoverBg: cssValue('color.bg.hover', theme),
    appPreviewBg: cssValue('color.bg.canvas', theme),
    appBorderColor: cssValue('color.border.subtle', theme),
    textColor: cssValue('color.fg.default', theme),
    textInverseColor: cssValue('color.bg.canvas', theme),
    textMutedColor: cssValue('color.fg.muted', theme),
    barTextColor: cssValue('color.fg.muted', theme),
    barHoverColor: cssValue('color.fg.link', theme),
    barSelectedColor: cssValue('color.accent.fg', theme),
    barBg: cssValue('color.bg.surface', theme),
    buttonBg: cssValue('color.bg.surface', theme),
    buttonBorder: cssValue('color.border.default', theme),
    booleanBg: cssValue('color.bg.surface-sunken', theme),
    booleanSelectedBg: cssValue('color.bg.surface-raised', theme),
    inputBg: cssValue('color.bg.surface', theme),
    inputBorder: cssValue('color.border.default', theme),
    inputTextColor: cssValue('color.fg.default', theme),
  });
}

const docsThemes: Readonly<Record<Theme, ThemeVars>> = { light: docsTheme('light'), dark: docsTheme('dark') };

/**
 * The kit theme in a story's globals. `getStoryContext` is typed as an `Omit` of `StoryContext`, whose index signature
 * (`[key: string]: any`) swallows the named fields, so the globals arrive untyped and are narrowed here.
 */
function themeIn(globals: unknown): Theme {
  return typeof globals === 'object' && globals !== null && 'theme' in globals && globals.theme === 'dark'
    ? 'dark'
    : 'light';
}

/**
 * The globals the channel last carried, for a docs page without stories: a guide of an entry point without a story
 * file (ADR 0101). The channel keeps each event's last arguments; a payload of either event holds `globals`.
 */
function lastGlobals(channel: DocsContainerProps['context']['channel']): unknown {
  for (const event of [GLOBALS_UPDATED, SET_GLOBALS]) {
    const args: unknown = channel.last(event);
    const payload: unknown = Array.isArray(args) ? args[0] : undefined;
    if (typeof payload === 'object' && payload !== null && 'globals' in payload) return payload.globals;
  }
  return undefined;
}

/** Storybook's docs container, in the docs theme of the toolbar's kit theme. */
export function ThemedDocsContainer({ context, children }: PropsWithChildren<DocsContainerProps>): ReactElement {
  // A page attached to its stories (<Meta of>) reads the globals through a story and re-renders with them. A page
  // without stories reads them from the channel, and re-renders itself when they change.
  const [story] = context.componentStories();
  const [, update] = useReducer((count: number) => count + 1, 0);
  useEffect(() => {
    if (story !== undefined) return;
    context.channel.on(GLOBALS_UPDATED, update);
    return () => {
      context.channel.off(GLOBALS_UPDATED, update);
    };
  }, [context.channel, story]);
  const globals: unknown =
    story === undefined ? lastGlobals(context.channel) : context.getStoryContext(story)['globals'];
  return createElement(DocsContainer, { context, theme: docsThemes[themeIn(globals)] }, children);
}
