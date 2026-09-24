// Proves: strictDomEventTypes
// Expect: TS2345

import { Component } from '@angular/core';

// `$event` of a DOM click is a PointerEvent, not `any`.
@Component({ selector: 'ave-host', template: '<button type="button" (click)="resize($event)">Save</button>' })
export class Host {
  protected resize(width: number): number {
    return width;
  }
}
