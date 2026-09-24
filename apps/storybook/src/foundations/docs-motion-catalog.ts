import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import type { TokenName } from '@avelune/tokens';
import { DocsPage, DocsSection } from './docs-page';

export type DurationName = Extract<TokenName, `duration.${string}`>;
export type EasingName = Extract<TokenName, `easing.${string}`>;
export type DistanceName = Extract<TokenName, `motion.distance.${string}`>;

/** One animation of the catalog: its keyframes, the tokens that time it and the pose it starts or ends in. */
export interface CatalogMotion {
  readonly className: string;
  readonly keyframes: string;
  readonly duration: DurationName;
  readonly easing: EasingName;
  /** The offset of the pose away from rest, downwards; none for a fade. */
  readonly offset?: DistanceName;
  /** Whether the pose away from rest is at motion.scale.enter. */
  readonly scales?: true;
}

/** An element that enters and leaves with animate.enter and animate.leave (brief §6.3). */
export interface CatalogEntry {
  readonly id: string;
  readonly label: string;
  readonly sample: string;
  readonly enter: CatalogMotion;
  readonly exit: CatalogMotion;
}

export const catalog: readonly CatalogEntry[] = [
  {
    id: 'popover',
    label: 'Menu, select popup, popover',
    sample: 'Hujjatni saqlash',
    enter: {
      className: 'ave-motion-popover-enter',
      keyframes: 'ave-motion-pop-in',
      duration: 'duration.normal',
      easing: 'easing.enter',
      scales: true,
    },
    exit: {
      className: 'ave-motion-popover-exit',
      keyframes: 'ave-motion-fade-out',
      duration: 'duration.fast',
      easing: 'easing.exit',
    },
  },
  {
    id: 'tooltip',
    label: 'Tooltip',
    sample: 'Сохранить как черновик',
    enter: {
      className: 'ave-motion-tooltip-enter',
      keyframes: 'ave-motion-shift-in',
      duration: 'duration.fast',
      easing: 'easing.enter',
      offset: 'motion.distance.sm',
    },
    exit: {
      className: 'ave-motion-tooltip-exit',
      keyframes: 'ave-motion-fade-out',
      duration: 'duration.fast',
      easing: 'easing.exit',
    },
  },
  {
    id: 'dialog',
    label: 'Dialog panel',
    sample: 'Hujjatni oʻchirish',
    enter: {
      className: 'ave-motion-dialog-enter',
      keyframes: 'ave-motion-pop-in',
      duration: 'duration.slow',
      easing: 'easing.enter',
      scales: true,
    },
    exit: {
      className: 'ave-motion-dialog-exit',
      keyframes: 'ave-motion-pop-out',
      duration: 'duration.normal',
      easing: 'easing.exit',
      scales: true,
    },
  },
  {
    id: 'backdrop',
    label: 'Dialog backdrop',
    sample: '',
    enter: {
      className: 'ave-motion-backdrop-enter',
      keyframes: 'ave-motion-fade-in',
      duration: 'duration.slow',
      easing: 'easing.enter',
    },
    exit: {
      className: 'ave-motion-backdrop-exit',
      keyframes: 'ave-motion-fade-out',
      duration: 'duration.normal',
      easing: 'easing.exit',
    },
  },
  {
    id: 'toast',
    label: 'Toast',
    sample: 'Документ сохранён',
    enter: {
      className: 'ave-motion-toast-enter',
      keyframes: 'ave-motion-shift-in',
      duration: 'duration.normal',
      easing: 'easing.spring',
      offset: 'motion.distance.lg',
    },
    exit: {
      className: 'ave-motion-toast-exit',
      keyframes: 'ave-motion-shift-out',
      duration: 'duration.fast',
      easing: 'easing.exit',
      offset: 'motion.distance.lg',
    },
  },
];

const short = (name: TokenName) => name.split('.').at(-1) ?? name;

/** The motion catalog of motion.css: every enter and leave class, the loops and the route cross-fade. */
@Component({
  selector: 'ave-docs-motion-catalog',
  imports: [DocsPage, DocsSection],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ave-docs-page heading="Motion catalog">
      <span lead
        >The ave-motion-* classes of &#64;avelune/ui/styles.css (brief §6.3, ADR 0031). Components put them on elements
        with animate.enter and animate.leave; every value is a token, so reduced motion needs no code: nothing moves or
        scales, slow durations shorten to 150ms, and the skeleton stands still.</span
      >
      <ave-docs-section
        heading="Enter and leave"
        note="Hide an element to play its leave class, show it to play its enter class."
      >
        <ul class="entries">
          @for (entry of catalog; track entry.id) {
            <li class="entry">
              <div class="meta">
                <span class="label">{{ entry.label }}</span>
                <code class="spec">{{ spec(entry.enter) }}</code>
                <code class="spec">{{ spec(entry.exit) }}</code>
                <button
                  type="button"
                  class="toggle"
                  [attr.aria-controls]="'ave-motion-stage-' + entry.id"
                  (click)="toggle(entry.id)"
                >
                  {{ hidden().has(entry.id) ? 'Show' : 'Hide' }} {{ entry.label.toLowerCase() }}
                </button>
              </div>
              <div class="stage" [id]="'ave-motion-stage-' + entry.id">
                @if (!hidden().has(entry.id)) {
                  <div
                    class="sample"
                    [attr.data-kind]="entry.id"
                    [attr.data-motion-sample]="entry.id"
                    [animate.enter]="entry.enter.className"
                    [animate.leave]="entry.exit.className"
                  >
                    {{ entry.sample }}
                  </div>
                }
              </div>
            </li>
          }
        </ul>
      </ave-docs-section>
      <ave-docs-section
        heading="Loops"
        note="A loop runs at a constant rate, linear, the one easing that is no token. The skeleton's highlight stands still under reduced motion; the spinner keeps turning, since rotation is not movement."
      >
        <div class="loops">
          <div class="loop">
            <div class="skeleton" aria-hidden="true">
              <div class="highlight ave-motion-shimmer" data-motion-loop="shimmer"></div>
            </div>
            <code class="spec">shimmer · timing.shimmer-period · linear</code>
          </div>
          <div class="loop">
            <div class="spinner ave-motion-spin" data-motion-loop="spin" aria-hidden="true"></div>
            <code class="spec">spin · timing.spin-period · linear</code>
          </div>
        </div>
      </ave-docs-section>
      <ave-docs-section
        heading="Route change"
        note="withViewTransitions() cross-fades the whole page, slow and standard."
      >
        <div class="route">
          <button type="button" class="toggle" (click)="crossFade()">Cross-fade the page</button>
          <span>Page {{ page() }}</span>
        </div>
      </ave-docs-section>
    </ave-docs-page>
  `,
  styleUrl: './docs-motion-catalog.css',
})
export class MotionCatalog {
  protected readonly catalog = catalog;
  protected readonly hidden = signal<ReadonlySet<string>>(new Set());
  protected readonly page = signal(1);

  protected toggle(id: string): void {
    this.hidden.update((hidden) => {
      const next = new Set(hidden);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  /** Cross-fades a change of the page number, the way the router's view transitions do. */
  protected crossFade(): void {
    const change = () => {
      this.page.update((page) => page + 1);
    };
    if (typeof document.startViewTransition === 'function') document.startViewTransition(change);
    else change();
  }

  protected spec(motion: CatalogMotion): string {
    const name = motion.className.replace('ave-motion-', '');
    return `${name}: ${motion.keyframes.replace('ave-motion-', '')} · ${short(motion.duration)} · ${short(motion.easing)}`;
  }
}
