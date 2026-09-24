// Proves: unparenthesizedNullishCoalescing
// Expect: NG8114

import { Component } from '@angular/core';

@Component({ selector: 'ave-host', template: '@if (draft ?? saved || pinned) {<p>Shown</p>}' })
export class Host {
  protected readonly draft: boolean | null = null;
  protected readonly saved = false;
  protected readonly pinned = true;
}
