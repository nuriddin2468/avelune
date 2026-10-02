// The kit's elements and the kit's entry points only: nothing to count.
import { Component } from '@angular/core';
import { AveButton } from '@avelune/ui/button';
import { AveInput } from '@avelune/ui/input';

@Component({
  selector: 'app-root',
  imports: [AveButton, AveInput],
  template: `
    <input aveInput type="text" aria-label="Search" />
    <button aveButton type="button">Save changes</button>
  `,
  styles: '.actions { display: flex; gap: var(--ave-space-2); }',
})
export class App {}
