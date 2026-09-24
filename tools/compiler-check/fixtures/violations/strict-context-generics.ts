// Proves: strictContextGenerics
// Expect: TS2345

import { Component } from '@angular/core';

// The template sees `item` as `T extends string`, not `any`.
@Component({ selector: 'ave-host', template: '{{ width(item) }}' })
export class Host<T extends string> {
  protected item!: T;

  protected width(value: number): number {
    return value;
  }
}
