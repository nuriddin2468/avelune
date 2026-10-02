// The schematic collections as the Angular CLI loads them from the built package (ADR 0007), and `ng add` on
// applications that @schematics/angular generates, as `ng new` would (ADR 0103): every step, the second run that
// changes nothing, the cases it leaves to the application, and the pre-paint script it writes.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { runInNewContext } from 'node:vm';

// The brand generator is loaded as @avelune/ui/theme loads it, lazily: a static import of it is a lint error in the kit.
const { aveBrandPresetNames, generateAveBrand } = await import('@avelune/tokens/brand');

const require = createRequire(import.meta.url);
const { SchematicTestRunner } =
  require('@angular-devkit/schematics/testing') as typeof import('@angular-devkit/schematics/testing');
type UnitTestTree = import('@angular-devkit/schematics/testing').UnitTestTree;

const workspaceRoot = join(import.meta.dirname, '..', '..', '..', '..');
const built = join(workspaceRoot, 'dist', 'packages', 'ui');
const manifest: unknown = JSON.parse(readFileSync(join(built, 'package.json'), 'utf8'));

/** A field of a parsed JSON value, by its path. */
const field = (value: unknown, path: readonly string[]): unknown =>
  path.reduce<unknown>(
    (node, key) => (typeof node === 'object' && node !== null ? Reflect.get(node, key) : undefined),
    value,
  );

const { prePaintScript } = require(join(built, 'schematics', 'ng-add', 'pre-paint.js')) as {
  readonly prePaintScript: string;
};
const { eslintConfig, lintPeers, stylelintConfig } = require(join(built, 'schematics', 'ng-add', 'index.js')) as {
  readonly eslintConfig: string;
  readonly lintPeers: Readonly<Record<string, string>>;
  readonly stylelintConfig: string;
};
const snippet = readFileSync(join(workspaceRoot, 'docs', 'consumers', 'AGENTS.snippet.md'), 'utf8');

/**
 * The script's SHA-256, pinned: the text is a contract with every application's index.html and its policy (ADR 0103).
 * A change needs an ng update migration that replaces the block, added in the same change as the new hash.
 */
const prePaintHash = 'lu0+pDjYjAH1WBGteu7r/XmecHmcjdyr/rfS3euuwpI=';

const runner = new SchematicTestRunner('@avelune/ui', join(built, 'schematics', 'collection.json'));

/** A workspace with one application, as `ng new` writes it, changed by `edit` before `ng add` runs. */
async function workspace(application: Record<string, unknown> = {}, edit?: (tree: UnitTestTree) => void) {
  const base = await runner.runExternalSchematic('@schematics/angular', 'workspace', {
    name: 'workspace',
    newProjectRoot: 'projects',
    version: '22.2.0',
  });
  const tree = await runner.runExternalSchematic(
    '@schematics/angular',
    'application',
    { name: 'app', ...application },
    base,
  );
  edit?.(tree);
  return tree;
}

/** Runs `ng add` and returns the tree with every message it logged. */
async function ngAdd(tree: UnitTestTree, options: Record<string, unknown> = {}) {
  const messages: string[] = [];
  const subscription = runner.logger.subscribe((entry) => messages.push(entry.message));
  try {
    const result = await runner.runSchematic('ng-add', { project: 'app', ...options }, tree);
    return { tree: result, log: messages.join('\n') };
  } finally {
    subscription.unsubscribe();
  }
}

/** Every file of a tree with its bytes, as base64 (a favicon is binary). */
function snapshot(tree: UnitTestTree): ReadonlyMap<string, string> {
  return new Map(tree.files.map((file) => [file, tree.read(file)?.toString('base64') ?? '']));
}

const indexHtml = '/projects/app/src/index.html';
const angularJson = (tree: UnitTestTree): unknown => tree.readJson('/angular.json');
const build = (tree: UnitTestTree): unknown => field(angularJson(tree), ['projects', 'app', 'architect', 'build']);

