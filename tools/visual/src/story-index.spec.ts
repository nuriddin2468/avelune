import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseStoryIndex } from './story-index.ts';

describe('parseStoryIndex', () => {
  const entry = (id: string, type: string) => ({ id, type, title: 'Foundations/Colour', name: id, importPath: './x' });

  it('lists the stories, not the docs pages, sorted by id', () => {
    const index = {
      v: 5,
      entries: {
        b: entry('foundations-colour--roles', 'story'),
        d: entry('foundations-colour--docs', 'docs'),
        a: entry('foundations-colour--contrast', 'story'),
      },
    };
    assert.deepEqual(
      parseStoryIndex(JSON.stringify(index)).map((story) => story.id),
      ['foundations-colour--contrast', 'foundations-colour--roles'],
    );
  });

  it('keeps the tags of each story, and none when the entry has none', () => {
    const index = {
      v: 5,
      entries: {
        a: { ...entry('foundations-global-styles--base', 'story'), tags: ['dev', 'forced-colors'] },
        b: entry('foundations-colour--roles', 'story'),
      },
    };
    assert.deepEqual(
      parseStoryIndex(JSON.stringify(index)).map((story) => story.tags),
      [[], ['dev', 'forced-colors']],
    );
    const badTags = { v: 5, entries: { a: { ...entry('x--y', 'story'), tags: 'forced-colors' } } };
    assert.throws(() => parseStoryIndex(JSON.stringify(badTags)), /Malformed/);
  });

  it('rejects another index format and an index without stories', () => {
    assert.throws(() => parseStoryIndex(JSON.stringify({ v: 4, entries: {} })), /format v5/);
    assert.throws(() => parseStoryIndex(JSON.stringify({ v: 5, entries: {} })), /no stories/);
    assert.throws(() => parseStoryIndex(JSON.stringify({ v: 5, entries: { a: { type: 'story' } } })), /Malformed/);
  });
});
