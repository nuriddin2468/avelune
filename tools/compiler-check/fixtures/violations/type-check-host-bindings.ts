// Proves: typeCheckHostBindings
// Expect: TS2551

import { Directive, input } from '@angular/core';

@Directive({ selector: 'button[aveFixture]', host: { '[attr.aria-label]': 'labl()' } })
export class Fixture {
  readonly label = input('');
}
