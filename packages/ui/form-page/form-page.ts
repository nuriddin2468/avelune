import { Component, input } from '@angular/core';

let nextForm = 0;

/**
 * A form's page (brief §9.4, ADR 0091, 0097), on the application's own `<form>`: the page's heading and what the form
 * asks for over the application's fields, and its actions in a bar that sticks to the bottom of the window while the
 * form reaches past it. The form is a landmark named by its heading.
 *
 * ```html
 * <form aveFormPage heading="Новый договор" description="* — обязательные поля" novalidate (submit)="send($event)">
 *   <div class="fields">…</div>
 *   <div aveFormPageActions>
 *     <button aveButton type="button">Отмена</button>
 *     <button aveButton type="submit" variant="primary">Отправить на согласование</button>
 *   </div>
 * </form>
 * ```
 *
 * @beta
 */
@Component({
  selector: 'form[aveFormPage]',
  host: { '[attr.aria-labelledby]': 'headingId' },
  template: `
    <div class="header">
      <h1 class="heading" [id]="headingId">{{ heading() }}</h1>
      @if (description(); as description) {
        <p class="description">{{ description }}</p>
      }
    </div>
    <ng-content />
    <ng-content select="[aveFormPageActions]" />
  `,
  styleUrl: './form-page.css',
})
export class AveFormPage {
  /** The page's heading, its `h1`, which names the form: "Новый договор". */
  readonly heading = input.required<string>();

  /** What the form asks for, muted under the heading: "* — обязательные поля". None by default. */
  readonly description = input('');

  protected readonly headingId = `ave-form-page-heading-${String(nextForm++)}`;
}
