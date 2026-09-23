import { Component } from '@angular/core';
import { AveSample } from '@avelune/ui/sample';

/** Showcase shell. Realistic screens arrive with the components (Phase 5). */
@Component({
  selector: 'ave-showcase-root',
  imports: [AveSample],
  template: `
    <main>
      <h1>Avelune showcase</h1>
      <p aveSample tone="accent">Workspace scaffold: the kit is wired into a real application.</p>
    </main>
  `,
})
export class App {}
