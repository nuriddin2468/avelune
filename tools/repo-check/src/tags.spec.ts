import assert from 'node:assert/strict';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { constrainedTags, tagProblems, workspaceProjects } from './tags.ts';

const workspaceRoot = join(import.meta.dirname, '..', '..', '..');
const constrained = new Set(['layer:tokens', 'layer:components', 'type:tool']);

describe('project tags (ADR 0001)', () => {
  it('reads the tags the module-boundary rule constrains', async () => {
    assert.deepEqual([...(await constrainedTags(workspaceRoot))].sort(), [
      'layer:components',
      'layer:composites',
      'layer:foundations',
      'layer:patterns',
      'layer:tokens',
      'type:app',
      'type:config',
      'type:tool',
    ]);
  });

  it('finds every project of the workspace tagged', async () => {
    const projects = workspaceProjects(workspaceRoot);
    assert.ok(projects.some((project) => project.name === 'repo-check'));
    assert.deepEqual(tagProblems(projects, await constrainedTags(workspaceRoot)), []);
  });

  it('accepts one constrained tag next to Nx inferred ones', () => {
    assert.deepEqual(tagProblems([{ name: 'tokens', tags: ['npm:private', 'layer:tokens'] }], constrained), []);
  });

  it('rejects a project without a constrained tag, with two, or with an unconstrained one', () => {
    assert.deepEqual(
      tagProblems(
        [
          { name: 'untagged', tags: ['npm:private'] },
          { name: 'twice', tags: ['layer:tokens', 'type:tool'] },
          { name: 'unknown', tags: ['type:widget'] },
        ],
        constrained,
      ),
      [
        'untagged: needs exactly one of layer:tokens, layer:components, type:tool; has none',
        'twice: needs exactly one of layer:tokens, layer:components, type:tool; has layer:tokens, type:tool',
        'unknown: needs exactly one of layer:tokens, layer:components, type:tool; has none',
        'unknown: type:widget is not constrained by @nx/enforce-module-boundaries',
      ],
    );
  });
});
