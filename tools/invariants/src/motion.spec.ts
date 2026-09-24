import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { motionTokens, reducedMotionViolations, timingViolations, type MotionRecord } from './motion.ts';

const record = (overrides: Partial<MotionRecord>): MotionRecord => ({
  kind: 'transition',
  name: 'opacity',
  target: 'div.menu',
  duration: 200,
  easings: ['cubic-bezier(0, 0, 0, 1)'],
  loops: false,
  moves: false,
  scales: false,
  ...overrides,
});

describe('motionTokens', () => {
  it('collects durations in every mode and the easing CSS values', () => {
    const { durations, easings } = motionTokens({
      'duration.normal': { type: 'duration', value: 200, css: '200ms' },
      'duration.slow': { type: 'duration', value: 300, css: '300ms', reduced: { value: 150, css: '150ms' } },
      'timing.stagger': { type: 'duration', value: 30, css: '30ms', reduced: { value: 0, css: '0ms' } },
      'easing.enter': { type: 'cubicBezier', value: [0, 0, 0, 1], css: 'cubic-bezier(0, 0, 0, 1)' },
      'easing.spring': { type: 'cubicBezier', value: [0.34, 1.36, 0.64, 1], css: 'linear(0, 1.068, 1)' },
      'space.4': { type: 'dimension', value: 16, css: '16px' },
    });
    assert.deepEqual(
      [...durations].sort((a, b) => a - b),
      [0, 30, 150, 200, 300],
    );
    assert.deepEqual(easings, ['cubic-bezier(0, 0, 0, 1)', 'linear(0, 1.068, 1)']);
  });
});

describe('timingViolations', () => {
  const durations = new Set([120, 200]);
  const easings = new Set(['cubic-bezier(0, 0, 0, 1)']);

  it('accepts token durations and easings', () => {
    assert.deepEqual(timingViolations([record({})], durations, easings), []);
  });

  it('names each raw duration and each raw easing', () => {
    assert.deepEqual(
      timingViolations(
        [record({ duration: 333 }), record({ kind: 'animation', name: 'fade', easings: ['ease-in-out'] })],
        durations,
        easings,
      ),
      [
        'transition opacity on div.menu: duration 333ms is not a duration token',
        'animation fade on div.menu: easing ease-in-out is not an easing token',
      ],
    );
  });
});

describe('timingViolations on loops', () => {
  const durations = new Set([800]);
  const easings = new Set(['cubic-bezier(0, 0, 0, 1)']);

  it('accepts linear on a loop and rejects it on an animation that ends', () => {
    const spin = record({ kind: 'animation', name: 'spin', duration: 800, easings: ['linear'] });
    assert.deepEqual(timingViolations([{ ...spin, loops: true }], durations, easings), []);
    assert.deepEqual(timingViolations([spin], durations, easings), [
      'animation spin on div.menu: easing linear is for loops only, and this animation ends',
    ]);
  });

  it('still rejects any other raw easing on a loop', () => {
    const loop = record({ kind: 'animation', name: 'pulse', duration: 800, easings: ['ease'], loops: true });
    assert.deepEqual(timingViolations([loop], durations, easings), [
      'animation pulse on div.menu: easing ease is not an easing token',
    ]);
  });
});

describe('reducedMotionViolations', () => {
  it('names animations that move or scale and lets fades and rotations through', () => {
    assert.deepEqual(
      reducedMotionViolations([
        record({}),
        record({ name: 'translate', moves: true }),
        record({ name: 'scale', scales: true }),
      ]),
      [
        'transition translate on div.menu: moves under reduced motion',
        'transition scale on div.menu: scales under reduced motion',
      ],
    );
  });
});
