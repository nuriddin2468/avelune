// Proves: missingStructuralDirective
// Expect: NG8116

import { Component } from '@angular/core';

@Component({ selector: 'ave-host', template: '<p *aveWhen="visible">Saved</p>' })
export class Host {
  protected readonly visible = true;
}
