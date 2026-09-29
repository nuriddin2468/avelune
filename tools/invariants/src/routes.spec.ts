import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { routeOf } from './routes.ts';

describe('routeOf', () => {
  it('turns each numeric segment into :n and leaves the rest', () => {
    assert.equal(routeOf('/contracts/114'), '/contracts/:n');
    assert.equal(routeOf('/contracts/114/files/3'), '/contracts/:n/files/:n');
    assert.equal(routeOf('/contracts'), '/contracts');
    assert.equal(routeOf('/'), '/');
    assert.equal(routeOf('/reports/2026-q3'), '/reports/2026-q3');
    assert.equal(routeOf('/v2/contracts'), '/v2/contracts');
  });
});
