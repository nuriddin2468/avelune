// Proves: strictOutputEventTypes
// Expect: TS2345

import { Component, output } from '@angular/core';

@Component({ selector: 'ave-stepper', template: '' })
export class Stepper {
  readonly stepped = output<number>();
}

@Component({ selector: 'ave-host', imports: [Stepper], template: '<ave-stepper (stepped)="announce($event)" />' })
export class Host {
  protected announce(message: string): string {
    return message;
  }
}
