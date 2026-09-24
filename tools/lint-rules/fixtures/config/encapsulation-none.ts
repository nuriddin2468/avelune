// Lint as: packages/ui/sample/sample.ts
// Expect: @angular-eslint/use-component-view-encapsulation, no-restricted-syntax

import { Component, ViewEncapsulation } from '@angular/core';

/** Leaks its styles. */
@Component({ selector: 'ave-card', template: '', encapsulation: ViewEncapsulation.None })
export class AveCard {}
