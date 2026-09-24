// Proves: controlFlowPreventingContentProjection
// Expect: NG8011

import { Component } from '@angular/core';

@Component({ selector: 'ave-card', template: '<ng-content select="header" />' })
export class Card {}

// Two root nodes inside @if cannot be projected into the `header` slot.
@Component({
  selector: 'ave-host',
  imports: [Card],
  template: '<ave-card>@if (open) {<header>Title</header><p>Body</p>}</ave-card>',
})
export class Host {
  protected readonly open = true;
}
