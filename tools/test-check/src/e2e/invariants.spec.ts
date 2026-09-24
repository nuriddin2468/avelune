// Proves that the showcase suite (tools/invariants, ADR 0027) fails on each violation it guards against, and only on
// the screen that commits it. fixtures/invariants-site is a static site whose index links one page per violation;
// the index itself passes, with token motion of every kind.
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { before, describe, it } from 'node:test';
import { runSuite, type SuiteRun, type TestResult } from './playwright-report.ts';

describe('showcase suite', () => {
  let run: SuiteRun;

  before(() => {
    run = runSuite(
      'tools/invariants/playwright.config.ts',
      { AVELUNE_INVARIANTS_SITE: join('tools', 'test-check', 'fixtures', 'invariants-site') },
      ['--project=light-1280'],
    );
  });

  const result = (title: string): TestResult => {
    const found = run.tests.find((test) => test.title === title);
    assert.ok(found, `no test "${title}" in:\n${run.tests.map((test) => test.title).join('\n')}\n${run.log}`);
    return found;
  };
  /** The screens a test's soft assertions name: "<what> on <path>" is the first line of each error. */
  const failingScreens = (test: TestResult): string[] =>
    [...new Set(test.errors.map((error) => / on (\/\S*)$/m.exec(error.split('\n')[0] ?? '')?.[1] ?? error))].sort();

  it('fails the run', () => {
    assert.notEqual(run.status, 0, run.log);
    assert.equal(run.tests.length, 6);
  });

  it('fails axe on the screen with a violation only', () => {
    const test = result('every screen passes axe');
    assert.deepEqual(failingScreens(test), ['/axe.html']);
    assert.match(test.errors.join('\n'), /button-name/);
  });

  it('fails horizontal overflow at 320px on the wide screen only', () => {
    const test = result('no screen scrolls horizontally at 320px');
    assert.deepEqual(failingScreens(test), ['/overflow.html']);
  });

  it('fails font preloads that the face does not reuse, and accepts one that it does', () => {
    const test = result('every preloaded font is a face the screen uses, fetched once');
    assert.deepEqual(failingScreens(test), ['/font-preload.html']);
    const errors = test.errors.join('\n');
    // Without crossorigin the face fetched the file again; the hashed URL is no face's. Diff lines start with "+".
    assert.match(errors, /"declared": true,[\s+]+"fetches": 2,[\s+]+"href": "[^"]*\/fonts\/avelune-sans-latin\.woff2"/);
    assert.match(
      errors,
      /"declared": false,[\s+]+"fetches": 1,[\s+]+"href": "[^"]*\/fonts\/avelune-sans-latin-4E4FHGAG\.woff2"/,
    );
  });

  it('fails a raw duration, a raw easing and linear that ends, and accepts token motion and a linear loop', () => {
    const test = result('every animation runs on duration and easing tokens');
    assert.deepEqual(failingScreens(test), ['/raw-motion.html']);
    const errors = test.errors.join('\n');
    assert.match(errors, /fade-raw-duration: duration 333ms is not a duration token/);
    assert.match(errors, /fade-raw-easing: easing ease-in-out is not an easing token/);
    assert.match(errors, /fade-linear-once: easing linear is for loops only, and this animation ends/);
    // The control passed because its motion was measured and matched, not because nothing was recorded.
    const control: unknown = JSON.parse(test.attachments.get('motion /') ?? '[]');
    assert.ok(Array.isArray(control));
    const seen = control.map((entry: unknown) =>
      typeof entry === 'object' && entry !== null
        ? `${String(Reflect.get(entry, 'kind'))} ${String(Reflect.get(entry, 'target'))} ${String(Reflect.get(entry, 'easings'))}`
        : '',
    );
    assert.ok(
      seen.some((line) => /^animation div\.box\.fade-enter cubic-bezier\(0, 0, 0, 1\)$/.test(line)),
      seen.join('\n'),
    );
    assert.ok(
      seen.some((line) => /^animation div\.box\.fade-spring linear\(0 0%, .* 1 100%\)$/.test(line)),
      seen.join('\n'),
    );
    assert.ok(
      seen.some((line) => /^transition p\.appear cubic-bezier\(0\.2, 0, 0, 1\)$/.test(line)),
      seen.join('\n'),
    );
    assert.ok(
      seen.some((line) => /^animation div\.box\.spin-loop linear$/.test(line)),
      seen.join('\n'),
    );
  });

  it('fails movement and scaling under reduced motion on that screen only', () => {
    const test = result('nothing moves or scales under reduced motion');
    assert.deepEqual(failingScreens(test), ['/reduced-motion.html']);
    const errors = test.errors.join('\n');
    assert.match(errors, /animation rise on div\.box\.rise: moves under reduced motion/);
    assert.match(errors, /animation grow on div\.box\.grow: scales under reduced motion/);
  });

  it('fails controls of one size that differ, on that screen only, and ignores the padding of a square', () => {
    const test = result('controls of the same size share height, radius, border, font size and padding');
    assert.deepEqual(failingScreens(test), ['/same-size.html']);
    const errors = test.errors.join('\n');
    assert.match(errors, /input\[aveInput\] "Query" \(md\): height 40, but button\[aveButton\] "Search" has 36/);
    assert.doesNotMatch(errors, /aveIconButton.*padding/);
  });
});
