import { Component, Directive } from '@angular/core';

/**
 * The application's actions at the inline end of the application bar (ADR 0092): the view's switches, the person's
 * menu, notifications. Its items stand in a row 8px apart, wrapping under the name on a narrow window.
 *
 * ```html
 * <div aveAppShellActions role="group" aria-label="Вид">
 *   <button aveIconButton type="button" variant="ghost" icon="moon" label="Тёмная тема" aveTooltip="Тёмная тема"></button>
 * </div>
 * ```
 *
 * @alpha
 */
@Component({
  selector: '[aveAppShellActions]',
  template: '<ng-content />',
  styleUrl: './actions.css',
})
export class AveAppShellActions {}

/**
 * Marks a banner the shell places under the application bar, across the window (ADR 0061, 0092): planned
 * maintenance, a licence that expires.
 *
 * ```html
 * <ave-banner aveAppShellBanner variant="warning">В субботу с 22:00 до 02:00 система будет недоступна.</ave-banner>
 * ```
 *
 * @alpha
 */
@Directive({ selector: '[aveAppShellBanner]' })
export class AveAppShellBanner {}
