import { Injectable, computed, signal } from '@angular/core';
import type { AveAppLogo } from '@avelune/ui/app-shell';

/** The product's mark, the brand's orange with a white A; it reads on both bars, so it has one source. */
const mark =
  "<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'>" +
  "<rect width='32' height='32' rx='8' fill='#E95420'/>" +
  "<path d='M9 23 16 9l7 14M12 18h8' stroke='#FFFFFF' stroke-width='3' fill='none' stroke-linejoin='round'/></svg>";

/** The product's own logo, until the organisation uploads its own. */
const productLogo = `data:image/svg+xml,${encodeURIComponent(mark)}`;

/**
 * The organisation's logo, which the brand settings upload and the shell's bar shows (ADR 0089, 0092). A real
 * application keeps it on its server with the brand's colour; the showcase keeps it for the visit.
 */
@Injectable({ providedIn: 'root' })
export class Branding {
  /** The uploaded logo for the light bar, as a data URL, or `null` for the product's mark. */
  readonly light = signal<string | null>(null);
  /** The uploaded logo for the dark bar, or `null` to use the light one there too. */
  readonly dark = signal<string | null>(null);

  /** The logo the shell's bar shows: the organisation's, named by it, or the product's mark, which the name says. */
  readonly logo = computed<AveAppLogo>(() => {
    const light = this.light();
    if (light === null) return { src: productLogo, alt: '' };
    const dark = this.dark();
    return { src: light, ...(dark === null ? {} : { darkSrc: dark }), alt: 'Логотип организации' };
  });
}
