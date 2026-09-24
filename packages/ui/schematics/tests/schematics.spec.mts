// The schematic collections as the Angular CLI loads them from the built package (ADR 0007): `ng add` runs, and
// `ng update` finds its migration collection, which stays empty until the first breaking change.
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const require = createRequire(import.meta.url);
const { SchematicTestRunner } =
  require('@angular-devkit/schematics/testing') as typeof import('@angular-devkit/schematics/testing');

const workspaceRoot = join(import.meta.dirname, '..', '..', '..', '..');
const built = join(workspaceRoot, 'dist', 'packages', 'ui');
const manifest: unknown = JSON.parse(readFileSync(join(built, 'package.json'), 'utf8'));
const field = (path: readonly string[]): unknown =>
  path.reduce<unknown>((node, key) => Reflect.get(Object(node), key), manifest);

describe('built package', () => {
  it('points ng add and ng update at collections that exist', () => {
    assert.equal(field(['schematics']), './schematics/collection.json');
    assert.equal(field(['ng-update', 'migrations']), './schematics/migrations.json');
    assert.ok(existsSync(join(built, 'schematics', 'collection.json')));
    assert.ok(existsSync(join(built, 'schematics', 'migrations.json')));
  });

  it('moves every @avelune package together in ng update', () => {
    const names = readdirSync(join(workspaceRoot, 'packages'), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry): unknown =>
        JSON.parse(readFileSync(join(workspaceRoot, 'packages', entry.name, 'package.json'), 'utf8')),
      )
      .map((pkg) => String(Reflect.get(Object(pkg), 'name')))
      .sort();
    const group: unknown = field(['ng-update', 'packageGroup']);
    assert.ok(Array.isArray(group));
    assert.deepEqual(group.map((name: unknown) => String(name)).sort(), names);
  });
});

describe('ng add', () => {
  it('runs and, until Phase 6, changes no file', async () => {
    const runner = new SchematicTestRunner('@avelune/ui', join(built, 'schematics', 'collection.json'));
    const messages: string[] = [];
    runner.logger.subscribe((entry) => messages.push(entry.message));
    const tree = await runner.runSchematic('ng-add', { project: 'showcase' });
    assert.deepEqual(tree.files, []);
    assert.match(messages.join('\n'), /@avelune\/ui: ng add ran for showcase/);
  });
});

describe('ng update', () => {
  it('loads the migration collection, which has no migrations yet', () => {
    const runner = new SchematicTestRunner('@avelune/ui-migrations', join(built, 'schematics', 'migrations.json'));
    assert.deepEqual(runner.engine.createCollection('@avelune/ui-migrations').listSchematicNames(), []);
  });
});
