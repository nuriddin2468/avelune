// Proves: uninvokedTrackFunction
// Expect: NG8115

import { Component } from '@angular/core';

@Component({ selector: 'ave-host', template: '@for (item of items; track byId) {<p>{{ item.id }}</p>}' })
export class Host {
  protected readonly items: readonly { readonly id: string }[] = [];

  protected byId(item: { readonly id: string }): string {
    return item.id;
  }
}
