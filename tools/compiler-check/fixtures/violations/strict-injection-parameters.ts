// Proves: strictInjectionParameters
// Expect: NG2003

import { Injectable } from '@angular/core';

interface Clock {
  now(): number;
}

// An interface is not an injection token.
@Injectable({ providedIn: 'root' })
export class Timer {
  constructor(readonly clock: Clock) {}
}
