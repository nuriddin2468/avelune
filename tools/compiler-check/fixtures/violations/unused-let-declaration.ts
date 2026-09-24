// Proves: unusedLetDeclaration
// Expect: NG8112

import { Component } from '@angular/core';

@Component({ selector: 'ave-host', template: '@let total = count + 1; <p>Saved</p>' })
export class Host {
  protected readonly count = 1;
}
