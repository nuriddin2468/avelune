// Proves: uninvokedFunctionInTextInterpolation
// Expect: NG8117

import { Component } from '@angular/core';

@Component({ selector: 'ave-host', template: '<p>{{ title }}</p>' })
export class Host {
  protected title(): string {
    return 'Report';
  }
}
