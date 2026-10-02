// Proves the scan on fixture repositories (ADR 0105): every metric at the count its fixture documents, build output,
// dependencies and tests left out, disable comments ignored, the version read from node_modules first.
import assert from 'node:assert/strict';
import { cpSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { scan } from './scan.ts';

const fixtures = join(import.meta.dirname, '..', 'fixtures');

/** A copy of a fixture repository with extra files, which git would not keep (build output, node_modules). */
function repository(fixture: string, extra: Readonly<Record<string, string>> = {}): string {
  const root = mkdtempSync(join(tmpdir(), `adoption-${fixture}-`));
  cpSync(join(fixtures, fixture), root, { recursive: true });
  for (const [file, content] of Object.entries(extra)) {
    mkdirSync(join(root, file, '..'), { recursive: true });
    writeFileSync(join(root, file), content);
  }
  return root;
}

describe('a consumer with something of everything', async () => {
  const report = await scan(
    repository('consumer', {
      'dist/main.css': '.built { color: #ffffff; }\n',
      'node_modules/some-library/styles.css': '.library { color: red; }\n',
      'node_modules/@avelune/ui/package.json': '{ "name": "@avelune/ui", "version": "0.2.0" }\n',
      'public/viewer/viewer.css': '.viewer { color: #333333; }\n',
      'src/assets/chart.min.css': '.chart{color:#333}\n',
      'src/legacy/widget.css': '.widget { color: #333333; }\n',
    }),
    { latest: '0.3.1', exclude: ['src/legacy/**'] },
  );

  it('counts every metric as its fixture says', () => {
    assert.deepEqual(report.totals, {
      rawColors: 4,
      rawPixels: 3,
      rawElements: 2,
      localKeyframes: 2,
      ngDeep: 1,
      tokenOverrides: 2,
      inlineStyles: 1,
      bannedImports: 1,
    });
  });

  it('lists the files with findings, the most first, and leaves out what is not the application’s code', () => {
    assert.deepEqual(report.files, [
      {
        path: 'src/styles.css',
        counts: { rawColors: 4, rawPixels: 2, localKeyframes: 1, ngDeep: 1, tokenOverrides: 2 },
      },
      {
        path: 'src/app/report.component.ts',
        counts: { rawPixels: 1, rawElements: 1, localKeyframes: 1, inlineStyles: 1, bannedImports: 1 },
      },
      { path: 'src/app/list.html', counts: { rawElements: 1 } },
    ]);
  });

  it('says what it scanned and what it could not', () => {
    assert.deepEqual(report.coverage, {
      stylesheets: 1,
      componentStyles: 3,
      templates: 2,
      scripts: 1,
      skipped: { preprocessed: 1, interpolatedStyles: 1, unparsed: 0 },
    });
    assert.deepEqual(report.notes, [
      'tailwindcss is installed: its utility classes are not scanned.',
      '1 SCSS, Sass or Less files are not scanned.',
    ]);
  });

  it('reads the installed version before the range in package.json', () => {
    assert.deepEqual(report.kit, { installed: '0.2.0', latest: '0.3.1', behind: 'minor', distance: 1 });
  });
});

describe('a consumer on the kit alone', () => {
  it('counts nothing and is up to date', async () => {
    const report = await scan(repository('clean'), { latest: '0.3.1' });
    assert.ok(Object.values(report.totals).every((count) => count === 0));
    assert.deepEqual(report.files, []);
    assert.deepEqual(report.kit, { installed: '0.3.1', latest: '0.3.1', behind: 'none', distance: 0 });
    assert.deepEqual(report.notes, []);
  });

  it('still counts what a disable comment silences', async () => {
    const report = await scan(
      repository('clean', {
        'src/app/legacy.css': '/* stylelint-disable */\n.legacy {\n  color: #e95420;\n}\n',
        'src/app/legacy.ts':
          "// eslint-disable-next-line no-restricted-imports -- legacy\nimport { trigger } from '@angular/animations';\n\nexport const legacy = trigger;\n",
      }),
      { latest: '0.3.1' },
    );
    assert.equal(report.totals.rawColors, 1);
    assert.equal(report.totals.bannedImports, 1);
  });
});
