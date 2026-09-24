// Lint as: packages/ui/sample/sample.ts
// Expect: @angular-eslint/prefer-signals

import { Directive, Input } from '@angular/core';

/** Uses a decorator input instead of input(). */
@Directive({ selector: '[aveCard]' })
export class AveCard {
  /** The label. */
  @Input() label = '';
}
