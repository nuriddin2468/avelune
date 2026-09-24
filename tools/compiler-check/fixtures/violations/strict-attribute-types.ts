// Proves: strictAttributeTypes
// Expect: TS2322

import { Component, input } from '@angular/core';

@Component({ selector: 'ave-toggle', template: '{{ pressed() }}' })
export class Toggle {
  readonly pressed = input(false);
}

// A bare attribute sets the input to '', which is not a boolean without a `booleanAttribute` transform.
@Component({ selector: 'ave-host', imports: [Toggle], template: '<ave-toggle pressed />' })
export class Host {}
