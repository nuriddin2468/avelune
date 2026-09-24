// Proves: interpolatedSignalNotInvoked
// Expect: NG8109, NG8117

import { Component, signal } from '@angular/core';

@Component({ selector: 'ave-host', template: '{{ count }}' })
export class Host {
  protected readonly count = signal(0);
}
