// Proves: strictSafeNavigationTypes
// Expect: TS2322

import { Component, input } from '@angular/core';

@Component({ selector: 'ave-counter', template: '{{ count() }}' })
export class Counter {
  readonly count = input(0);
}

// `user?.age` is `number | undefined`, not `any`.
@Component({ selector: 'ave-host', imports: [Counter], template: '<ave-counter [count]="user?.age" />' })
export class Host {
  protected readonly user: { readonly age: number } | undefined = undefined;
}
