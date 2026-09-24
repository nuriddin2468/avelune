import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { IconError, allModule, exportName, indexModule, lucideModule, readLucide } from './lucide.ts';

const lucide: unknown = JSON.parse(
  readFileSync(createRequire(import.meta.url).resolve('lucide-static/icon-nodes.json'), 'utf8'),
);

function problemsOf(nodes: unknown): readonly string[] {
  try {
    readLucide(nodes);
  } catch (error: unknown) {
    if (error instanceof IconError) return error.problems;
    throw error;
  }
  assert.fail('expected the icons to be rejected');
}

describe('readLucide', () => {
  it('accepts every icon of the installed lucide-static, in name order', () => {
    const icons = readLucide(lucide);
    assert.equal(icons.size, Object.keys(lucide as object).length);
    assert.deepEqual(
      [...icons.keys()],
      [...icons.keys()].sort((a, b) => a.localeCompare(b)),
    );
    assert.deepEqual(icons.get('check'), [{ tag: 'path', attributes: { d: 'M20 6 9 17l-5-5' } }]);
  });

  it("keeps the dots Lucide fills, and drops Lucide's React keys", () => {
    const icons = readLucide({ dot: [['circle', { r: '1', cy: '12', cx: '12', fill: 'currentColor', key: 'a1' }]] });
    assert.deepEqual(icons.get('dot'), [
      { tag: 'circle', attributes: { cx: '12', cy: '12', fill: 'currentColor', r: '1' } },
    ]);
  });

  it('rejects every shape and name outside the rules, naming the icon and the element', () => {
    const nodes = {
      blank: [['path', { d: '' }]],
      broken: ['path'],
      empty: [],
      filled: [['rect', { x: '1', y: '1', width: '2', height: '2', fill: 'currentColor' }]],
      odd: [['path', { d: 'M0 0', transform: 'rotate(45)' }]],
      painted: [['circle', { cx: '1', cy: '1', r: '1', fill: 'red' }]],
      short: [['line', { x1: '0', x2: '1', y1: '0' }]],
      text: [['text', { x: '1' }]],
      Upper: [['path', { d: 'M0 0' }]],
    };
    assert.deepEqual(problemsOf(nodes), [
      'blank, element 1: "d" is empty',
      'broken, element 1: not a [tag, attributes] pair',
      'empty: no elements',
      'filled, element 1: <rect> attribute "fill" is not allowed',
      'odd, element 1: <path> attribute "transform" is not allowed',
      'painted, element 1: fill "red"; Lucide fills only dots, in currentColor',
      'short, element 1: <line> lacks "y2"',
      'text, element 1: <text> is not a shape Lucide draws',
      'Upper: not a kebab-case name',
    ]);
    assert.deepEqual(problemsOf(null), ['icon-nodes.json: not an object of icons']);
    assert.deepEqual(problemsOf({}), ['icon-nodes.json: no icons']);
  });

  it('rejects two names that would export under one identifier', () => {
    assert.deepEqual(problemsOf({ 'grid-2x2': [['path', { d: 'M0 0' }]], grid2x2: [['path', { d: 'M0 0' }]] }), [
      'grid2x2: exports as lucideGrid2x2, like grid-2x2',
    ]);
  });
});

describe('exportName', () => {
  it('prefixes lucide and joins the words of the name', () => {
    assert.equal(exportName('arrow-down'), 'lucideArrowDown');
    assert.equal(exportName('arrow-down-0-1'), 'lucideArrowDown01');
    assert.equal(exportName('x'), 'lucideX');
  });
});

describe('the generated modules', () => {
  const icons = readLucide({
    check: [['path', { d: 'M20 6 9 17l-5-5' }]],
    'circle-dot': [
      ['circle', { cx: '12', cy: '12', r: '10' }],
      ['circle', { cx: '12', cy: '12', r: '1', fill: 'currentColor' }],
    ],
  });

  it('writes the icon types and every name, open to declaration merging', () => {
    const source = indexModule([...icons.keys()], 'lucide-static 0.0.0');
    assert.match(source, /from lucide-static 0\.0\.0/);
    assert.match(source, /export interface IconNames \{\n {2}'check': true;\n {2}'circle-dot': true;\n\}/);
    assert.match(source, /export type IconName = keyof IconNames;/);
    assert.match(source, /export type IconTag =\n(?: {2}\| '\w+'\n)+;/);
    assert.match(source, / {2}\| 'stroke-width'\n/);
  });

  it('writes one typed export per icon on the shared viewBox and paint', () => {
    const source = lucideModule(icons, 'lucide-static 0.0.0');
    assert.match(source, /import type \{ IconAttributes, IconDefinition \} from '\.\/index\.js';/);
    assert.match(
      source,
      /export const lucideCheck: IconDefinition<'check'> = \{\n {2}name: 'check',\n {2}viewBox,\n {2}paint,\n {2}strokes: 'kit',\n {2}nodes: \[\{ tag: 'path', attrs: \{ d: "M20 6 9 17l-5-5" \} \}\],\n\};/,
    );
    assert.match(source, /\{ tag: 'circle', attrs: \{ cx: "12", cy: "12", fill: "currentColor", r: "1" \} \}/);
  });

  it('lists every icon by its import, not through the module namespace', () => {
    const source = allModule(icons, 'lucide-static 0.0.0');
    assert.match(source, /import \{ lucideCheck, lucideCircleDot \} from '\.\/lucide\.js';/);
    assert.match(
      source,
      /export const lucideIcons: readonly IconDefinition\[\] = list\(lucideCheck, lucideCircleDot\);/,
    );
    assert.doesNotMatch(source, /import \* as/);
  });
});

describe('generate.ts', () => {
  const packageRoot = join(import.meta.dirname, '..');
  const run = (dir: string) =>
    spawnSync(process.execPath, [join(import.meta.dirname, 'generate.ts'), dir], { encoding: 'utf8' });

  it('passes an untouched copy and fails a hand-edited icon, type or licence', () => {
    const dir = mkdtempSync(join(tmpdir(), 'avelune-icons-'));
    const restore = () => {
      cpSync(join(packageRoot, 'src'), join(dir, 'src'), { recursive: true });
      cpSync(join(packageRoot, 'LICENSE-lucide.txt'), join(dir, 'LICENSE-lucide.txt'));
    };
    try {
      restore();
      const clean = run(dir);
      assert.equal(clean.status, 0, clean.stderr);

      const lucideFile = join(dir, 'src', 'lucide.ts');
      writeFileSync(lucideFile, readFileSync(lucideFile, 'utf8').replace('M20 6 9 17l-5-5', 'M20 6 9 17l-6-6'));
      const edited = run(dir);
      assert.equal(edited.status, 1);
      assert.match(edited.stderr, /src\/lucide\.ts is not what lucide-static .* generates/);

      restore();
      const indexFile = join(dir, 'src', 'index.ts');
      writeFileSync(indexFile, readFileSync(indexFile, 'utf8').replace("  'badge-check': true;\n", ''));
      assert.match(run(dir).stderr, /src\/index\.ts is not what/);

      restore();
      writeFileSync(join(dir, 'LICENSE-lucide.txt'), 'MIT');
      assert.match(run(dir).stderr, /LICENSE-lucide\.txt is not what/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
