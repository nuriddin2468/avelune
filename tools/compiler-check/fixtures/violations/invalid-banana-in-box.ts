// Proves: invalidBananaInBox
// Expect: NG8101

import { Component, model } from '@angular/core';

@Component({ selector: 'ave-choice', template: '{{ value() }}' })
export class Choice {
  readonly value = model('');
}

@Component({ selector: 'ave-host', imports: [Choice], template: '<ave-choice ([value])="selected" />' })
export class Host {
  protected selected = '';
}
