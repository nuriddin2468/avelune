// Proves: strictNullInputTypes
// Expect: TS2322

import { Component, input } from '@angular/core';

@Component({ selector: 'ave-label', template: '{{ text() }}' })
export class Label {
  readonly text = input('');
}

@Component({ selector: 'ave-host', imports: [Label], template: '<ave-label [text]="title" />' })
export class Host {
  protected readonly title: string | null = null;
}
