// Proves: optionalChainNotNullable
// Expect: NG8107

import { Component } from '@angular/core';

@Component({ selector: 'ave-host', template: '{{ title?.length }}' })
export class Host {
  protected readonly title: string = 'Report';
}
