import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseDocsIndex, parseStoryIndex } from './story-index.ts';

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

describe('parseDocsIndex', () => {
  const entry = (id: string, type: string) => ({ id, type, title: 'Components/Icon', name: 'Docs', importPath: './x' });

  it('lists the docs pages, not the stories, sorted by id', () => {
    const index = {
      v: 5,
      entries: {
        b: entry('components-icon--docs', 'docs'),
        s: entry('components-icon--default', 'story'),
        a: entry('components-button--docs', 'docs'),
      },
    };
    assert.deepEqual(parseDocsIndex(JSON.stringify(index)), [
      { id: 'components-button--docs', title: 'Components/Icon' },
      { id: 'components-icon--docs', title: 'Components/Icon' },
    ]);
  });

  it('accepts a Storybook without docs pages, and rejects a malformed one', () => {
    assert.deepEqual(parseDocsIndex(JSON.stringify({ v: 5, entries: { s: entry('a--b', 'story') } })), []);
    assert.throws(() => parseDocsIndex(JSON.stringify({ v: 5, entries: { a: { type: 'docs' } } })), /Malformed docs/);
  });
});
