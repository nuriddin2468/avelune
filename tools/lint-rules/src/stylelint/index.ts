// Stylelint plugins of the `avelune` namespace (ADR 0024).
import { componentLayer } from './component-layer.ts';
import { mediaQueryTokens } from './media-query-tokens.ts';
import { nestingSameElement } from './nesting-same-element.ts';

export const plugins = [componentLayer, mediaQueryTokens, nestingSameElement];
