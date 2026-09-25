import { Component, computed, input } from '@angular/core';
import { lucideLoaderCircle } from '@avelune/icons/lucide';
import { AveIcon, provideAveIcons, type AveIconName, type AveIconSize } from '@avelune/ui/icon';
import { AveButton } from './button';

/**
 * A button shown as an icon alone (ADR 0038): a square `AveButton` with the same variants, sizes and states, whose
 * `label` is its accessible name. Register the icon with `provideAveIcons`. In development an empty label throws.
 *
 * ```html
 * <button aveIconButton type="button" icon="x" label="Close"></button>
 * <button aveIconButton type="button" variant="ghost" size="sm" icon="trash" label="Delete row"></button>
 * ```
 *
 * @beta
 */
@Component({
  selector: 'button[aveIconButton], a[aveIconButton]',
  imports: [AveIcon],
  providers: [provideAveIcons([lucideLoaderCircle])],
  host: {
    '[attr.aria-label]': 'accessibleName()',
  },
  template: `
    <span class="content"><ave-icon [name]="icon()" decorative [size]="iconSize()" /></span>
    @if (spinner()) {
      <ave-icon class="spinner ave-motion-spin" name="loader-circle" decorative [size]="iconSize()" />
    }
  `,
  styleUrls: ['./button.css', './icon-button.css'],
})
export class AveIconButton extends AveButton {
  /** The icon: a name registered with `provideAveIcons`. It is decorative; `label` names the button. */
  readonly icon = input.required<AveIconName>();

  /** The accessible name, which says what the button does: "Close", "Delete row". */
  readonly label = input.required<string>();

  /** The icon size for the button size: 16px in `sm` and `md`, 20px in `lg`. */
  protected readonly iconSize = computed<AveIconSize>(() => (this.size() === 'lg' ? 'md' : 'sm'));

  /** The label; throws in development when it is empty. */
  protected readonly accessibleName = computed(() => {
    const label = this.label().trim();
    if (label === '' && (typeof ngDevMode === 'undefined' || ngDevMode)) {
      throw new Error(`<button aveIconButton icon="${this.icon()}">: set a label that says what the button does.`);
    }
    return label;
  });
}
