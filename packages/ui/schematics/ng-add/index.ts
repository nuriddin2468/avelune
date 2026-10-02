import type { json, workspaces } from '@angular-devkit/core';
import { chain, SchematicsException, type Rule, type SchematicContext, type Tree } from '@angular-devkit/schematics';
import {
  addDependency,
  addRootProvider,
  DependencyType,
  ExistingBehavior,
  readWorkspace,
  updateWorkspace,
} from '@schematics/angular/utility';
import { findAppConfig } from '@schematics/angular/utility/standalone/app_config';
import { findBootstrapApplicationCall, getMainFilePath } from '@schematics/angular/utility/standalone/util';
import { getAppModulePath, isStandaloneApp } from '@schematics/angular/utility/ng-ast-utils';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { withAgentSnippet } from './agents';
import { withPreloads, withPrePaintScript, withScriptHash } from './index-html';
import { prePaintScript } from './pre-paint';
import type { Schema } from './schema';
import { indexFile, mediaFolder, withKitStylesheet, withoutCriticalInlining, withUnhashedMedia } from './workspace';

/** The builders whose global styles, media output and index.html the kit relies on (ADR 0030). */
const applicationBuilders = ['@angular/build:application', '@angular-devkit/build-angular:application'];

/**
 * The peers of the consumer lint configs, added when the application lacks them, so their command-line tools are
 * installed. The schematics tests keep them equal to the packages' `peerDependencies`.
 */
export const lintPeers = {
  eslint: '^10.0.0',
  'angular-eslint': '^22.5.0',
  'typescript-eslint': '^8.70.1',
  stylelint: '^17.0.0',
} as const;

/** The ESLint config `ng add` writes when the workspace has none. */
export const eslintConfig = `// ESLint for this workspace: the kit's rules for templates and imports (@avelune/eslint-config, written by ng add).
import avelune from '@avelune/eslint-config';
import { defineConfig } from 'eslint/config';

export default defineConfig(avelune());
`;

/** The Stylelint config `ng add` writes when the workspace has none. */
export const stylelintConfig = `// Stylelint for this workspace: the kit's rules for CSS (@avelune/stylelint-config, written by ng add).
export default {
  extends: ['@avelune/stylelint-config'],
};
`;

interface KitManifest {
  readonly version: string;
}

/** The installed @avelune/ui's version: every @avelune package shares it (ADR 0007). */
function kitManifest(): KitManifest {
  const manifest: unknown = JSON.parse(readFileSync(join(__dirname, '..', '..', 'package.json'), 'utf8'));
  const version: unknown = typeof manifest === 'object' && manifest !== null ? Reflect.get(manifest, 'version') : null;
  if (typeof version !== 'string') throw new SchematicsException('@avelune/ui: its package.json has no version');
  return { version };
}

/** The application to set up, or a stop that says what the kit needs. */
function application(
  workspace: workspaces.WorkspaceDefinition,
  name: string | undefined,
): {
  readonly name: string;
  readonly project: workspaces.ProjectDefinition;
  readonly build: workspaces.TargetDefinition;
} {
  const projectName = name ?? [...workspace.projects.keys()][0];
  const project = projectName === undefined ? undefined : workspace.projects.get(projectName);
  if (projectName === undefined || project === undefined) {
    throw new SchematicsException(`@avelune/ui: there is no project ${name ?? ''} in angular.json.`);
  }
  if (project.extensions['projectType'] !== 'application') {
    throw new SchematicsException(`@avelune/ui: ${projectName} is a library; run ng add for an application.`);
  }
  const build = project.targets.get('build');
  if (build === undefined || !applicationBuilders.includes(build.builder)) {
    throw new SchematicsException(
      `@avelune/ui: ${projectName} builds with ${build?.builder ?? 'no builder'}. The kit needs @angular/build:application, ` +
        'which bundles its stylesheet and fonts and writes the index.html it adds to (ADR 0030).',
    );
  }
  return { name: projectName, project, build };
}

