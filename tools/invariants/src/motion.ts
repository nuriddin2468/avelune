// Motion invariants of brief §8.2: every animation's duration and easing equals a motion token, and under reduced
// motion no animation moves or scales anything. The one easing that is no token is `linear`, on a loop that runs at a
// constant rate (skeleton, spinner; ADR 0031). recordMotion runs in the page; the checks are pure functions.

/** One animation the page ran, as recordMotion saw it. */
export interface MotionRecord {
  readonly kind: 'transition' | 'animation' | 'script';
  /** The transitioned property, the @keyframes name or the animation id. */
  readonly name: string;
  /** The animated element as `tag#id.class::pseudo`. */
  readonly target: string;
  /** Iteration duration in milliseconds. */
  readonly duration: number;
  /** The easings that shape it, as the browser serialises them. */
  readonly easings: readonly string[];
  /** Whether it repeats forever (animation-iteration-count: infinite). */
  readonly loops: boolean;
  /** Whether its keyframes translate the element. */
  readonly moves: boolean;
  /** Whether its keyframes scale the element. */
  readonly scales: boolean;
}

/** The global recordMotion writes to. */
export const motionGlobal = '__aveMotion';

/**
 * Records every animation the page runs, from the first frame: CSS transitions, CSS animations and script animations.
 * It samples `document.getAnimations()` on every animation frame, so it also sees animations that start on
 * interaction and elements that `animate.leave` removes afterwards. Passed to `page.addInitScript`, so it must not
 * refer to anything outside its own body.
 */
export function recordMotion(): void {
  const seen = new WeakSet<Animation>();
  const records: MotionRecord[] = [];
  Reflect.set(window, '__aveMotion', records);

  const describe = (effect: KeyframeEffect): string => {
    const element = effect.target;
    if (element === null) return '(no target)';
    const id = element.id === '' ? '' : `#${element.id}`;
    const classes = [...element.classList].map((name) => `.${name}`).join('');
    return `${element.localName}${id}${classes}${effect.pseudoElement ?? ''}`;
  };

  /** The element's transform in one keyframe: translate, then scale, then transform, as CSS composes them. */
  const matrix = (keyframe: ComputedKeyframe): DOMMatrix | undefined => {
    const value = (property: string): string => {
      const raw: unknown = Reflect.get(keyframe, property);
      return typeof raw === 'string' ? raw.trim() : 'none';
    };
    try {
      let result = new DOMMatrix();
      const translate = value('translate');
      if (translate !== 'none') {
        const [x = '0', y = '0', z = '0'] = translate.split(/\s+/);
        if ([x, y, z].some((part) => part.endsWith('%'))) return undefined;
        result = result.translate(parseFloat(x), parseFloat(y), parseFloat(z));
      }
      const scale = value('scale');
      if (scale !== 'none') {
        const [sx = '1', sy = sx, sz = '1'] = scale.split(/\s+/);
        result = result.scale(parseFloat(sx), parseFloat(sy), parseFloat(sz));
      }
      const transform = value('transform');
      if (transform !== 'none') result = result.multiply(new DOMMatrix(transform));
      return result;
    } catch {
      // A relative length (translate: 100%) has no matrix without layout.
      return undefined;
    }
  };

  const changes = (keyframes: readonly ComputedKeyframe[]): { moves: boolean; scales: boolean } => {
    const matrices = keyframes.map(matrix);
    const first = matrices[0];
    if (matrices.some((each) => each === undefined) || first === undefined) {
      // Unmeasurable: any difference in the transform properties counts as movement.
      const text = keyframes.map((k) =>
        ['translate', 'scale', 'transform'].map((p) => String(Reflect.get(k, p))).join(),
      );
      return { moves: new Set(text).size > 1, scales: false };
    }
    const size = (m: DOMMatrix) => [Math.hypot(m.m11, m.m12, m.m13), Math.hypot(m.m21, m.m22, m.m23)];
    const near = (a: number, b: number, epsilon: number) => Math.abs(a - b) <= epsilon;
    let moves = false;
    let scales = false;
    for (const m of matrices) {
      if (m === undefined) continue;
      moves ||= !near(m.m41, first.m41, 0.01) || !near(m.m42, first.m42, 0.01) || !near(m.m43, first.m43, 0.01);
      const [sx = 1, sy = 1] = size(m);
      const [fx = 1, fy = 1] = size(first);
      scales ||= !near(sx, fx, 0.001) || !near(sy, fy, 0.001);
    }
    return { moves, scales };
  };

  const sample = (): void => {
    for (const animation of document.getAnimations()) {
      if (seen.has(animation)) continue;
      seen.add(animation);
      const effect = animation.effect;
      if (!(effect instanceof KeyframeEffect)) continue;
      const timing = effect.getComputedTiming();
      const keyframes = effect.getKeyframes();
      const keyframeEasings = keyframes.map((keyframe) => keyframe.easing);
      const effectEasing = timing.easing ?? 'linear';
      const kind =
        animation instanceof CSSTransition ? 'transition' : animation instanceof CSSAnimation ? 'animation' : 'script';
      records.push({
        kind,
        name:
          animation instanceof CSSTransition
            ? animation.transitionProperty
            : animation instanceof CSSAnimation
              ? animation.animationName
              : animation.id,
        target: describe(effect),
        duration: typeof timing.duration === 'number' ? timing.duration : Number.NaN,
        loops: timing.iterations === Number.POSITIVE_INFINITY,
        // A transition's curve is its effect easing; a CSS animation's is the easing of each keyframe; a script
        // animation may use either.
        easings: [
          ...new Set(
            kind === 'transition'
              ? [effectEasing]
              : kind === 'animation'
                ? keyframeEasings
                : [effectEasing, ...keyframeEasings.filter((easing) => easing !== 'linear')],
          ),
        ],
        ...changes(keyframes),
      });
    }
    requestAnimationFrame(sample);
  };
  requestAnimationFrame(sample);
}

