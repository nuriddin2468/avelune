// Proves: strictLiteralTypes
// Expect: TS2322

import { Component, input } from '@angular/core';

@Component({ selector: 'ave-sizes', template: '{{ sizes().length }}' })
export class Sizes {
  readonly sizes = input<readonly number[]>([]);
}

// The array literal is `(number | string)[]`, not `any`.
@Component({ selector: 'ave-host', imports: [Sizes], template: `<ave-sizes [sizes]="[32, 'md']" />` })
export class Host {}
