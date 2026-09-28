import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { tokens, type TokenName } from '@avelune/tokens';
import {
  catalog,
  MotionCatalog,
  type CatalogMotion,
  type DistanceName,
  type DurationName,
} from './docs-motion-catalog';
import { DocsPage, DocsScroll, DocsSection } from './docs-page';
import { cssVar, description, namesUnder } from './token-data';

@Component({
  selector: 'ave-docs-motion',
  imports: [DocsPage, DocsScroll, DocsSection],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ave-docs-page heading="Motion">
      <span lead
        >Five durations and four easings (brief §6.2). Press a row to play it; each run is a CSS transition of
        translate, timed by the tokens. Set Motion to reduced in the toolbar: slow and slower shorten to 150ms,
        distances become 0 and nothing scales.</span
      >
      <ave-docs-section heading="Duration × easing">
        <ave-docs-scroll label="Duration and easing playground">
          <table class="grid">
            <thead>
              <tr>
                <th scope="col">Easing</th>
                @for (duration of durations; track duration) {
                  <th scope="col">
                    {{ short(duration) }} <span class="value">{{ css(duration) }}</span>
                  </th>
                }
              </tr>
            </thead>
            <tbody>
              @for (easing of easings; track easing) {
                <tr>
                  <th scope="row">
                    {{ short(easing) }}
                    <span class="description">{{ describe(easing) }}</span>
                  </th>
                  @for (duration of durations; track duration) {
                    <td>
                      <button
                        type="button"
                        class="track"
                        [attr.aria-label]="'Play ' + short(duration) + ' with ' + short(easing)"
                        [attr.aria-pressed]="played().has(easing + duration)"
                        (click)="toggle(easing + duration)"
                      >
                        <span
                          class="dot"
                          [class.moved]="played().has(easing + duration)"
                          [style.transition-duration]="variable(duration)"
                          [style.transition-timing-function]="variable(easing)"
                        ></span>
                      </button>
                    </td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </ave-docs-scroll>
        <div class="actions">
          <button type="button" class="action" (click)="playAll()">Play all</button>
        </div>
      </ave-docs-section>
      <ave-docs-section
        heading="Entry distance and scale"
        note="Popping elements enter from 97% scale; tooltips, menus and toasts enter from these offsets."
      >
        <div class="entries">
          @for (entry of entries; track entry.label) {
            <button
              type="button"
              class="entry-button"
              [attr.aria-pressed]="shown().has(entry.label)"
              (click)="toggleEntry(entry.label)"
            >
              <span class="entry-label">{{ entry.label }}</span>
              <span
                class="card"
                [class.hidden]="!shown().has(entry.label)"
                [style.--offset]="entry.offset ? variable(entry.offset) : '0px'"
                [style.--scale]="entry.scale ? variable(entry.scale) : '1'"
              >
                Hujjat saqlandi · Документ сохранён
              </span>
            </button>
          }
        </div>
      </ave-docs-section>
      <ave-docs-section heading="Timings" note="Delays, holds and loop periods of the motion catalog (brief §6.3).">
        <dl class="timings">
          @for (name of timings; track name) {
            <div>
              <dt>
                {{ name }} <span class="value">{{ css(name) }}</span>
              </dt>
              <dd>{{ describe(name) }}</dd>
            </div>
          }
        </dl>
      </ave-docs-section>
    </ave-docs-page>
  `,
  styleUrl: './docs-motion.css',
})
class Motion {
  protected readonly durations = namesUnder('duration.');
  protected readonly easings = namesUnder('easing.');
  protected readonly timings = namesUnder('timing.');
  protected readonly entries: readonly { label: string; offset?: TokenName; scale?: TokenName }[] = [
    { label: 'Tooltip: distance sm', offset: 'motion.distance.sm' },
    { label: 'Menu, popover: scale enter', scale: 'motion.scale.enter' },
    { label: 'Toast: distance lg', offset: 'motion.distance.lg' },
  ];
  protected readonly played = signal<ReadonlySet<string>>(new Set());
  protected readonly shown = signal<ReadonlySet<string>>(new Set());

  protected toggle(key: string): void {
    this.played.update((played) => {
      const next = new Set(played);
      if (!next.delete(key)) next.add(key);
      return next;
    });
  }

  protected playAll(): void {
    const all = this.easings.flatMap((easing) => this.durations.map((duration) => easing + duration));
    this.played.update((played) => (played.size === all.length ? new Set() : new Set(all)));
  }

  protected toggleEntry(label: string): void {
    this.shown.update((shown) => {
      const next = new Set(shown);
      if (!next.delete(label)) next.add(label);
      return next;
    });
  }

  protected variable(name: TokenName): string {
    return `var(${cssVar(name)})`;
  }
  protected css(name: TokenName): string {
    return tokens[name].css.startsWith('linear(') ? 'linear() spring' : tokens[name].css;
  }
  protected short(name: TokenName): string {
    return name.split('.').at(-1) ?? name;
  }
  protected describe(name: TokenName): string {
    return description(name);
  }
}

const meta: Meta = { title: 'Foundations/Motion' };
export default meta;

export const Playground: StoryObj = {
  render: () => ({ template: `<ave-docs-motion />`, moduleMetadata: { imports: [Motion] } }),
};

/** Whether the page runs in reduced motion: the media query or the attribute, as tokens.css reads them. */
function reducedMotion(): boolean {
  return (
    matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset['motion'] === 'reduced'
  );
}

/** A duration token in the current motion mode, in milliseconds. */
function milliseconds(name: DurationName | 'timing.shimmer-period' | 'timing.spin-period'): number {
  const token = tokens[name];
  return reducedMotion() && 'reduced' in token ? token.reduced.value : token.value;
}

function distance(name: DistanceName): number {
  return reducedMotion() ? tokens[name].reduced.value : tokens[name].value;
}

/** An easing as this browser serialises it, so linear() stops compare equal. */
function canonical(easing: string): string {
  return new KeyframeEffect(null, null, { easing }).getTiming().easing ?? easing;
}

interface Pose {
  readonly opacity: number;
  readonly x: number;
  readonly y: number;
  readonly scale: number;
}

function pose(element: Element): Pose {
  const style = getComputedStyle(element);
  const [x = 0, y = 0] = style.translate === 'none' ? [] : style.translate.split(/\s+/).map(parseFloat);
  return { opacity: parseFloat(style.opacity), x, y, scale: style.scale === 'none' ? 1 : parseFloat(style.scale) };
}

/** The pose of `motion` away from rest (its start when entering, its end when leaving) in the current mode. */
function expectedPose(motion: CatalogMotion): Pose {
  const scale = reducedMotion() ? tokens['motion.scale.enter'].reduced.value : tokens['motion.scale.enter'].value;
  const travel = reducedMotion() ? tokens['motion.travel.edge'].reduced.value : tokens['motion.travel.edge'].value;
  return {
    // A drawer stays opaque while it slides, and fades where it stands when it travels 0.
    opacity: motion.travels === true ? travel : 0,
    // Its offset is a share of its own width: translate reads 100% at the edge.
    x: motion.travels === true ? 100 * travel : 0,
    y: motion.offset === undefined ? 0 : distance(motion.offset),
    scale: motion.scales === true ? scale : 1,
  };
}

/** The running CSS animation of `keyframes` on the element, once the browser has started it. */
async function animationOf(element: Element, keyframes: string): Promise<CSSAnimation> {
  return waitFor(() => {
    const found = element
      .getAnimations()
      .find(
        (animation): animation is CSSAnimation =>
          animation instanceof CSSAnimation && animation.animationName === keyframes,
      );
    if (found === undefined) throw new Error(`${keyframes} has not started`);
    return found;
  });
}

/** Asserts the animation's timing tokens and its pose away from rest, then plays it to the end. */
async function expectMotion(element: Element, motion: CatalogMotion, poseAt: 'start' | 'end'): Promise<void> {
  const animation = await animationOf(element, motion.keyframes);
  const effect = animation.effect;
  if (!(effect instanceof KeyframeEffect)) throw new Error('No keyframe effect');
  await expect(effect.getComputedTiming().duration, `${motion.className} duration`).toBe(milliseconds(motion.duration));
  const easing = canonical(tokens[motion.easing].css);
  for (const keyframe of effect.getKeyframes()) {
    await expect(keyframe.easing, `${motion.className} easing`).toBe(easing);
  }
  animation.pause();
  animation.currentTime = poseAt === 'start' ? 0 : milliseconds(motion.duration);
  const actual = pose(element);
  const expected = expectedPose(motion);
  await expect(actual.opacity, `${motion.className} opacity`).toBeCloseTo(expected.opacity, 3);
  await expect(actual.x, `${motion.className} x`).toBeCloseTo(expected.x, 3);
  await expect(actual.y, `${motion.className} y`).toBeCloseTo(expected.y, 3);
  await expect(actual.scale, `${motion.className} scale`).toBeCloseTo(expected.scale, 3);
  animation.finish();
}

/** Hides and shows every entry, checking each leave and enter class, then the loops and the route cross-fade. */
async function playCatalog(canvasElement: HTMLElement): Promise<void> {
  const canvas = within(canvasElement);
  const sample = (id: string) => canvasElement.querySelector(`[data-motion-sample="${id}"]`);
  for (const entry of catalog) {
    const name = entry.label.toLowerCase();
    const leaving = sample(entry.id);
    if (leaving === null) throw new Error(`${entry.id} is not shown`);
    await userEvent.click(canvas.getByRole('button', { name: `Hide ${name}` }));
    await expectMotion(leaving, entry.exit, 'end');
    // animate.leave removes the element once its animation has finished (brief §8.2).
    await waitFor(() => expect(leaving.isConnected, `${entry.id} left the DOM`).toBe(false));
    await userEvent.click(canvas.getByRole('button', { name: `Show ${name}` }));
    const entering = await waitFor(() => {
      const element = sample(entry.id);
      if (element === null) throw new Error(`${entry.id} did not enter`);
      return element;
    });
    await expectMotion(entering, entry.enter, 'start');
    await waitFor(() => expect(entering.classList.contains(entry.enter.className)).toBe(false));
  }

  const spin = canvasElement.querySelector('[data-motion-loop="spin"]');
  const shimmer = canvasElement.querySelector('[data-motion-loop="shimmer"]');
  if (spin === null || shimmer === null) throw new Error('The loops are missing');
  const turning = await animationOf(spin, 'ave-motion-spin');
  await expect(turning.effect?.getComputedTiming().duration).toBe(milliseconds('timing.spin-period'));
  await expect(turning.effect?.getComputedTiming().iterations).toBe(Number.POSITIVE_INFINITY);
  const sweeping = shimmer
    .getAnimations()
    .filter((animation) => Number(animation.effect?.getComputedTiming().activeDuration ?? 0) > 0);
  if (reducedMotion()) {
    await expect(sweeping, 'the skeleton stands still').toEqual([]);
  } else {
    await expect(sweeping.map((animation) => animation.effect?.getComputedTiming().duration)).toEqual([
      milliseconds('timing.shimmer-period'),
    ]);
  }

  await userEvent.click(canvas.getByRole('button', { name: 'Cross-fade the page' }));
  const fades = await waitFor(() => {
    const found = document
      .getAnimations()
      .filter((animation) =>
        animation.effect instanceof KeyframeEffect
          ? (animation.effect.pseudoElement?.startsWith('::view-transition-') ?? false)
          : false,
      );
    if (found.length === 0) throw new Error('No view transition started');
    return found;
  });
  for (const fade of fades) {
    const effect = fade.effect;
    if (!(effect instanceof KeyframeEffect)) continue;
    if (!/^::view-transition-(old|new)\(root\)$/.test(effect.pseudoElement ?? '')) continue;
    await expect(effect.getComputedTiming().duration).toBe(milliseconds('duration.slow'));
    for (const keyframe of effect.getKeyframes()) {
      await expect(keyframe.easing).toBe(canonical(tokens['easing.standard'].css));
    }
  }
  for (const fade of fades) fade.finish();
}

export const Catalog: StoryObj = {
  render: () => ({ template: `<ave-docs-motion-catalog />`, moduleMetadata: { imports: [MotionCatalog] } }),
  play: async ({ canvasElement, step }) => {
    const root = document.documentElement;
    const mode = root.dataset['motion'];
    await step('every class in the current motion mode', async () => {
      await playCatalog(canvasElement);
    });
    await step('every class under reduced motion, from the token overrides alone', async () => {
      root.dataset['motion'] = 'reduced';
      try {
        await playCatalog(canvasElement);
      } finally {
        if (mode === undefined) delete root.dataset['motion'];
        else root.dataset['motion'] = mode;
      }
    });
    // The clicks were synthetic; the screenshot shows the page at rest, without a focused button.
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  },
};
