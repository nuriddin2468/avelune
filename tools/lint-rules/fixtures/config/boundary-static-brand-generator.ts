// Lint as: packages/ui/theme/generator.ts
// Expect: @nx/enforce-module-boundaries

import { generateAveBrand } from '@avelune/tokens/brand';

/** The brand generator imported statically: it would join the page's bundle instead of loading lazily (ADR 0089). */
export const generator = generateAveBrand;
