// Stylelint plugins of the `avelune` namespace (ADR 0024, 0030, 0091).
import { componentLayer } from './component-layer.ts';
import { layerOrder } from './layer-order.ts';
import { mediaQueryTokens } from './media-query-tokens.ts';
import { nestingSameElement } from './nesting-same-element.ts';
import { patternLayoutOnly } from './pattern-layout-only.ts';

export const plugins = [componentLayer, layerOrder, mediaQueryTokens, nestingSameElement, patternLayoutOnly];
