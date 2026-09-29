import { Component, LOCALE_ID, booleanAttribute, computed, effect, inject, input, signal } from '@angular/core';
import { initialsOf } from './initials';
import type { AveAvatarKind, AveAvatarSize } from './types';

/** A URL as a CSS `url()`: its quotes and backslashes escaped, its line breaks dropped. */
function cssUrl(url: string): string {
  return `url("${url.replace(/[\n\r\f]/g, '').replace(/["\\]/g, '\\$&')}")`;
}

/**
 * The kit's avatar (brief §9.4, ADR 0082): a person or an organisation by their initials on the neutral fill, a
 * circle for a person and a rounded square for an organisation, with their photo over the initials once it has
 * loaded. It is an image named by `name`; beside the name it shows, make it `decorative`.
 *
 * ```html
 * <ave-avatar name="Азиза Каримова" decorative /> Азиза Каримова
 * <ave-avatar name="ООО «Мебель Сервис»" kind="organization" />
 * ```
 *
 * @alpha
 */
@Component({
  selector: 'ave-avatar',
  host: {
    '[attr.role]': 'decorative() ? null : "img"',
    '[attr.aria-label]': 'decorative() ? null : name()',
    '[attr.aria-hidden]': 'decorative() ? "true" : null',
    '[attr.data-kind]': 'kind()',
    '[attr.data-size]': 'size()',
    '[attr.data-photo]': 'photo() === null ? null : ""',
    '[style.--ave-avatar-photo]': 'photo()',
  },
  template: `<span class="initials" aria-hidden="true">{{ letters() }}</span>`,
  styleUrl: './avatar.css',
})
export class AveAvatar {
  /** Whose avatar it is: a person's full name or an organisation's; it names the image and gives the initials. */
  readonly name = input.required<string>();

  /** A `person` (default), a circle, or an `organization`, a rounded square. */
  readonly kind = input<AveAvatarKind>('person');

  /** `sm` 24px, `md` 32px (default) or `lg` 40px. */
  readonly size = input<AveAvatarSize>('md');

  /** The photo's address; it covers the initials once it has loaded, and the initials stay if it fails. */
  readonly image = input<string>();

  /** The initials to show instead of the kit's (the first letters of the first two words), when they do not fit. */
  readonly initials = input<string>();

  /** Hides the avatar from assistive technology, for an avatar beside the name it shows. */
  readonly decorative = input(false, { transform: booleanAttribute });

  private readonly locale = inject(LOCALE_ID);

  protected readonly letters = computed(() => this.initials() ?? initialsOf(this.name(), this.kind(), this.locale));

  /** The photo as a CSS image once it has loaded; `null` before, without one, or when it failed. */
  protected readonly photo = signal<string | null>(null);

  constructor() {
    // The photo is loaded apart and drawn as the avatar's background only once it has come, so a slow or broken
    // photo never covers the initials. There is no photo on the server.
    effect((onCleanup) => {
      const src = this.image();
      this.photo.set(null);
      if (src === undefined || typeof Image === 'undefined') return;
      const probe = new Image();
      probe.onload = () => {
        this.photo.set(cssUrl(src));
      };
      probe.src = src;
      onCleanup(() => {
        probe.onload = null;
      });
    });
  }
}