/** The application's `@angular/core` specifier, which the CDK and Aria follow; Aria peers the CDK's exact version. */
function angularSpecifier(tree: Tree): string {
  const manifest: unknown = tree.readJson('/package.json');
  for (const field of ['dependencies', 'devDependencies']) {
    const section: unknown = typeof manifest === 'object' && manifest !== null ? Reflect.get(manifest, field) : null;
    const core: unknown =
      typeof section === 'object' && section !== null ? Reflect.get(section, '@angular/core') : null;
    if (typeof core === 'string') return core;
  }
  return '^22.2.0';
}

/** Whether the application's root providers already call `provideAvelune`. */
function providesAvelune(tree: Tree, main: string): boolean {
  const files = [main];
  if (isStandaloneApp(tree, main)) {
    const config = findAppConfig(findBootstrapApplicationCall(tree, main), tree, main);
    if (config !== null) files.push(config.filePath);
  } else {
    files.push(getAppModulePath(tree, main));
  }
  return files.some((file) => /\bprovideAvelune\s*\(/.test(tree.readText(file)));
}

/** Media under their own names and no critical-CSS inlining, in the base options (`base`) or a configuration. */
function withBuildSettings(settings: Record<string, json.JsonValue | undefined>, base: boolean): void {
  if (settings['outputHashing'] !== undefined) settings['outputHashing'] = withUnhashedMedia(settings['outputHashing']);
  const optimization = withoutCriticalInlining(settings['optimization'], base);
  if (optimization !== undefined) settings['optimization'] = optimization;
}

/**
 * Writes a lint config at the workspace root unless any of `existing` is there. An existing one that does not name
 * `kitPackage` is never edited; the log says what to add by hand.
 */
function rootConfig(
  tree: Tree,
  context: SchematicContext,
  config: { readonly file: string; readonly content: string; readonly kitPackage: string; readonly hint: string },
  existing: readonly string[],
): void {
  const found = existing.find((name) => tree.exists(`/${name}`));
  if (found === undefined) {
    tree.create(`/${config.file}`, config.content);
  } else if (!tree.readText(`/${found}`).includes(config.kitPackage)) {
    context.logger.info(`@avelune/ui: ${found} is left as it is. ${config.hint}`);
  }
}

/**
 * `ng add @avelune/ui` (ADR 0103): the dependencies, the kit's stylesheet and the build options it needs, the font
 * preload and the pre-paint script in index.html, `provideAvelune()`, the lint configs and the agent snippet. A second
 * run changes nothing.
 */
export function ngAdd(options: Schema): Rule {
  return async (tree, context) => {
    const { version } = kitManifest();
    const workspace = await readWorkspace(tree);
    const { name, project, build } = application(workspace, options.project);
    const buildOptions = build.options ?? {};
    const sourceRoot = project.sourceRoot ?? `${project.root === '' ? '' : `${project.root}/`}src`;
    const index = indexFile(buildOptions['index'], sourceRoot);
    const media = mediaFolder(buildOptions['outputPath']);
    const angular = angularSpecifier(tree);
    const kit = `^${version}`;
    const rules: Rule[] = [
      addDependency('@avelune/icons', kit, { existing: ExistingBehavior.Replace }),
      addDependency('@angular/cdk', angular, { existing: ExistingBehavior.Skip }),
      addDependency('@angular/aria', angular, { existing: ExistingBehavior.Skip }),
      updateWorkspace((updated) => {
        const target = updated.projects.get(name)?.targets.get('build');
        if (target === undefined) return;
        const base = (target.options ??= {});
        base['styles'] = withKitStylesheet(base['styles']);
        withBuildSettings(base, true);
        for (const configuration of Object.values(target.configurations ?? {})) {
          if (configuration !== undefined) withBuildSettings(configuration, false);
        }
      }),
    ];

    if (index === null) {
      context.logger.warn(
        `@avelune/ui: ${name} has index: false; add the font preload and the pre-paint script yourself (ADR 0103).`,
      );
    } else if (!tree.exists(`/${index}`)) {
      context.logger.warn(
        `@avelune/ui: ${index} does not exist; add the font preload and the pre-paint script yourself (ADR 0103).`,
      );
    } else {
      const fonts = ['latin', ...(options.preloadCyrillic === true ? ['cyrillic'] : [])];
      const hash = `'sha256-${createHash('sha256').update(prePaintScript, 'utf8').digest('base64')}'`;
      const html = withPreloads(
        withPrePaintScript(tree.readText(`/${index}`)),
        fonts.map((font) => `${media}/avelune-sans-${font}.woff2`),
      );
      const policy = withScriptHash(html, hash);
      if (policy.html !== tree.readText(`/${index}`)) tree.overwrite(`/${index}`, policy.html);
      const security = buildOptions['security'];
      const autoCsp =
        typeof security === 'object' && security !== null && !Array.isArray(security) && Boolean(security['autoCsp']);
      if (policy.result === 'no-script-src') {
        context.logger.warn(
          `@avelune/ui: the Content-Security-Policy in ${index} has no script-src; allow the pre-paint script with ${hash}.`,
        );
      } else if (policy.result === 'none' && !autoCsp) {
        context.logger.info(
          `@avelune/ui: if your server sends a Content-Security-Policy, add ${hash} to its script-src for the pre-paint script.`,
        );
      }
    }

    const main = await getMainFilePath(tree, name);
    if (!providesAvelune(tree, main)) {
      rules.push(
        addRootProvider(name, ({ code, external }) => code`${external('provideAvelune', '@avelune/ui/theme')}()`),
      );
    }

    if (options.lint !== false) {
      rules.push(
        addDependency('@avelune/eslint-config', kit, { type: DependencyType.Dev, existing: ExistingBehavior.Replace }),
        addDependency('@avelune/stylelint-config', kit, {
          type: DependencyType.Dev,
          existing: ExistingBehavior.Replace,
        }),
        ...Object.entries(lintPeers).map(([peer, range]) =>
          addDependency(peer, range, { type: DependencyType.Dev, existing: ExistingBehavior.Skip }),
        ),
      );
      rootConfig(
        tree,
        context,
        {
          file: 'eslint.config.mjs',
          content: eslintConfig,
          kitPackage: '@avelune/eslint-config',
          hint: "Add the kit's rules: import avelune from '@avelune/eslint-config' and spread avelune() into the config.",
        },
        [
          'eslint.config.js',
          'eslint.config.mjs',
          'eslint.config.cjs',
          'eslint.config.ts',
          'eslint.config.mts',
          'eslint.config.cts',
        ],
      );
      rootConfig(
        tree,
        context,
        {
          file: 'stylelint.config.mjs',
          content: stylelintConfig,
          kitPackage: '@avelune/stylelint-config',
          hint: "Add the kit's rules: extends: ['@avelune/stylelint-config'].",
        },
        [
          'stylelint.config.js',
          'stylelint.config.mjs',
          'stylelint.config.cjs',
          'stylelint.config.ts',
          'stylelint.config.mts',
          '.stylelintrc',
          '.stylelintrc.json',
          '.stylelintrc.yaml',
          '.stylelintrc.yml',
          '.stylelintrc.js',
          '.stylelintrc.mjs',
          '.stylelintrc.cjs',
        ],
      );
    }

    if (options.agents !== false) {
      const snippet = readFileSync(join(__dirname, 'files', 'AGENTS.snippet.md'), 'utf8');
      const agents = tree.exists('/AGENTS.md') ? tree.readText('/AGENTS.md') : null;
      const updated = withAgentSnippet(agents, snippet);
      if (agents === null) tree.create('/AGENTS.md', updated);
      else if (updated !== agents) tree.overwrite('/AGENTS.md', updated);
      if (tree.exists('/CLAUDE.md') && !tree.readText('/CLAUDE.md').includes('AGENTS.md')) {
        context.logger.info(
          '@avelune/ui: the kit\'s rules are in AGENTS.md; add "@AGENTS.md" to CLAUDE.md so Claude Code reads them.',
        );
      }
    }

    return chain(rules);
  };
}
