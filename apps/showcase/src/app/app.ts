import { Component } from '@angular/core';
import { AveIcon } from '@avelune/ui/icon';

/** Showcase shell. Realistic screens arrive with the components (Phase 5). */
@Component({
  selector: 'ave-showcase-root',
  imports: [AveIcon],
  template: `
    <main>
      <h1>Avelune showcase</h1>
      <p><ave-icon name="circle-check" decorative /> The kit is wired into a real application.</p>
    </main>
  `,
})
export class App {}
