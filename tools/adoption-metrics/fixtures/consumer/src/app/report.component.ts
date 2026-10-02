// A banned import 1; an inline template with a raw element 1 and an inline style 1; component styles with a raw pixel
// value 1 and local keyframes 1; a second component whose interpolated style cannot be linted.
import { Component } from '@angular/core';
import { trigger } from '@angular/animations';

@Component({
  selector: 'app-report',
  template: '<button type="button">Export</button><p style="color: red">Draft</p>',
  styles: [
    '.report { margin-block: 8px; }',
    `
      @keyframes fade {
        from {
          opacity: 0;
        }
      }
    `,
  ],
})
export class Report {
  readonly animation = trigger;
}

const gap = 4;

@Component({
  selector: 'app-dynamic',
  template: '<p>Dynamic</p>',
  styles: `
    .dynamic {
      gap: ${gap}px;
    }
  `,
})
export class Dynamic {}
