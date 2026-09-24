// Lint as: packages/ui/sample/sample.ts
// Expect: @angular-eslint/template/no-inline-styles

import { Component } from '@angular/core';

/** Styles belong in the stylesheet, as tokens. */
@Component({ selector: 'ave-card', template: '<p style="margin: 0">Saved</p>' })
export class AveCard {}
