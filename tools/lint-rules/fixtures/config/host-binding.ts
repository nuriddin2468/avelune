// Lint as: packages/ui/icon/icon.ts
// Expect: @angular-eslint/prefer-host-metadata-property

import { Directive, HostBinding } from '@angular/core';

/** Uses a decorator instead of the host object. */
@Directive({ selector: '[aveCard]' })
export class AveCard {
  /** The role. */
  @HostBinding('attr.role') readonly role = 'group';
}
