// API reports for every @avelune/ui entry point (ADR 0007).
//
// Reads the .d.ts that ng-packagr wrote to dist/packages/ui/types and compares each entry point's public API with
// the committed report in packages/ui/api. Run after `nx build ui`.
//
//   node scripts/api-report.mjs            fail when a report differs (CI)
//   node scripts/api-report.mjs --update   rewrite the committed reports (local, then review the diff)
import { Extractor, ExtractorConfig } from '@microsoft/api-extractor';
import { cpSync, existsSync, globSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const workspaceRoot = join(packageRoot, '..', '..');
const distRoot = join(workspaceRoot, 'dist', 'packages', 'ui');
const update = process.argv.includes('--update');

// API Extractor treats an import as external only when TypeScript resolves it as an external library. Entry points
// import each other by their public specifier (@avelune/ui/sample). Analysed inside the package, that import resolves as
// a self-reference and counts as local, so every shared type would be reported as a forgotten export. So the analysed
// .d.ts sits outside the package (analysis/), and the package itself sits under node_modules/, which makes
// cross-entry-point imports external, as they are for consumers.
const tempRoot = join(workspaceRoot, 'dist', 'api-report-temp');
const packageCopy = join(tempRoot, 'node_modules', '@avelune', 'ui');
const analysisRoot = join(tempRoot, 'analysis');
rmSync(tempRoot, { recursive: true, force: true });
mkdirSync(packageCopy, { recursive: true });
cpSync(join(distRoot, 'package.json'), join(packageCopy, 'package.json'));
cpSync(join(distRoot, 'types'), join(packageCopy, 'types'), { recursive: true });
cpSync(join(distRoot, 'types'), analysisRoot, { recursive: true });

/** Entry points are the folders that contain an ng-package.json: '' (primary), 'sample', 'sample/testing'. */
const entryPoints = globSync('**/ng-package.json', {
  cwd: packageRoot,
  exclude: (path) => path === 'node_modules' || path.includes('fixtures'),
})
  .map((file) => dirname(file).split(sep).join('/'))
  .map((path) => (path === '.' ? '' : path))
  .sort();

let failed = false;

for (const entryPoint of entryPoints) {
  const specifier = entryPoint === '' ? '@avelune/ui' : `@avelune/ui/${entryPoint}`;
  // ng-packagr names each entry point's types after its specifier: @avelune/ui/sample -> avelune-ui-sample.d.ts.
  const typesFile = join(analysisRoot, `${specifier.slice(1).replaceAll('/', '-')}.d.ts`);
  if (!existsSync(typesFile)) {
    console.error(`api-report: types for ${specifier} are missing. Run \`nx build ui\` first.`);
    process.exit(1);
  }

  const config = ExtractorConfig.prepare({
    configObjectFullPath: undefined,
    packageJsonFullPath: join(packageCopy, 'package.json'),
    configObject: {
      projectFolder: analysisRoot,
      mainEntryPointFilePath: typesFile,
      bundledPackages: [],
      newlineKind: 'lf',
      compiler: {
        // API Extractor bundles TypeScript 5.9, which does not know the ES2025 lib; ES2024 is enough for .d.ts.
        overrideTsconfig: {
          compilerOptions: {
            target: 'ES2022',
            lib: ['ES2024', 'DOM', 'DOM.Iterable'],
            module: 'preserve',
            moduleResolution: 'bundler',
            strict: true,
            types: [],
          },
          files: [typesFile],
        },
      },
      apiReport: {
        enabled: true,
        reportFileName: specifier.slice(1).replaceAll('/', '-'),
        reportFolder: join(packageRoot, 'api'),
        reportTempFolder: join(tempRoot, 'reports'),
        tagsToReport: { '@sealed': true, '@virtual': true, '@override': true, '@deprecated': true },
      },
      docModel: { enabled: false },
      dtsRollup: { enabled: false },
      tsdocMetadata: { enabled: false },
      messages: {
        compilerMessageReporting: { default: { logLevel: 'error' } },
        extractorMessageReporting: {
          default: { logLevel: 'error' },
          // Angular emits undocumented static members (ɵfac, ɵdir, ɵcmp) into every .d.ts. JSDoc coverage of the
          // public API is enforced by ESLint on the sources instead (Phase 3).
          'ae-undocumented': { logLevel: 'none' },
        },
        tsdocMessageReporting: { default: { logLevel: 'error' } },
      },
    },
  });

  const result = Extractor.invoke(config, { localBuild: update, showVerboseMessages: false });
  const status = result.succeeded ? (result.apiReportChanged ? 'updated' : 'unchanged') : 'FAILED';
  console.log(`api-report: ${specifier} ${status} (${result.errorCount} errors, ${result.warningCount} warnings)`);
  if (!result.succeeded) {
    failed = true;
  }
}

if (failed) {
  console.error(
    update
      ? 'api-report: fix the errors above.'
      : 'api-report: the public API changed. Run `pnpm nx run ui:api-report --update`, review and commit the reports.',
  );
  process.exit(1);
}