describe('built package', () => {
  it('points ng add and ng update at collections that exist', () => {
    assert.equal(field(manifest, ['schematics']), './schematics/collection.json');
    assert.equal(field(manifest, ['ng-update', 'migrations']), './schematics/migrations.json');
    assert.ok(existsSync(join(built, 'schematics', 'collection.json')));
    assert.ok(existsSync(join(built, 'schematics', 'migrations.json')));
  });

  it('moves every @avelune package together in ng update', () => {
    const names = readdirSync(join(workspaceRoot, 'packages'), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry): unknown =>
        JSON.parse(readFileSync(join(workspaceRoot, 'packages', entry.name, 'package.json'), 'utf8')),
      )
      .map((pkg) => String(field(pkg, ['name'])))
      .sort();
    const group: unknown = field(manifest, ['ng-update', 'packageGroup']);
    assert.ok(Array.isArray(group));
    assert.deepEqual(group.map((name: unknown) => String(name)).sort(), names);
  });

  it('ships the agent snippet of docs/consumers', () => {
    assert.equal(readFileSync(join(built, 'schematics', 'ng-add', 'files', 'AGENTS.snippet.md'), 'utf8'), snippet);
  });
});

describe('ng add on a new standalone application', async () => {
  const before = await workspace();
  const { tree, log } = await ngAdd(before);

  it('adds the icons at the kit’s version, the CDK and Aria at Angular’s, and the lint packages', () => {
    const pkg: unknown = tree.readJson('/package.json');
    const angular = field(pkg, ['dependencies', '@angular/core']);
    assert.equal(typeof angular, 'string');
    assert.equal(field(pkg, ['dependencies', '@avelune/icons']), `^${String(field(manifest, ['version']))}`);
    assert.equal(field(pkg, ['dependencies', '@angular/cdk']), angular);
    assert.equal(field(pkg, ['dependencies', '@angular/aria']), angular);
    for (const name of ['@avelune/eslint-config', '@avelune/stylelint-config']) {
      assert.equal(field(pkg, ['devDependencies', name]), `^${String(field(manifest, ['version']))}`);
    }
    for (const [peer, range] of Object.entries(lintPeers)) assert.equal(field(pkg, ['devDependencies', peer]), range);
    assert.ok(runner.tasks.some((task) => task.name === 'node-package'));
  });

  it('puts the kit’s stylesheet first, keeps media unhashed and turns critical-CSS inlining off', () => {
    assert.deepEqual(field(build(tree), ['options', 'styles']), [
      '@avelune/ui/styles.css',
      'projects/app/src/styles.css',
    ]);
    assert.equal(field(build(tree), ['configurations', 'production', 'outputHashing']), 'bundles');
    assert.deepEqual(field(build(tree), ['options', 'optimization']), {
      scripts: true,
      styles: { minify: true, inlineCritical: false },
      fonts: true,
    });
    assert.equal(field(build(tree), ['configurations', 'development', 'optimization']), false);
  });

  it('writes the pre-paint script after the charset and the font preload at the end of the head', () => {
    const html = tree.readText(indexHtml);
    const head = html.slice(html.indexOf('<head>'), html.indexOf('</head>'));
    assert.ok(head.indexOf('<meta charset="utf-8">') < head.indexOf('<script id="avelune-pre-paint">'));
    assert.ok(head.includes(`<!-- prettier-ignore -->\n  <script id="avelune-pre-paint">${prePaintScript}</script>`));
    assert.ok(
      head.endsWith(
        '  <link rel="preload" href="media/avelune-sans-latin.woff2" as="font" type="font/woff2" crossorigin>\n',
      ),
    );
    assert.ok(!head.includes('cyrillic'));
  });

  it('provides Avelune in the application config', () => {
    const config = tree.readText('/projects/app/src/app/app.config.ts');
    assert.match(config, /import \{ provideAvelune \} from '@avelune\/ui\/theme';/);
    assert.match(config, /providers: \[[^\]]*provideAvelune\(\)/s);
  });

  it('writes the lint configs and AGENTS.md the workspace lacked', () => {
    assert.equal(tree.readText('/eslint.config.mjs'), eslintConfig);
    assert.equal(tree.readText('/stylelint.config.mjs'), stylelintConfig);
    assert.equal(
      tree.readText('/AGENTS.md'),
      `# AGENTS.md\n\n<!-- avelune:start -->\n${snippet.trim()}\n<!-- avelune:end -->\n`,
    );
  });

  it('names the script’s hash for a policy the server sends', () => {
    assert.ok(log.includes(`'sha256-${createHash('sha256').update(prePaintScript).digest('base64')}'`));
  });

  it('changes nothing when it runs again', async () => {
    const again = await ngAdd(tree);
    assert.deepEqual(snapshot(again.tree), snapshot(tree));
    assert.doesNotMatch(again.log, /is left as it is/);
  });

  it('changes nothing after a formatter re-wrapped what it wrote', async () => {
    // The Angular CLI runs Prettier over the files a schematic wrote: it wraps long tags and pads the markers.
    const formatted = tree
      .readText('/AGENTS.md')
      .replace('<!-- avelune:start -->\n', '<!-- avelune:start -->\n\n')
      .replace('<dialog aveConfirmDialog heading', '<dialog\n  aveConfirmDialog\n  heading');
    tree.overwrite('/AGENTS.md', formatted);
    const html = tree
      .readText(indexHtml)
      .replace(
        '<link rel="preload" href="media/avelune-sans-latin.woff2" as="font" type="font/woff2" crossorigin>',
        '<link\n      rel="preload"\n      href="media/avelune-sans-latin.woff2"\n      as="font"\n      type="font/woff2"\n      crossorigin\n    />',
      );
    tree.overwrite(indexHtml, html);
    const again = await ngAdd(tree);
    assert.equal(again.tree.readText('/AGENTS.md'), formatted);
    assert.equal(again.tree.readText(indexHtml), html);
  });
});

