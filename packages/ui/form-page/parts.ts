import { Component, Directive } from '@angular/core';

/**
 * A form page's actions (ADR 0097): the bar at the form's end, which sticks to the bottom of the window while the
 * form reaches past it. Its buttons stand at the inline end, 8px apart, the primary last; `[aveFormPageActionsStart]`
 * goes at its start. The row wraps on a narrow page.
 *
 * ```html
 * <div aveFormPageActions>
 *   <button aveButton aveFormPageActionsStart type="button" variant="ghost">Сохранить черновик</button>
 *   <button aveButton type="button">Отмена</button>
 *   <button aveButton type="submit" variant="primary">Отправить на согласование</button>
 * </div>
 * ```
 *
 * @alpha
 */
@Component({
  selector: '[aveFormPageActions]',
  host: { 'data-ave-form-actions': '' },
  template: `
    <div class="start"><ng-content select="[aveFormPageActionsStart]" /></div>
    <div class="end"><ng-content /></div>
  `,
  styleUrl: './actions.css',
})
export class AveFormPageActions {}

/**
 * Marks what stands at the start of a form page's actions (ADR 0097): a secondary action such as "Сохранить
 * черновик", or the form's status.
 *
 * ```html
 * <p aveFormPageActionsStart role="status">Черновик сохранён.</p>
 * ```
 *
 * @alpha
 */
@Directive({ selector: '[aveFormPageActionsStart]' })
export class AveFormPageActionsStart {}
