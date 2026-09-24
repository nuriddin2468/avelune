// Proves: missingNgForOfLet
// Expect: NG8105

import { NgFor } from '@angular/common';
import { Component } from '@angular/core';

@Component({ selector: 'ave-host', imports: [NgFor], template: '<p *ngFor="item of items">Row</p>' })
export class Host {
  protected readonly items: readonly string[] = [];
}
