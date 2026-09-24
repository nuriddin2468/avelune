// Lint as: packages/ui/sample/sample.ts
// Expect: @angular-eslint/component-selector

import { Component } from '@angular/core';

/** A component without the `ave` prefix. */
@Component({ selector: 'app-card', template: '' })
export class AveCard {}
