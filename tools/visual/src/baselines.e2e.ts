// Baselines and stories stay in step: a baseline without a story (a renamed or deleted story, a removed project) fails,
// so stale images never accumulate. A story without a baseline fails in stories.e2e.ts.
import { expect, test } from '@playwright/test';
import { existsSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { baselinesDir, readStories } from './story-index.ts';

test('every baseline belongs to a story and a project', () => {
  const projects = test
    .info()
    .config.projects.map((project) => project.name)
    .filter((name) => name !== 'baselines');
  const expected = new Set(readStories().flatMap((story) => projects.map((project) => `${story.id}/${project}.png`)));
  const files = existsSync(baselinesDir)
    ? readdirSync(baselinesDir, { recursive: true, withFileTypes: true })
        .filter((entry) => entry.isFile())
        .map((entry) => relative(baselinesDir, join(entry.parentPath, entry.name)))
    : [];
  expect(files.filter((file) => !expected.has(file)).sort()).toEqual([]);
});
