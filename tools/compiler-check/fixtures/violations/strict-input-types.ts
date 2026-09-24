// Proves: strictInputTypes
// Expect: TS2322

import { Component, input } from '@angular/core';

@Component({ selector: 'ave-counter', template: '{{ count() }}' })
export class Counter {
  readonly count = input(0);
}

@Component({ selector: 'ave-host', imports: [Counter], template: `<ave-counter [count]="'three'" />` })
export class Host {}
