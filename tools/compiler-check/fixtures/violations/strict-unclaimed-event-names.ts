// Proves: strictUnclaimedEventNames
// Expect: NG8030

import { Component, output } from '@angular/core';

@Component({ selector: 'ave-stepper', template: '' })
export class Stepper {
  readonly stepChange = output<number>();
}

// A misspelled output: no directive on the element emits `stepChnage`, and no DOM event has that name.
@Component({ selector: 'ave-host', imports: [Stepper], template: '<ave-stepper (stepChnage)="announce()" />' })
export class Host {
  protected announce(): void {
    // Nothing to announce.
  }
}
