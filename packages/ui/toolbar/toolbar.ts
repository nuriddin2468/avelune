import { Component, Directive, input } from '@angular/core';
import { Toolbar, ToolbarWidget } from '@angular/aria/toolbar';

/**
 * The kit's toolbar (brief §9.4, ADR 0075), on the application's element: Angular Aria's toolbar (the WAI-ARIA
 * toolbar pattern), one Tab stop whose arrows, Home and End move between its items. Mark each item `aveToolbarItem`;
 * a menu inside joins by itself. In a toolbar a disabled Button is written with `disabledInteractive`, so it keeps
 * focus as the arrows reach it.
 *
 * ```html
 * <div aveToolbar label="Действия с договором">
 *   <button aveButton aveToolbarItem variant="ghost" type="button">Изменить</button>
 *   <span aveToolbarSeparator></span>
 *   <ave-menu label="Ещё" icon="ellipsis" variant="ghost" [items]="more" />
 * </div>
 * ```
 *
 * @alpha
 */
@Component({
  selector: '[aveToolbar]',
  hostDirectives: [Toolbar],
  host: { '[attr.aria-label]': 'label()' },
  template: '<ng-content />',
  styleUrl: './toolbar.css',
})
export class AveToolbar {
  /** The toolbar's name for assistive technology: what its actions act on ("Действия с договором"). */
  readonly label = input.required<string>();
}

/**
 * An item of a kit toolbar (ADR 0075): a Button, an IconButton or a link that looks like one, reached by the
 * toolbar's arrows. Its `disabled` is the Button's too.
 *
 * @alpha
 */
@Directive({
  selector: '[aveToolbarItem]',
  hostDirectives: [{ directive: ToolbarWidget, inputs: ['disabled'] }],
})
export class AveToolbarItem {}

/**
 * A line between groups of a toolbar's items (ADR 0075): a vertical `separator`.
 *
 * @alpha
 */
@Component({
  selector: '[aveToolbarSeparator]',
  host: { role: 'separator', 'aria-orientation': 'vertical' },
  template: '',
  styleUrl: './separator.css',
})
export class AveToolbarSeparator {}
