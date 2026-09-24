// Proves: strictDomLocalRefTypes
// Expect: TS2551

import { Component } from '@angular/core';

// `#field` is an HTMLInputElement, not `any`.
@Component({ selector: 'ave-host', template: '<input #field aria-label="Name" />{{ field.valueAsText }}' })
export class Host {}