describe('ng add on an application that has some of it already', async () => {
  const before = await workspace({}, (tree) => {
    const json = tree.readJson('/angular.json') as Record<string, unknown>;
    const options = field(json, ['projects', 'app', 'architect', 'build', 'options']) as Record<string, unknown>;
    options['outputPath'] = { base: 'dist/app', media: 'assets' };
    options['optimization'] = { scripts: true, styles: { minify: false }, fonts: false };
    tree.overwrite('/angular.json', JSON.stringify(json, null, 2));
    const config = '/projects/app/src/app/app.config.ts';
    tree.overwrite(
      config,
      `import { provideAvelune } from '@avelune/ui/theme';\n${tree.readText(config).replace('providers: [', "providers: [provideAvelune({ theme: 'light' }), ")}`,
    );
    tree.create('/eslint.config.js', 'export default [];\n');
    tree.create('/.stylelintrc.json', '{}\n');
    tree.create(
      '/AGENTS.md',
      '# Rules\n\nOur own.\n\n<!-- avelune:start -->\nAn older kit.\n<!-- avelune:end -->\n\nMore of ours.\n',
    );
    tree.create('/CLAUDE.md', '# Claude\n');
  });
  const { tree, log } = await ngAdd(before, { preloadCyrillic: true });

  it('preloads both faces from the media folder the build names', () => {
    const html = tree.readText(indexHtml);
    assert.ok(html.includes('href="assets/avelune-sans-latin.woff2"'));
    assert.ok(html.includes('href="assets/avelune-sans-cyrillic.woff2"'));
  });

  it('keeps the optimization settings it does not own', () => {
    assert.deepEqual(field(build(tree), ['options', 'optimization']), {
      scripts: true,
      styles: { minify: false, inlineCritical: false },
      fonts: false,
    });
  });

  it('leaves an existing provideAvelune and lint configs alone, and says what to add', () => {
    const config = tree.readText('/projects/app/src/app/app.config.ts');
    assert.equal(config.match(/provideAvelune\(/g)?.length, 1);
    assert.equal(tree.readText('/eslint.config.js'), 'export default [];\n');
    assert.ok(!tree.exists('/eslint.config.mjs') && !tree.exists('/stylelint.config.mjs'));
    assert.match(log, /eslint\.config\.js is left as it is/);
    assert.match(log, /\.stylelintrc\.json is left as it is/);
  });

  it('replaces the kit’s section of AGENTS.md and keeps the rest', () => {
    assert.equal(
      tree.readText('/AGENTS.md'),
      `# Rules\n\nOur own.\n\n<!-- avelune:start -->\n${snippet.trim()}\n<!-- avelune:end -->\n\nMore of ours.\n`,
    );
    assert.match(log, /add "@AGENTS\.md" to CLAUDE\.md/);
  });
});

describe('ng add in the cases it leaves to the application', () => {
  it('provides Avelune in an NgModule application', async () => {
    const { tree } = await ngAdd(await workspace({ standalone: false }));
    assert.match(tree.readText('/projects/app/src/app/app-module.ts'), /provideAvelune\(\)/);
  });

  it('skips index.html for index: false, and says so', async () => {
    const before = await workspace({}, (tree) => {
      const json = tree.readJson('/angular.json') as Record<string, unknown>;
      (field(json, ['projects', 'app', 'architect', 'build', 'options']) as Record<string, unknown>)['index'] = false;
      tree.overwrite('/angular.json', JSON.stringify(json, null, 2));
    });
    const html = before.readText(indexHtml);
    const { tree, log } = await ngAdd(before);
    assert.equal(tree.readText(indexHtml), html);
    assert.match(log, /index: false; add the font preload and the pre-paint script yourself/);
  });

  it('adds the script’s hash to a policy in index.html, and asks for script-src where there is none', async () => {
    const withPolicy = (policy: string) => (tree: UnitTestTree) => {
      const meta = `<meta http-equiv="Content-Security-Policy" content="${policy}">`;
      tree.overwrite(indexHtml, tree.readText(indexHtml).replace('<head>', `<head>\n  ${meta}`));
    };
    const hash = `'sha256-${createHash('sha256').update(prePaintScript).digest('base64')}'`;
    const strict = await ngAdd(await workspace({}, withPolicy("default-src 'self'; script-src 'self'")));
    assert.ok(strict.tree.readText(indexHtml).includes(`content="default-src 'self'; script-src 'self' ${hash}"`));
    const loose = await ngAdd(await workspace({}, withPolicy("default-src 'self'")));
    assert.ok(loose.tree.readText(indexHtml).includes(`content="default-src 'self'">`));
    assert.match(loose.log, /has no script-src; allow the pre-paint script/);
  });

  it('installs no lint package and writes no AGENTS.md when told not to', async () => {
    const { tree } = await ngAdd(await workspace(), { lint: false, agents: false });
    const pkg: unknown = tree.readJson('/package.json');
    assert.equal(field(pkg, ['devDependencies', '@avelune/eslint-config']), undefined);
    assert.ok(!tree.exists('/eslint.config.mjs') && !tree.exists('/AGENTS.md'));
  });

  it('stops on a builder other than the application builder, and on a library', async () => {
    const browser = await workspace({}, (tree) => {
      const json = tree.readJson('/angular.json') as Record<string, unknown>;
      (field(json, ['projects', 'app', 'architect', 'build']) as Record<string, unknown>)['builder'] =
        '@angular-devkit/build-angular:browser';
      tree.overwrite('/angular.json', JSON.stringify(json, null, 2));
    });
    await assert.rejects(
      ngAdd(browser),
      /builds with @angular-devkit\/build-angular:browser\. The kit needs @angular\/build:application/,
    );
    const library = await runner.runExternalSchematic(
      '@schematics/angular',
      'library',
      { name: 'lib' },
      await workspace(),
    );
    await assert.rejects(ngAdd(library, { project: 'lib' }), /lib is a library/);
  });

  it('asks for the lint configs’ own peers', () => {
    for (const name of ['eslint-config', 'stylelint-config']) {
      const pkg: unknown = JSON.parse(readFileSync(join(workspaceRoot, 'packages', name, 'package.json'), 'utf8'));
      for (const [peer, range] of Object.entries(field(pkg, ['peerDependencies']) ?? {})) {
        assert.equal(lintPeers[peer], range, `${name} peers ${peer}`);
      }
    }
  });
});

describe('the pre-paint script', () => {
  /** Runs the script against a fake page with `stored` in localStorage; what it wrote to <html> and adopted. */
  function paint(
    stored: Readonly<Record<string, string>> | 'blocked',
    attributes: Readonly<Record<string, string>> = {},
  ) {
    const written = new Map(Object.entries(attributes));
    class CSSStyleSheet {
      css = '';
      replaceSync(css: string): void {
        this.css = css;
      }
    }
    const document = {
      documentElement: {
        setAttribute: (name: string, value: string) => written.set(name, value),
        removeAttribute: (name: string) => written.delete(name),
      },
      adoptedStyleSheets: [] as readonly CSSStyleSheet[],
    };
    const localStorage = { getItem: (key: string) => (stored === 'blocked' ? null : (stored[key] ?? null)) };
    const window =
      stored === 'blocked'
        ? Object.defineProperty({}, 'localStorage', {
            get() {
              throw new Error('SecurityError');
            },
          })
        : { localStorage };
    runInNewContext(prePaintScript, { window, document, CSSStyleSheet });
    // The script builds its array in the sandbox's realm; spread it into this one's to compare.
    return {
      attributes: Object.fromEntries(written),
      sheets: [...document.adoptedStyleSheets].map((sheet) => sheet.css),
    };
  }

  it('is the pinned text', () => {
    assert.equal(createHash('sha256').update(prePaintScript).digest('base64'), prePaintHash);
  });

  it('writes the stored choices as AveTheme does, and leaves the defaults of index.html otherwise', () => {
    const stored = { 'avelune:preferences': JSON.stringify({ theme: 'dark', density: 'compact', motion: 'reduced' }) };
    assert.deepEqual(paint(stored).attributes, {
      'data-theme': 'dark',
      'data-density': 'compact',
      'data-motion': 'reduced',
    });
    const system = {
      'avelune:preferences': JSON.stringify({ theme: 'system', density: 'comfortable', motion: 'system' }),
    };
    assert.deepEqual(
      paint(system, { 'data-theme': 'light', 'data-density': 'compact', 'data-motion': 'reduced' }).attributes,
      {},
    );
    assert.deepEqual(paint({}, { 'data-theme': 'light' }).attributes, { 'data-theme': 'light' });
  });

  it('ignores values the kit does not know, broken JSON and blocked storage', () => {
    const unknown = { 'avelune:preferences': JSON.stringify({ theme: 'sepia', density: 'cosy', motion: 'full' }) };
    assert.deepEqual(paint(unknown, { 'data-theme': 'light' }).attributes, { 'data-theme': 'light' });
    assert.deepEqual(paint({ 'avelune:preferences': '{', 'avelune:brand': '[' }), { attributes: {}, sheets: [] });
    assert.deepEqual(paint({ 'avelune:preferences': '42', 'avelune:brand': 'null' }), { attributes: {}, sheets: [] });
    assert.deepEqual(paint('blocked'), { attributes: {}, sheets: [] });
  });

  it('adopts every preset’s stylesheet, whatever its fingerprint', () => {
    for (const preset of aveBrandPresetNames) {
      const { css } = generateAveBrand(preset);
      const stored = { 'avelune:brand': JSON.stringify({ input: preset, fingerprint: 'stale', css, report: {} }) };
      assert.deepEqual(paint(stored).sheets, [css], preset);
    }
  });

  it('adopts no stylesheet with a line the generator does not write', () => {
    const { css } = generateAveBrand('teal');
    const tampered = [
      css.replace(/#[0-9a-f]{6};/, 'url(https://example.com/x);'),
      css.replace(/#[0-9a-f]{6};/, 'red;'),
      css.replace('@layer tokens {', '@import url(x.css);\n@layer tokens {'),
      `${css}\nbody { display: none; }`,
      css.replace(/--ave-([a-z-]+):/, '--ave-$1 :'),
      '',
    ];
    for (const value of tampered) {
      assert.deepEqual(paint({ 'avelune:brand': JSON.stringify({ css: value }) }).sheets, [], value.slice(0, 80));
    }
  });
});
