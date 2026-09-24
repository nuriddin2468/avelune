// Proves: textAttributeNotBinding
// Expect: NG8104

import { Component } from '@angular/core';

@Component({ selector: 'ave-host', template: '<p attr.title="Saved">Saved</p>' })
export class Host {}
