import assert from 'node:assert/strict';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { angularFloor, configuredFloor, featureFloor, floorProblems, type Floor } from './browser-floor.ts';

const workspaceRoot = join(import.meta.dirname, '..', '..', '..');
const fixture = (name: string) => configuredFloor(join(import.meta.dirname, '..', 'fixtures', 'browserslist', name));

describe('browser floor (ADR 0014)', () => {
  const features = featureFloor();
  const angular = angularFloor();
  const problems = (floor: Floor) => floorProblems(floor, features, angular);

  it('is met by the workspace .browserslistrc', () => {
    assert.deepEqual(problems(configuredFloor(workspaceRoot)), []);
  });

  it('derives the CSS feature floor of ADR 0005 from browser-compat-data', () => {
    assert.deepEqual(Object.fromEntries(features), {
      chrome: 117,
      edge: 117,
      firefox: 129,
      safari: 17.5,
      safari_ios: 17.5,
    });
  });

  it('rejects a browser below Angular supported set', () => {
    assert.deepEqual(problems(fixture('below-angular')), [
      "chrome 117: below Angular's supported set (119)",
      "edge 117: below Angular's supported set (119)",
    ]);
  });

  it('rejects a browser below the required CSS features', () => {
    assert.deepEqual(problems(fixture('below-features')), ['firefox 125: below the required CSS features (129)']);
  });

  it('rejects a floor raised above both without an ADR', () => {
    assert.deepEqual(problems(fixture('above')), [
      'chrome 125: above the floor of ADR 0014 (119); raising it needs a new ADR',
    ]);
  });

  it('rejects a missing browser', () => {
    assert.deepEqual(problems(fixture('missing')), ['safari_ios: missing from .browserslistrc; the floor is 17.5']);
  });
});
