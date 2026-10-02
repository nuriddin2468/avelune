// Stylelint plugins of the `avelune` namespace (ADR 0024, 0030, 0091, 0104).
import { componentLayer } from './component-layer.ts';
import { knownTokens } from './known-tokens.ts';
import { layerOrder } from './layer-order.ts';
import { mediaQueryTokens } from './media-query-tokens.ts';
import { nestingSameElement } from './nesting-same-element.ts';
import { noTokenDeclarations } from './no-token-declarations.ts';
import { patternLayoutOnly } from './pattern-layout-only.ts';

export const plugins = [
  componentLayer,
  knownTokens,
  layerOrder,
  mediaQueryTokens,
  nestingSameElement,
  noTokenDeclarations,
  patternLayoutOnly,
];
