// Lint as: packages/ui/sample/sample.ts
// Expect: no-restricted-syntax

import { Component, ViewEncapsulation } from '@angular/core';

/** Breaks global focus rules and layer order. */
@Component({ selector: 'ave-card', template: '', encapsulation: ViewEncapsulation.ShadowDom })
export class AveCard {}
