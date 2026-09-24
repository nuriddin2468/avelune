// Proves: missingControlFlowDirective
// Expect: NG8103

import { Component } from '@angular/core';

@Component({ selector: 'ave-host', template: '<p *ngIf="visible">Saved</p>' })
export class Host {
  protected readonly visible = true;
}
