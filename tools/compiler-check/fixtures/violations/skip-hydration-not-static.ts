// Proves: skipHydrationNotStatic
// Expect: NG8108

import { Component } from '@angular/core';

@Component({ selector: 'ave-panel', template: '' })
export class Panel {}

// Only a static `ngSkipHydration` (no value, "" or "true") is honoured.
@Component({ selector: 'ave-host', imports: [Panel], template: '<ave-panel ngSkipHydration="false" />' })
export class Host {}
