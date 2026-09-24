// Proves: strictInputAccessModifiers
// Expect: TS2445

import { Component, Input } from '@angular/core';

@Component({ selector: 'ave-label', template: '{{ text }}' })
export class Label {
  @Input() protected text = '';
}

@Component({ selector: 'ave-host', imports: [Label], template: `<ave-label [text]="'Save'" />` })
export class Host {}
