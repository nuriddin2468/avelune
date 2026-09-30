// Proves the token reference of the Foundations pages (ADR 0102): each marked table is regenerated from the tokens,
// and a group without tokens or a token in no group fails.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { fillTables, groupsOf, referenceProblems, tokenTable, tokensOf, type ReferenceToken } from './foundations.ts';

const tokens: readonly ReferenceToken[] = [
  {
    name: 'color.bg.surface',
    cssVar: '--ave-color-bg-surface',
    css: '#ffffff',
    dark: '#282423',
    description: 'Content surfaces: panels, cards | tables.',
  },
  { name: 'color.bg-x', cssVar: '--ave-color-bg-x', css: '#000000' },
  { name: 'space.4', cssVar: '--ave-space-4', css: '16px' },
];

describe('tokensOf', () => {
  it('takes a group’s tokens, not a sibling that shares its start', () => {
    assert.deepEqual(
      tokensOf('color.bg', tokens).map((token) => token.name),
      ['color.bg.surface'],
    );
  });
});

describe('tokenTable', () => {
  it('lists each token with its variable, its value, a column per mode it changes in and its description', () => {
    assert.equal(
      tokenTable(tokensOf('color.bg', tokens)),
      [
        '| Token | CSS variable | Value | Dark | Description |',
        '| --- | --- | --- | --- | --- |',
        '| `color.bg.surface` | `--ave-color-bg-surface` | `#ffffff` | `#282423` | Content surfaces: panels, cards \\| tables. |',
      ].join('\n'),
    );
  });

  it('breaks a long value after its commas, so the table keeps the page’s width', () => {
    const shadow = {
      name: 'elevation.raised',
      cssVar: '--ave-elevation-raised',
      css: '0px 1px 2px 0px #1e1b1a14, 0px 2px 4px 0px #1e1b1a0a',
    };
    assert.equal(
      tokenTable([shadow]).split('\n')[2],
      '| `elevation.raised` | `--ave-elevation-raised` | `0px 1px 2px 0px #1e1b1a14,`<br />`0px 2px 4px 0px #1e1b1a0a` |  |',
    );
  });

  it('leaves out a mode no token of the group changes in', () => {
    assert.equal(
      tokenTable(tokensOf('space', tokens)).split('\n')[0],
      '| Token | CSS variable | Value | Description |',
    );
  });
});

describe('fillTables', () => {
  it('regenerates every marked table and leaves the prose around it', () => {
    const page = '# Spacing\n\nUse `var(--ave-space-4)`.\n\n{/* tokens:space */}\nold\n{/* /tokens */}\n\nMore.\n';
    const filled = fillTables(page, tokens);
    assert.equal(
      filled,
      '# Spacing\n\nUse `var(--ave-space-4)`.\n\n{/* tokens:space */}\n\n| Token | CSS variable | Value | Description |\n' +
        '| --- | --- | --- | --- |\n| `space.4` | `--ave-space-4` | `16px` |  |\n\n{/* /tokens */}\n\nMore.\n',
    );
    assert.equal(fillTables(filled, tokens), filled);
    assert.deepEqual(groupsOf(filled), ['space']);
  });
});

describe('referenceProblems', () => {
  const page = (groups: readonly string[]) =>
    groups.map((group) => `{/* tokens:${group} */}\n{/* /tokens */}`).join('\n');

  it('accepts pages whose groups hold every token', () => {
    assert.deepEqual(referenceProblems(new Map([['a.mdx', page(['color', 'space'])]]), tokens), []);
  });

  it('fails a group without tokens and a marker left open', () => {
    assert.deepEqual(
      referenceProblems(new Map([['a.mdx', `${page(['color', 'motion'])}\n{/* tokens:space */}`]]), tokens),
      ['a.mdx: the group "motion" holds no token', 'a.mdx: a {/* tokens:… */} marker has no {/* /tokens */}'],
    );
  });

  it('fails a token in no group', () => {
    assert.deepEqual(referenceProblems(new Map([['a.mdx', page(['color'])]]), tokens), [
      'the token space.4 is in no group of a Foundations docs page: add it to one',
    ]);
  });
});
