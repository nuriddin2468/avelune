// Proves: uninvokedFunctionInEventBinding
// Expect: NG8111

import { Component } from '@angular/core';

@Component({ selector: 'ave-host', template: '<button type="button" (click)="save">Save</button>' })
export class Host {
  protected save(): void {}
}
