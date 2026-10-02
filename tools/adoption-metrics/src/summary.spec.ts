// Proves the summary, the ratchet and the command line (ADR 0105): the counts with their change, the lag in words, the
// files with the most findings, an exit of 1 when a count rose, and the summary written where CI reads it.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import type { Report } from './scan.ts';
import { increases, previousTotals, summary } from './summary.ts';

const report: Report = {
  schema: 1,
  totals: {
    rawColors: 3,
    rawPixels: 5,
    rawElements: 0,
    localKeyframes: 1,
    ngDeep: 0,
    tokenOverrides: 0,
    inlineStyles: 2,
    bannedImports: 0,
  },
  files: [{ path: 'src/app/old.css', counts: { rawColors: 3, rawPixels: 5, localKeyframes: 1 } }],
  coverage: {
    stylesheets: 4,
    componentStyles: 2,
    templates: 9,
    scripts: 12,
    skipped: { preprocessed: 0, interpolatedStyles: 1, unparsed: 0 },
  },
  kit: { installed: '0.1.0', latest: '0.2.0', behind: 'minor', distance: 1 },
  notes: ['tailwindcss is installed: its utility classes are not scanned.'],
};

describe('summary', () => {
  it('shows the counts, their change, the lag, the coverage, the notes and the files', () => {
    const text = summary('archive', report, { rawColors: 5, rawPixels: 5, localKeyframes: 0 });
    assert.match(text, /^## Avelune adoption: archive\n/);
    assert.match(text, /\| Raw colours \| 3 \| −2 \|/);
    assert.match(text, /\| Raw pixel values \| 5 \| 0 \|/);
    assert.match(text, /\| Local keyframes \| 1 \| \+1 \|/);
    assert.match(text, /\| `::ng-deep` \| 0 \| {2}\|/);
    assert.match(text, /@avelune\/ui 0\.1\.0, 1 minor version behind 0\.2\.0\./);
    assert.match(text, /Scanned: 4 stylesheets, 2 component styles, 9 templates, 12 scripts\./);
    assert.match(text, /1 interpolated component styles/);
    assert.match(text, /- tailwindcss is installed/);
    assert.match(text, /\| `src\/app\/old\.css` \| Raw colours 3, Raw pixel values 5, Local keyframes 1 \|/);
  });

  it('says when the kit is missing or up to date', () => {
    assert.match(
      summary('x', { ...report, kit: { installed: null, latest: '0.2.0', behind: 'not-installed', distance: 0 } }),
      /@avelune\/ui is not installed; the latest is 0\.2\.0\./,
    );
    assert.match(
      summary('x', { ...report, kit: { installed: '0.2.0', latest: '0.2.0', behind: 'none', distance: 0 } }),
      /@avelune\/ui 0\.2\.0, up to date with 0\.2\.0\./,
    );
  });
});

describe('the ratchet', () => {
  it('lists the counts that rose, and none that fell or stayed', () => {
    assert.deepEqual(increases(report, { rawColors: 5, rawPixels: 5, localKeyframes: 0, inlineStyles: 1 }), [
      'localKeyframes',
      'inlineStyles',
    ]);
    assert.deepEqual(increases(report, report.totals), []);
  });

  it('reads the totals of a previous report, and nothing else', () => {
    assert.deepEqual(previousTotals(report), report.totals);
    assert.deepEqual(previousTotals({ totals: { rawColors: 2, rawPixels: 'many' } }), { rawColors: 2 });
    assert.equal(previousTotals({ counts: {} }), undefined);
    assert.equal(previousTotals(null), undefined);
  });
});

describe('the command line', () => {
  const cli = join(import.meta.dirname, 'cli.ts');
  const consumer = join(import.meta.dirname, '..', 'fixtures', 'consumer');
  const run = (args: readonly string[], env: Readonly<Record<string, string>> = {}) =>
    spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8', env: { ...process.env, ...env } });

  it('writes the report and the summary, and passes the ratchet when nothing rose', () => {
    const out = mkdtempSync(join(tmpdir(), 'adoption-cli-'));
    const first = run([consumer, '--latest', '0.3.1', '--json', join(out, 'report.json'), '--name', 'fixture']);
    assert.equal(first.status, 0, first.stderr);
    const written: unknown = JSON.parse(readFileSync(join(out, 'report.json'), 'utf8'));
    assert.equal(previousTotals(written)?.rawColors, 4);
    const second = run([consumer, '--latest', '0.3.1', '--previous', join(out, 'report.json'), '--ratchet'], {
      GITHUB_STEP_SUMMARY: join(out, 'step-summary.md'),
    });
    assert.equal(second.status, 0, second.stderr);
    assert.match(readFileSync(join(out, 'step-summary.md'), 'utf8'), /\| Raw colours \| 4 \| 0 \|/);
  });

  it('fails the ratchet when a count rose', () => {
    const out = mkdtempSync(join(tmpdir(), 'adoption-cli-'));
    const lower = Object.fromEntries(Object.keys(report.totals).map((metric) => [metric, 99]));
    writeFileSync(join(out, 'previous.json'), JSON.stringify({ totals: { ...lower, rawColors: 1 } }));
    const result = run([consumer, '--latest', '0.3.1', '--previous', join(out, 'previous.json'), '--ratchet']);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Adoption went back: rawColors rose/);
  });

  it('refuses a call without one repository, and a previous file that is no report', () => {
    assert.equal(run([]).status, 2);
    const out = mkdtempSync(join(tmpdir(), 'adoption-cli-'));
    writeFileSync(join(out, 'other.json'), '{"name":"x"}');
    assert.equal(run([consumer, '--previous', join(out, 'other.json')]).status, 2);
  });
});
