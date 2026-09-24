// Proves: deferTriggerMisconfiguration
// Expect: NG8021

import { Component } from '@angular/core';

// `on immediate` loads at once, so the prefetch trigger can never run first.
@Component({ selector: 'ave-host', template: '@defer (on immediate; prefetch on idle) {<p>Chart</p>}' })
export class Host {}
