import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** The frame of a Foundations page: title, lead paragraph and sections. Styled with tokens only. */
@Component({
  selector: 'ave-docs-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="page">
      <header class="header">
        <p class="kicker">Foundations</p>
        <h1 class="title">{{ heading() }}</h1>
        <p class="lead"><ng-content select="[lead]" /></p>
      </header>
      <ng-content />
    </main>
  `,
  styleUrl: './docs-page.css',
})
export class DocsPage {
  /** Page title. */
  readonly heading = input.required<string>();
}

/** A titled section of a Foundations page. */
@Component({
  selector: 'ave-docs-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="section" [attr.aria-labelledby]="id">
      <h2 class="title" [id]="id">{{ heading() }}</h2>
      @if (note()) {
        <p class="note">{{ note() }}</p>
      }
      <ng-content />
    </section>
  `,
  styleUrl: './docs-section.css',
})
export class DocsSection {
  private static count = 0;
  /** Section title. */
  readonly heading = input.required<string>();
  /** Optional explanation under the title. */
  readonly note = input<string>('');
  protected readonly id = `ave-docs-section-${DocsSection.count++}`;
}

/** A horizontally scrollable region for wide tables; focusable, so keyboard users can scroll it. */
@Component({
  selector: 'ave-docs-scroll',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="scroll" tabindex="0" role="region" [attr.aria-label]="label()"><ng-content /></div>`,
  styleUrl: './docs-scroll.css',
})
export class DocsScroll {
  /** Accessible name of the region. */
  readonly label = input.required<string>();
}
