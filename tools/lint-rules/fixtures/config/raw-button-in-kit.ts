// Lint as: packages/ui/icon/icon.ts
// Expect: none (the kit implements native elements; the raw-element rule is for consumers)

import { Component } from '@angular/core';

/** A kit component may render a native button. */
@Component({ selector: 'ave-card', template: '<button type="button">Close</button>' })
export class AveCard {}
