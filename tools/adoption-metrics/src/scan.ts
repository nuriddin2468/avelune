// Scans a consumer repository (ADR 0105): the built @avelune/eslint-config and @avelune/stylelint-config run over its
// templates, scripts, stylesheets and component styles, and their findings are counted by the rule that made them.
// Disable comments are ignored, so a silenced finding still counts.
import { ESLint, type Linter } from 'eslint';
import { existsSync, globSync, readFileSync } from 'node:fs';
import { basename, join, matchesGlob, relative, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import stylelint from 'stylelint';
import { componentStyles } from './component-styles.ts';
import { installedVersion, lag, type Lag } from './version.ts';

/** The metrics, in the order the summary shows them. */
export const metrics = [
  'rawColors',
  'rawPixels',
  'rawElements',
  'localKeyframes',
  'ngDeep',
  'tokenOverrides',
  'inlineStyles',
  'bannedImports',
] as const;

export type Metric = (typeof metrics)[number];
export type Counts = Readonly<Record<Metric, number>>;

/** What a scan found. */
export interface Report {
  readonly schema: 1;
  readonly totals: Counts;
  /** The files with findings, the most first, each with its non-zero counts. */
  readonly files: readonly { readonly path: string; readonly counts: Partial<Counts> }[];
  readonly coverage: {
    readonly stylesheets: number;
    readonly componentStyles: number;
    readonly templates: number;
    readonly scripts: number;
    readonly skipped: { readonly preprocessed: number; readonly interpolatedStyles: number; readonly unparsed: number };
  };
  readonly kit: Lag;
  readonly notes: readonly string[];
}

const workspaceRoot = join(import.meta.dirname, '..', '..', '..');
const eslintConfig = join(workspaceRoot, 'packages', 'eslint-config', 'dist', 'index.js');
const stylelintConfig = join(workspaceRoot, 'packages', 'stylelint-config', 'dist', 'index.js');

/**
 * Folders that hold dependencies, build output, caches, or files the build copies as they are (Angular's `public`,
 * vendored libraries): none of them is the application's code.
 */
const excludedFolders = new Set([
  'node_modules',
  'dist',
  'out-tsc',
  'coverage',
  '.angular',
  '.nx',
  '.git',
  'tmp',
  'public',
  'vendor',
]);

/** Whether a path found by the glob is the application's own code: not excluded, not a test, not minified. */
const ownCode = (file: string, exclude: readonly string[]) =>
  !file.split('/').some((segment) => excludedFolders.has(segment)) &&
  !/\.(spec|test)\.ts$|\.min\.(css|js)$/.test(file) &&
  !exclude.some((pattern) => matchesGlob(file, pattern));

/** This repository's @avelune/ui version: the newest kit, when no other latest is given. */
export function kitVersion(): string {
  const manifest: unknown = JSON.parse(readFileSync(join(workspaceRoot, 'packages', 'ui', 'package.json'), 'utf8'));
  const version: unknown = typeof manifest === 'object' && manifest !== null ? Reflect.get(manifest, 'version') : null;
  if (typeof version !== 'string') throw new Error('packages/ui/package.json has no version');
  return version;
}

/** The built config factory of @avelune/eslint-config, as an application imports it (ADR 0104). */
function isConfigFactory(value: unknown): value is () => Linter.Config[] {
  return typeof value === 'function';
}

async function applicationEslintConfig(): Promise<Linter.Config[]> {
  if (!existsSync(eslintConfig) || !existsSync(stylelintConfig)) {
    throw new Error('Build the consumer configs first: pnpm nx run-many -t build -p eslint-config stylelint-config');
  }
  const module: unknown = await import(pathToFileURL(eslintConfig).href);
  const factory: unknown = typeof module === 'object' && module !== null ? Reflect.get(module, 'default') : null;
  if (!isConfigFactory(factory)) throw new Error(`${eslintConfig} has no default config factory`);
  return factory();
}

/** The metric a Stylelint finding counts for, if any. */
function stylesheetMetric(rule: string, text: string): Metric | undefined {
  switch (rule) {
    case 'color-no-hex':
    case 'color-named':
      return 'rawColors';
    case 'function-disallowed-list':
      // The list also bans easing functions; those are not colours.
      return /"(?:cubic-bezier|linear|steps)"/.test(text) ? undefined : 'rawColors';
    case 'unit-disallowed-list':
      return /"px"/.test(text) ? 'rawPixels' : undefined;
    case 'at-rule-disallowed-list':
      return /"@?keyframes"/.test(text) ? 'localKeyframes' : undefined;
    case 'selector-disallowed-list':
      return 'ngDeep';
    case 'avelune/no-token-declarations':
    case 'avelune/known-tokens':
      return 'tokenOverrides';
    default:
      return undefined;
  }
}

/** The metric an ESLint finding counts for, if any. */
function scriptMetric(rule: string | null): Metric | undefined {
  if (rule === 'avelune/no-raw-elements') return 'rawElements';
  if (rule === '@angular-eslint/template/no-inline-styles') return 'inlineStyles';
  if (rule === 'no-restricted-imports') return 'bannedImports';
  return undefined;
}

const zero = (): Record<Metric, number> => ({
  rawColors: 0,
  rawPixels: 0,
  rawElements: 0,
  localKeyframes: 0,
  ngDeep: 0,
  tokenOverrides: 0,
  inlineStyles: 0,
  bannedImports: 0,
});

/** Options of {@link scan}. */
export interface ScanOptions {
  /** The newest kit version, to measure the lag against; this repository's by default. */
  readonly latest?: string | undefined;
  /** Globs of more paths to leave out, relative to the repository, such as another vendored folder. */
  readonly exclude?: readonly string[] | undefined;
}

/** Scans the repository at `root`. */
export async function scan(root: string, options: ScanOptions = {}): Promise<Report> {
  const exclude = options.exclude ?? [];
  // The glob passes an entry's name or its path to `exclude`; the name prunes the excluded folders either way.
  const files = globSync('**/*.{css,scss,sass,less,html,ts,mts,cts,js,mjs,cjs}', {
    cwd: root,
    exclude: (path) => excludedFolders.has(basename(path)),
  })
    .map((file) => file.split(sep).join('/'))
    .filter((file) => ownCode(file, exclude))
    .sort();
  const byFile = new Map<string, Record<Metric, number>>();
  const count = (file: string, metric: Metric) => {
    const counts = byFile.get(file) ?? zero();
    counts[metric]++;
    byFile.set(file, counts);
  };

  const stylesheets = files.filter((file) => file.endsWith('.css'));
  const preprocessed = files.filter((file) => /\.(scss|sass|less)$/.test(file));
  const templates = files.filter((file) => file.endsWith('.html'));
  const scripts = files.filter((file) => /\.(ts|mts|cts|js|mjs|cjs)$/.test(file));
  const components = scripts.filter((file) => /\.(ts|mts|cts)$/.test(file));

  const stylelintOptions = { configBasedir: root, config: { extends: [stylelintConfig] }, ignoreDisables: true };
  const lintCss = async (code: string, file: string) => {
    const { results } = await stylelint.lint({ ...stylelintOptions, code, codeFilename: join(root, file) });
    for (const warning of results[0]?.warnings ?? []) {
      const metric = stylesheetMetric(warning.rule, warning.text);
      if (metric !== undefined) count(file, metric);
    }
  };
  for (const file of stylesheets) await lintCss(readFileSync(join(root, file), 'utf8'), file);

  let componentStyleCount = 0;
  let interpolatedStyles = 0;
  for (const file of components) {
    const source = readFileSync(join(root, file), 'utf8');
    if (!source.includes('styles')) continue;
    const { styles, dynamic } = componentStyles(source, file);
    componentStyleCount += styles.length + dynamic;
    interpolatedStyles += dynamic;
    for (const css of styles) await lintCss(css, file);
  }

  const eslint = new ESLint({
    cwd: root,
    overrideConfigFile: true,
    overrideConfig: await applicationEslintConfig(),
    allowInlineConfig: false,
    errorOnUnmatchedPattern: false,
  });
  let unparsed = 0;
  for (const result of await eslint.lintFiles([...templates, ...scripts].map((file) => join(root, file)))) {
    const file = relative(root, result.filePath).split(sep).join('/');
    for (const message of result.messages) {
      if (message.fatal === true) unparsed++;
      const metric = scriptMetric(message.ruleId);
      if (metric !== undefined) count(file, metric);
    }
  }
  const inlineTemplates = components.filter((file) => /\btemplate\s*:/.test(readFileSync(join(root, file), 'utf8')));

  const totals = zero();
  for (const counts of byFile.values()) for (const metric of metrics) totals[metric] += counts[metric];
  const report = [...byFile.entries()]
    .map(([path, counts]) => ({
      path,
      total: metrics.reduce((sum, metric) => sum + counts[metric], 0),
      counts: Object.fromEntries(
        metrics.filter((metric) => counts[metric] > 0).map((metric) => [metric, counts[metric]]),
      ),
    }))
    .filter(({ total }) => total > 0)
    .sort((a, b) => b.total - a.total || a.path.localeCompare(b.path))
    .map(({ path, counts }) => ({ path, counts }));

  const notes: string[] = [];
  const manifest = join(root, 'package.json');
  if (existsSync(manifest) && /"tailwindcss"\s*:/.test(readFileSync(manifest, 'utf8'))) {
    notes.push('tailwindcss is installed: its utility classes are not scanned.');
  }
  if (preprocessed.length > 0) notes.push(`${String(preprocessed.length)} SCSS, Sass or Less files are not scanned.`);

  return {
    schema: 1,
    totals,
    files: report,
    coverage: {
      stylesheets: stylesheets.length,
      componentStyles: componentStyleCount,
      templates: templates.length + inlineTemplates.length,
      scripts: scripts.length,
      skipped: { preprocessed: preprocessed.length, interpolatedStyles, unparsed },
    },
    kit: lag(installedVersion(root), options.latest ?? kitVersion()),
    notes,
  };
}
