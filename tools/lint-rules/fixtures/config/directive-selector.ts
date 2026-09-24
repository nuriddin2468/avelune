// Lint as: packages/ui/icon/icon.ts
// Expect: @angular-eslint/directive-selector

import { Directive } from '@angular/core';

/** A directive without the `ave` prefix. */
@Directive({ selector: '[appTooltip]' })
export class AveTooltip {}
