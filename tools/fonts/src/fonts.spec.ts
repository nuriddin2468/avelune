import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import * as fontkit from 'fontkit';
import { families, subsetFile, subsets } from './config.ts';
import { coverageProblems, outputDir, remapGlyphs, renameFont, reservedNameRecords, sourceDir } from './fonts.ts';
import { checksum, readCmap, readNames, readSfnt, writeCmap, writeNames, writeSfnt } from './sfnt.ts';

const [sans, mono] = families;
if (sans === undefined || mono === undefined) throw new Error('expected the sans and mono families');
const source = readFileSync(join(sourceDir, sans.source));

describe('sfnt', () => {
  it('rebuilds a font whose whole-file checksum is the magic number', () => {
    const rebuilt = writeSfnt(readSfnt(source));
    assert.equal(checksum(rebuilt), 0xb1b0afba);
    assert.deepEqual([...readSfnt(rebuilt).tables.keys()].sort(), [...readSfnt(source).tables.keys()].sort());
  });

  it('round-trips the name and cmap tables', () => {
    const tables = readSfnt(source).tables;
    const name = tables.get('name');
    const cmap = tables.get('cmap');
    assert.ok(name !== undefined && cmap !== undefined);
    assert.deepEqual(
      readNames(writeNames(readNames(name))),
      [...readNames(name)].sort(
        (a, b) =>
          a.platformId - b.platformId ||
          a.encodingId - b.encodingId ||
          a.languageId - b.languageId ||
          a.nameId - b.nameId,
      ),
    );
    assert.deepEqual(readCmap(writeCmap(readCmap(cmap))), readCmap(cmap));
  });
});

describe('the Reserved Font Name', () => {
  const names = (font: Uint8Array) => readNames(readSfnt(font).tables.get('name') ?? new Uint8Array());

  it('is found in the unmodified font', () => {
    assert.ok(reservedNameRecords(names(source)).length > 0);
  });

  it('is gone after renaming, except in copyright, trademark and licence records', () => {
    const renamed = names(renameFont(source, sans));
    assert.deepEqual(reservedNameRecords(renamed), []);
    assert.ok(renamed.some((record) => record.nameId === 1 && record.text === 'Avelune Sans'));
    assert.ok(renamed.some((record) => record.nameId === 7 && record.text.includes('IBM Plex')));
  });
});

describe('remapGlyphs', () => {
  it('draws ʻ and ʼ with the glyphs of ‘ and ’', () => {
    const cmap = readCmap(readSfnt(remapGlyphs(source, sans.glyphRemap)).tables.get('cmap') ?? new Uint8Array());
    assert.equal(cmap.get(0x02bb), cmap.get(0x2018));
    assert.equal(cmap.get(0x02bc), cmap.get(0x2019));
  });
});

describe('coverageProblems', () => {
  const shippedCmaps = (family = sans) =>
    new Map(
      subsets.map((subset) => {
        const font = fontkit.create(readFileSync(join(outputDir, subsetFile(family, subset))));
        assert.ok('characterSet' in font);
        return [subset.name, new Set(font.characterSet)] as const;
      }),
    );

  it('finds nothing missing in the shipped files of either family', () => {
    assert.deepEqual(coverageProblems(sans, shippedCmaps(sans)), []);
    assert.deepEqual(coverageProblems(mono, shippedCmaps(mono)), []);
  });

  it('reports a letter the font lacks (Uzbek Ғ removed from the cyrillic cmap)', () => {
    const cmaps = shippedCmaps();
    const cyrillic = new Set(cmaps.get('cyrillic'));
    cyrillic.delete(0x0492);
    cmaps.set('cyrillic', cyrillic);
    assert.ok(
      coverageProblems(sans, cmaps).some(
        (p) => p.locale === 'uz-Cyrl' && p.character === 'Ғ' && /not in the font/.test(p.problem),
      ),
    );
  });

  it("reports a letter no subset's unicode-range declares (Google's cyrillic range, without the Uzbek letters)", () => {
    const googleCyrillic = subsets.map((subset) =>
      subset.name === 'cyrillic'
        ? {
            ...subset,
            ranges: [
              [0x0301, 0x0301],
              [0x0400, 0x045f],
              [0x0490, 0x0491],
              [0x04b0, 0x04b1],
              [0x2116, 0x2116],
            ] as const,
          }
        : subset,
    );
    const problems = coverageProblems(sans, shippedCmaps(), googleCyrillic);
    assert.deepEqual(
      problems
        .filter((p) => p.locale === 'uz-Cyrl')
        .map((p) => p.character)
        .sort(),
      ['Ғ', 'Ҳ', 'Қ', 'ғ', 'ҳ', 'қ'].sort(),
    );
  });
});

describe('Avelune Mono', () => {
  it('is renamed and keeps Plex Mono out of its names', () => {
    const renamed = readNames(
      readSfnt(renameFont(readFileSync(join(sourceDir, mono.source)), mono)).tables.get('name') ?? new Uint8Array(),
    );
    assert.deepEqual(reservedNameRecords(renamed), []);
    assert.ok(renamed.some((record) => record.nameId === 1 && record.text === 'Avelune Mono'));
  });
});

describe('the fonts CLI', () => {
  const script = join(import.meta.dirname, 'cli.ts');
  const run = (...args: string[]) => spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' });
  let directory = '';

  before(() => {
    directory = mkdtempSync(join(tmpdir(), 'avelune-fonts-'));
  });
  after(() => rmSync(directory, { recursive: true, force: true }));

  it('accepts the committed files', () => {
    const result = run();
    assert.equal(result.status, 0, result.stderr);
  });

  it('rejects a changed or unknown file', () => {
    cpSync(outputDir, directory, { recursive: true });
    writeFileSync(
      join(directory, 'fonts.css'),
      readFileSync(join(directory, 'fonts.css'), 'utf8').replace('swap', 'block'),
    );
    writeFileSync(join(directory, 'extra.woff2'), 'x');
    const result = run('--dir', directory);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /fonts\.css is not what the build produces/);
    assert.match(result.stderr, /extra\.woff2 is not produced by the build/);
  });
});
