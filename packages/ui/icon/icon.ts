import { Component, ElementRef, Renderer2, booleanAttribute, computed, effect, inject, input } from '@angular/core';
import { drawIcon } from './draw';
import { injectAveIcons } from './registry';
import type { AveIconDefinition, AveIconName, AveIconSize } from './types';

/** Unique id prefixes, so the gradients and clip paths of two icons on one page never meet. */
let nextIcon = 0;

/** `arrow-down` → `lucideArrowDown`, for the message about an icon nobody registered. */
const lucideExport = (name: string) =>
  `lucide${name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')}`;

/**
 * An icon registered with `provideAveIcons` (brief §9.1, ADR 0020, 0033, 0036), drawn in the current text
 * colour. It needs either a `label`, when it carries meaning of its own (it becomes an image with that name), or
 * `decorative`, when text next to it says the same (it is hidden from assistive technology). In development, one
 * without either, or with both, throws, and so does a name no provider registered.
 *
 * ```html
 * <ave-icon name="circle-alert" label="Error" />
 * <ave-icon name="download" decorative /> Download
 * ```
 *
 * @beta
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
  // The <svg> is drawn by drawIcon() from the registered icon, which may be any static SVG.
  template: '',
  styleUrl: './icon.css',
})
export class AveIcon {
  /** Which icon to draw: a name registered with `provideAveIcons`. */
  readonly name = input.required<AveIconName>();

  /** The size: `sm` 16px (default), `md` 20px, `lg` 24px. */
  readonly size = input<AveIconSize>('sm');

  /** The accessible name, for an icon that carries meaning of its own. Leave it out when the icon is `decorative`. */
  readonly label = input<string>();

  /** Hides the icon from assistive technology, for an icon that repeats what the text next to it says. */
  readonly decorative = input(false, { transform: booleanAttribute });

  private readonly icons = injectAveIcons();

  /** The registered icon of the name, or null when none is registered; throws in development then. */
  protected readonly icon = computed<AveIconDefinition | null>(() => {
    const name = this.name();
    const icon = this.icons.get(name) ?? null;
    if (icon === null && (typeof ngDevMode === 'undefined' || ngDevMode)) {
      throw new Error(
        `<ave-icon name="${name}">: no icon of this name is registered. Add ${lucideExport(name)} from ` +
          `@avelune/icons/lucide, or your own icon from defineAveIcon(), to provideAveIcons() in the providers of ` +
          `the application, the route or the component.`,
      );
    }
    return icon;
  });

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

  constructor() {
    const renderer = inject(Renderer2);
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const prefix = `ave-icon-${String(nextIcon++)}-`;
    effect(() => {
      drawIcon(renderer, host, this.icon(), this.size(), prefix);
    });
  }
}
