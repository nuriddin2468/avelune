// Lint as: apps/storybook/src/foundations/docs-page.ts
// Expect: @angular-eslint/template/no-inline-styles (the exception covers bindings only)

import { Component } from '@angular/core';

/** A swatch. */
@Component({ selector: 'ave-swatch', template: '<span style="color: red">Aa</span>' })
export class Swatch {}
