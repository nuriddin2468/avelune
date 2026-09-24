// Lint as: packages/ui/sample/sample.ts
// Expect: no-restricted-syntax

import { Component } from '@angular/core';

/** Styles in the decorator escape Stylelint. */
@Component({ selector: 'ave-card', template: '', styles: ':host { display: block; }' })
export class AveCard {}
