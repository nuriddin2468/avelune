// Lint as: apps/storybook/src/foundations/docs-page.ts
// Expect: none (the documented exception: Foundations pages bind token variables to [style.*])

import { Component } from '@angular/core';

/** A swatch. */
@Component({ selector: 'ave-swatch', template: '<span [style.background-color]="fill">Aa</span>' })
export class Swatch {
  protected readonly fill = 'var(--ave-color-bg-surface)';
}
