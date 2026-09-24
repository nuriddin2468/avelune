import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { kitIcons } from './icons.config.ts';
import { IconError, iconsModule, selectIcons } from './icons.ts';

const lucide: unknown = JSON.parse(
  readFileSync(createRequire(import.meta.url).resolve('lucide-static/icon-nodes.json'), 'utf8'),
);

function problemsOf(names: readonly string[], nodes: unknown): readonly string[] {
  try {
    selectIcons(names, nodes);
  } catch (error) {
    if (error instanceof IconError) return error.problems;
    throw error;
  }
  assert.fail('expected the icons to be rejected');
}

describe('selectIcons', () => {
  it('accepts every icon of the kit from the installed lucide-static', () => {
    const icons = selectIcons(kitIcons, lucide);
    assert.equal(icons.size, kitIcons.length);
    assert.deepEqual(icons.get('check'), [{ tag: 'path', attributes: { d: 'M20 6 9 17l-5-5' } }]);
  });

  it('sorts the attributes of each element by name', () => {
    const icons = selectIcons(['dot'], { dot: [['circle', { r: '1', cy: '12', cx: '12' }]] });
    assert.deepEqual(Object.keys(icons.get('dot')?.[0]?.attributes ?? {}), ['cx', 'cy', 'r']);
  });

  it('rejects an unknown name, an alias, and names out of order or repeated', () => {
    assert.deepEqual(problemsOf(['check', 'no-such-icon', 'trash-2'], lucide), [
      'no-such-icon: not a Lucide icon (aliases do not count; use the name in icon-nodes.json)',
      'trash-2: not a Lucide icon (aliases do not count; use the name in icon-nodes.json)',
    ]);
    assert.deepEqual(problemsOf(['x', 'check', 'check'], lucide), [
      'check: the list must be in order and without repeats (after x)',
      'check: the list must be in order and without repeats (after check)',
    ]);
  });

  it('rejects every shape outside the kit rules, naming the icon and the element', () => {
    const nodes = {
      filled: [['circle', { cx: '12', cy: '12', r: '4', fill: 'currentColor' }]],
      text: [['text', { x: '1' }]],
      star: [['polygon', { points: '12 2 15 9 22 9' }]],
      odd: [['path', { d: 'M0 0', transform: 'rotate(45)' }]],
      short: [['line', { x1: '0', x2: '1', y1: '0' }]],
      blank: [['path', { d: '' }]],
      broken: ['path'],
      empty: [],
    };
    assert.deepEqual(problemsOf(['blank', 'broken', 'empty', 'filled', 'odd', 'short', 'star', 'text'], nodes), [
      'blank, element 1: "d" is empty',
      'broken, element 1: not a [tag, attributes] pair',
      'empty: no elements',
      "filled, element 1: fill; the kit's icons are outlines only (ADR 0020)",
      'odd, element 1: <path> attribute "transform" is not allowed',
      'short, element 1: <line> lacks "y2"',
      'star, element 1: <polygon> is not a shape the kit draws',
      'text, element 1: <text> is not a shape the kit draws',
    ]);
    assert.deepEqual(problemsOf(['check'], null), [
      'check: not a Lucide icon (aliases do not count; use the name in icon-nodes.json)',
    ]);
  });
});

describe('iconsModule', () => {
  it('writes the data, the IconName union and the name list', () => {
    const source = iconsModule(selectIcons(['check', 'x'], lucide), 'lucide-static 0.0.0');
    assert.match(source, /from lucide-static 0\.0\.0/);
    assert.match(source, /"check": \[\{ tag: 'path', d: "M20 6 9 17l-5-5" \}\],/);
    assert.match(source, /export type IconName = keyof typeof icons;/);
    assert.match(source, /export const iconNames = \["check", "x"\] as const/);
    assert.match(
      source,
      /\| \{ readonly tag: 'rect'; readonly height: string;.* readonly rx\?: string; readonly ry\?: string \}/,
    );
  });
});

describe('generate.ts', () => {
  const packageRoot = join(import.meta.dirname, '..');
  const run = (dir: string) =>
    spawnSync(process.execPath, [join(import.meta.dirname, 'generate.ts'), dir], { encoding: 'utf8' });

  it('passes an untouched copy and fails a hand-edited icon or licence', () => {
    const dir = mkdtempSync(join(tmpdir(), 'avelune-icons-'));
    try {
      cpSync(join(packageRoot, 'src'), join(dir, 'src'), { recursive: true });
      cpSync(join(packageRoot, 'LICENSE-lucide.txt'), join(dir, 'LICENSE-lucide.txt'));
      assert.equal(run(dir).status, 0, run(dir).stderr);

      const moduleFile = join(dir, 'src', 'icons.ts');
      writeFileSync(moduleFile, readFileSync(moduleFile, 'utf8').replace('M20 6 9 17l-5-5', 'M20 6 9 17l-6-6'));
      const edited = run(dir);
      assert.equal(edited.status, 1);
      assert.match(edited.stderr, /src\/icons\.ts is not what icons\.config\.ts and lucide-static .* generate/);

      cpSync(join(packageRoot, 'src'), join(dir, 'src'), { recursive: true });
      writeFileSync(join(dir, 'LICENSE-lucide.txt'), 'MIT');
      assert.match(run(dir).stderr, /LICENSE-lucide\.txt is not what/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
