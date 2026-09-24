// Lint as: packages/ui/icon/icon.ts
// Expect: avelune/no-appearance-inputs

import { Directive, input } from '@angular/core';

/** Hands its colour to the consumer. */
@Directive({ selector: '[aveCard]' })
export class AveCard {
  /** The colour. */
  readonly color = input('');
}