/** Durations (ms) and easings (CSS) of the motion tokens, in every mode. */
export interface MotionTokens {
  readonly durations: ReadonlySet<number>;
  readonly easings: readonly string[];
}

interface TokenLike {
  readonly type: string;
  readonly value: unknown;
  readonly css: string;
  readonly reduced?: { readonly value: unknown; readonly css: string };
}

/** Collects the duration and easing tokens, with their reduced-motion values, from `@avelune/tokens`. */
export function motionTokens(tokens: Readonly<Record<string, TokenLike>>): MotionTokens {
  const durations = new Set<number>();
  const easings = new Set<string>();
  for (const token of Object.values(tokens)) {
    const modes = token.reduced === undefined ? [token] : [token, token.reduced];
    for (const mode of modes) {
      if (token.type === 'duration' && typeof mode.value === 'number') durations.add(mode.value);
      if (token.type === 'cubicBezier') easings.add(mode.css);
    }
  }
  return { durations, easings: [...easings] };
}

const label = (record: MotionRecord) => `${record.kind} ${record.name} on ${record.target}`;

/** The constant rate of a loop (brief §6.3: skeleton shimmer, spinner), allowed only there. */
const loopEasing = 'linear';

/**
 * Animations whose duration or easing is not a token; `linear` passes on a loop only. `easings` must be in the
 * browser's serialisation (see canonicalEasings in showcase.e2e.ts), which rewrites linear() stops, for example.
 */
export function timingViolations(
  records: readonly MotionRecord[],
  durations: ReadonlySet<number>,
  easings: ReadonlySet<string>,
): string[] {
  const problems: string[] = [];
  for (const record of records) {
    if (!durations.has(record.duration)) {
      problems.push(`${label(record)}: duration ${String(record.duration)}ms is not a duration token`);
    }
    for (const easing of record.easings) {
      if (easings.has(easing) || (record.loops && easing === loopEasing)) continue;
      problems.push(
        easing === loopEasing
          ? `${label(record)}: easing linear is for loops only, and this animation ends`
          : `${label(record)}: easing ${easing} is not an easing token`,
      );
    }
  }
  return problems;
}

/** Animations that translate or scale under reduced motion (brief §6.5: fades stay, movement goes). */
export function reducedMotionViolations(records: readonly MotionRecord[]): string[] {
  return records
    .filter((record) => record.moves || record.scales)
    .map((record) => `${label(record)}: ${record.moves ? 'moves' : 'scales'} under reduced motion`);
}
