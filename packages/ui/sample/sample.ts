import { Directive, booleanAttribute, input } from '@angular/core';

/**
 * Tones supported by {@link AveSample}.
 *
 * @alpha
 */
export type AveSampleTone = 'neutral' | 'accent';

/**
 * Scaffolding entry point. It proves the entry-point layout, the `testing` entry point, the API report and the
 * layer manifest before any real component exists. It is removed when the first real entry point lands (ROADMAP,
 * Phase 4).
 *
 * @alpha
 */
@Directive({
  selector: '[aveSample]',
  host: {
    '[attr.data-tone]': 'tone()',
    '[attr.data-disabled]': 'disabled() || null',
  },
})
export class AveSample {
  /** Visual tone, reflected as `data-tone` on the host. */
  readonly tone = input<AveSampleTone>('neutral');

  /** Whether the sample is disabled, reflected as `data-disabled` on the host. */
  readonly disabled = input(false, { transform: booleanAttribute });
}
