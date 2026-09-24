// Proves: nullishCoalescingNotNullable
// Expect: NG8102

import { Component } from '@angular/core';

@Component({ selector: 'ave-host', template: `{{ title ?? 'Untitled' }}` })
export class Host {
  protected readonly title: string = 'Report';
}
