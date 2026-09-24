// Proves: suffixNotSupported
// Expect: NG8106

import { Component } from '@angular/core';

@Component({ selector: 'ave-host', template: '<p [attr.width.px]="width">Saved</p>' })
export class Host {
  protected readonly width = 4;
}
