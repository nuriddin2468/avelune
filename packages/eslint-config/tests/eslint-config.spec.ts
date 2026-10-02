// Proves @avelune/eslint-config as an application loads it: the built dist/index.js, which the package's name resolves
// to, lints templates, inline templates and imports, and turns its errors into warnings on legacy paths (ADR 0104).
import avelune, { kitElements, restrictedImports } from '../dist/index.js';
import { ESLint, type Linter } from 'eslint';
import { defineConfig } from 'eslint/config';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { pathToFileURL } from 'node:url';

const packageDir = join(import.meta.dirname, '..');

/** The rule and severity of every finding for `code` linted as `file` under `config`. */
async function lint(code: string, file: string, config: Linter.Config[] = avelune()): Promise<readonly string[]> {
  const eslint = new ESLint({ cwd: packageDir, overrideConfigFile: true, overrideConfig: config });
  const [result] = await eslint.lintText(code, { filePath: join(packageDir, file) });
  return (result?.messages ?? []).map((message) => `${message.ruleId ?? 'fatal'} ${String(message.severity)}`);
}

describe('templates', () => {
  it('accepts the kit elements, a named icon and an icon button without content', async () => {
    const code = `
      <button aveButton type="button">Save changes</button>
      <button aveIconButton type="button" label="Close"></button>
      <input aveInput aria-label="Name" />
      <ave-icon name="check" decorative />
    `;
    assert.deepEqual(await lint(code, 'src/app/form.html'), []);
  });

  it('rejects a raw element, an unnamed icon and an inline style', async () => {
    const code = `
      <button type="button">Save</button>
      <ave-icon name="check" />
      <p style="color: red">Note</p>
    `;
    assert.deepEqual(await lint(code, 'src/app/form.html'), [
      'avelune/no-raw-elements 2',
      'avelune/icon-label 2',
      '@angular-eslint/template/no-inline-styles 2',
    ]);
  });

  it('applies angular-eslint’s accessibility rules', async () => {
    assert.deepEqual(await lint('<img src="logo.png" />', 'src/app/logo.html'), [
      '@angular-eslint/template/alt-text 2',
    ]);
  });

  it('lints a component’s inline template', async () => {
    const code = `
      import { Component } from '@angular/core';
      @Component({ selector: 'app-go', template: '<button type="button">Go</button>' })
      export class Go {}
    `;
    assert.deepEqual(await lint(code, 'src/app/go.ts'), ['avelune/no-raw-elements 2']);
  });
});

describe('imports', () => {
  it('rejects the animations package, Angular Material and a kit entry point’s internals', async () => {
    const code = `
      import { trigger } from '@angular/animations';
      import { MatButton } from '@angular/material/button';
      import { AveButton } from '@avelune/ui/button/button';
      export const used = [trigger, MatButton, AveButton];
    `;
    assert.deepEqual(await lint(code, 'src/app/imports.ts'), [
      'no-restricted-imports 2',
      'no-restricted-imports 2',
      'no-restricted-imports 2',
    ]);
  });

  it('accepts an entry point and its testing entry point', async () => {
    const code = `
      import { AveButton } from '@avelune/ui/button';
      import { AveButtonHarness } from '@avelune/ui/button/testing';
      export const used = [AveButton, AveButtonHarness];
    `;
    assert.deepEqual(await lint(code, 'src/app/imports.ts'), []);
  });

  it('exports the restricted imports and the kit elements for an application that merges them', () => {
    assert.ok(restrictedImports.paths.some((path) => path.name === '@angular/animations'));
    assert.deepEqual(kitElements['button'], ['aveButton', 'aveIconButton']);
  });
});

describe('legacy paths', () => {
  const config = avelune({ legacy: ['src/app/legacy/**'] });
  const raw = '<button type="button">Save</button>';

  it('warns there, with the rule’s options kept', async () => {
    assert.deepEqual(await lint(raw, 'src/app/legacy/old.html', config), ['avelune/no-raw-elements 1']);
    assert.deepEqual(
      await lint('<button aveButton type="button">Save</button>', 'src/app/legacy/old.html', config),
      [],
    );
    assert.deepEqual(await lint("import '@angular/animations';", 'src/app/legacy/old.ts', config), [
      'no-restricted-imports 1',
    ]);
  });

  it('keeps errors everywhere else', async () => {
    assert.deepEqual(await lint(raw, 'src/app/new.html', config), ['avelune/no-raw-elements 2']);
  });

  it('accepts the config in ESLint’s own defineConfig', () => {
    assert.ok(defineConfig(avelune()).length > 0);
  });
});

describe('the agent snippet', () => {
  const snippet = readFileSync(join(packageDir, '..', '..', 'docs', 'consumers', 'AGENTS.snippet.md'), 'utf8');
  const blocks = [...snippet.matchAll(/^```(html|ts)\n([\s\S]*?)^```$/gm)];

  it('has template and script examples', () => {
    assert.ok(blocks.filter(([, language]) => language === 'html').length >= 3);
    assert.ok(blocks.filter(([, language]) => language === 'ts').length >= 2);
  });

  for (const [index, [, language = '', code = '']] of blocks.entries()) {
    it(`example ${String(index + 1)} (${language}) passes the config it teaches`, async () => {
      assert.deepEqual(await lint(code, `src/app/snippet-${String(index + 1)}.${language}`), []);
    });
  }
});

describe('the bundle', () => {
  it('is what an application gets for the package’s name', () => {
    assert.equal(
      import.meta.resolve('@avelune/eslint-config'),
      pathToFileURL(join(packageDir, 'dist', 'index.js')).href,
    );
  });

  it('imports only the packages its manifest names, and Node’s built-ins', () => {
    const manifest: unknown = JSON.parse(readFileSync(join(packageDir, 'package.json'), 'utf8'));
    const declared = ['peerDependencies', 'dependencies'].flatMap((field) => {
      const section: unknown = typeof manifest === 'object' && manifest !== null ? Reflect.get(manifest, field) : null;
      return typeof section === 'object' && section !== null ? Object.keys(section) : [];
    });
    const bundle = readFileSync(join(packageDir, 'dist', 'index.js'), 'utf8');
    const imported = [...bundle.matchAll(/^import\b[^;]*?from "([^"]+)"/gm)].map((match) => match[1] ?? '');
    assert.ok(imported.length > 0);
    assert.deepEqual(
      imported.filter(
        (specifier) =>
          !specifier.startsWith('node:') &&
          !declared.some((name) => specifier === name || specifier.startsWith(`${name}/`)),
      ),
      [],
    );
  });
});
