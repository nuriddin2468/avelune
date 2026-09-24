// Proves: strictStandalone
// Expect: NG2023

import { Component } from '@angular/core';

@Component({ selector: 'ave-legacy', standalone: false, template: '' })
export class Legacy {}
