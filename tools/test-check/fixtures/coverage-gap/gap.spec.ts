import { describe, expect, it } from 'vitest';
import { toneLabel } from './gap';

describe('coverage gap', () => {
  it('covers one branch of one function', () => {
    expect(toneLabel('accent')).toBe('Accent');
  });
});
