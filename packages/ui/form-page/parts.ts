import { Component, DestroyRef, Directive, ElementRef, afterNextRender, inject } from '@angular/core';

/**
 * A form page's actions (ADR 0097): the bar at the form's end, which sticks to the bottom of the window while the
 * form reaches past it. Its buttons stand at the inline end, 8px apart, the primary last; `[aveFormPageActionsStart]`
 * goes at its start. The row wraps on a narrow page, and the document's scroll padding follows the bar's height, so a
 * field focused near the window's bottom scrolls above all its rows (WCAG 2.4.11).
 *
 * ```html
 * <div aveFormPageActions>
 *   <button aveButton aveFormPageActionsStart type="button" variant="ghost">Сохранить черновик</button>
 *   <button aveButton type="button">Отмена</button>
 *   <button aveButton type="submit" variant="primary">Отправить на согласование</button>
 * </div>
 * ```
 *
 * @beta
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
export class AveFormPageActions {
  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const destroyRef = inject(DestroyRef);

    // base.css keeps a field above one row of the bar until it has measured itself; a wrapped bar is taller
    // (ADR 0097, addendum). A measured length, not a style: the document's CSSOM, which a strict CSP allows. Never on
    // the server, where afterNextRender does not run.
    afterNextRender(() => {
      const root = host.ownerDocument.documentElement.style;
      const sizes = new ResizeObserver(() => {
        root.setProperty('scroll-padding-block-end', `${String(host.getBoundingClientRect().height)}px`);
      });
      sizes.observe(host, { box: 'border-box' });
      destroyRef.onDestroy(() => {
        sizes.disconnect();
        root.removeProperty('scroll-padding-block-end');
      });
    });
  }
}

/**
 * Marks what stands at the start of a form page's actions (ADR 0097): a secondary action such as "Сохранить
 * черновик", or the form's status.
 *
 * ```html
 * <p aveFormPageActionsStart role="status">Черновик сохранён.</p>
 * ```
 *
 * @beta
 */
@Directive({ selector: '[aveFormPageActionsStart]' })
export class AveFormPageActionsStart {}
