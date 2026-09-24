import { Component, booleanAttribute, computed, input } from '@angular/core';
import { icons, type IconElement, type IconName } from '@avelune/icons';

/**
 * The name of an icon in the kit's set (`@avelune/icons`, Lucide names).
 *
 * @alpha
 */
export type AveIconName = IconName;

/**
 * Icon sizes: `sm` 16px, `md` 20px, `lg` 24px (the `size.icon.*` tokens).
 *
 * @alpha
 */
export type AveIconSize = 'sm' | 'md' | 'lg';

/**
 * Stroke widths in units of the 24 × 24 grid, frozen with the kit (ADR 0033): 1.5px at 16 and 20px, 1.75px at 24px,
 * so strokes stay as heavy as the text they stand next to.
 */
const strokeWidths = { sm: 2.25, md: 1.8, lg: 1.75 } as const satisfies Record<AveIconSize, number>;

/**
 * An icon from the kit's set (brief §9.1, ADR 0020, 0033), drawn in the current text colour. It needs either a
 * `label`, when it carries meaning of its own (it becomes an image with that name), or `decorative`, when text next
 * to it says the same (it is hidden from assistive technology). In development, one without either, or with both,
 * throws.
 *
 * ```html
 * <ave-icon name="circle-alert" label="Error" />
 * <ave-icon name="download" decorative /> Download
 * ```
 *
 * @alpha
 */
@Component({
  selector: 'ave-icon',
  host: {
    '[attr.data-icon]': 'name()',
    '[attr.data-size]': 'size()',
    '[attr.role]': 'accessibleName() === null ? null : "img"',
    '[attr.aria-label]': 'accessibleName()',
    '[attr.aria-hidden]': 'accessibleName() === null ? "true" : null',
  },
  template: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
      [attr.stroke-width]="strokeWidth()"
    >
      @for (element of elements(); track $index) {
        <!-- The last branch narrows to rect, so a shape the icons package starts to accept fails to compile here. -->
        @if (element.tag === 'path') {
          <svg:path [attr.d]="element.d" />
        } @else if (element.tag === 'circle') {
          <svg:circle [attr.cx]="element.cx" [attr.cy]="element.cy" [attr.r]="element.r" />
        } @else if (element.tag === 'line') {
          <svg:line [attr.x1]="element.x1" [attr.x2]="element.x2" [attr.y1]="element.y1" [attr.y2]="element.y2" />
        } @else {
          <svg:rect
            [attr.x]="element.x"
            [attr.y]="element.y"
            [attr.width]="element.width"
            [attr.height]="element.height"
            [attr.rx]="element.rx ?? null"
            [attr.ry]="element.ry ?? null"
          />
        }
      }
    </svg>
  `,
  styleUrl: './icon.css',
})
export class AveIcon {
  /** Which icon to draw. */
  readonly name = input.required<AveIconName>();

  /** The size: `sm` 16px (default), `md` 20px, `lg` 24px. */
  readonly size = input<AveIconSize>('sm');

  /** The accessible name, for an icon that carries meaning of its own. Leave it out when the icon is `decorative`. */
  readonly label = input<string>();

  /** Hides the icon from assistive technology, for an icon that repeats what the text next to it says. */
  readonly decorative = input(false, { transform: booleanAttribute });

  /** The shapes of the icon, drawn by the template. */
  protected readonly elements = computed<readonly IconElement[]>(() => icons[this.name()]);

  /** The stroke width of the size, in grid units. */
  protected readonly strokeWidth = computed(() => strokeWidths[this.size()]);

  /** The label, or null for a decorative icon; throws in development when the two contradict each other. */
  protected readonly accessibleName = computed(() => {
    const label = this.label()?.trim() ?? '';
    const decorative = this.decorative();
    if (typeof ngDevMode === 'undefined' || ngDevMode) {
      if (label === '' && !decorative) {
        throw new Error(
          `<ave-icon name="${this.name()}">: set a label, or mark it decorative when text says the same.`,
        );
      }
      if (label !== '' && decorative) {
        throw new Error(`<ave-icon name="${this.name()}">: a decorative icon has no label; remove one of the two.`);
      }
    }
    return decorative || label === '' ? null : label;
  });
}
