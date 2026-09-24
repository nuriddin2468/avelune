// Proves: unusedStandaloneImports
// Expect: NG8113

import { NgClass } from '@angular/common';
import { Component } from '@angular/core';

@Component({ selector: 'ave-host', imports: [NgClass], template: '<p>Saved</p>' })
export class Host {}
