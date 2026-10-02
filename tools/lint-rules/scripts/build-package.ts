// Builds a consumer lint config package from its folder (ADR 0104): esbuild bundles src/consumers/<package>.ts of
// tools/lint-rules, with the rules it imports, into dist/index.js, the package's peers and dependencies left external,
// and tsc's declaration of that file becomes dist/index.d.ts. It fails when the bundle would inline a dependency or
// import a package the manifest does not name, and when the declaration would import a file.
import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';
import { cpSync, readFileSync, rmSync } from 'node:fs';
import { builtinModules, createRequire } from 'node:module';
import { basename, join } from 'node:path';

const packageDir = process.cwd();
const name = basename(packageDir);
const lintRules = join(import.meta.dirname, '..');
const entry = join(lintRules, 'src', 'consumers', `${name}.ts`);

/** The names of the packages in a manifest's peer and runtime dependencies. */
function dependencyNames(manifest: unknown): readonly string[] {
  return ['peerDependencies', 'dependencies'].flatMap((field) => {
    const section: unknown = typeof manifest === 'object' && manifest !== null ? Reflect.get(manifest, field) : null;
    return typeof section === 'object' && section !== null ? Object.keys(section) : [];
  });
}

const declared = dependencyNames(JSON.parse(readFileSync(join(packageDir, 'package.json'), 'utf8')));

/** Whether an import names a declared package (or one of its subpaths) or a Node built-in. */
const allowed = (specifier: string) =>
  specifier.startsWith('node:') ||
  builtinModules.includes(specifier) ||
  declared.some((dependency) => specifier === dependency || specifier.startsWith(`${dependency}/`));

const problems: string[] = [];
rmSync(join(packageDir, 'dist'), { recursive: true, force: true });

const { metafile } = await build({
  absWorkingDir: packageDir,
  entryPoints: [entry],
  outfile: 'dist/index.js',
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20.19',
  external: declared.flatMap((dependency) => [dependency, `${dependency}/*`]),
  metafile: true,
  legalComments: 'none',
  logLevel: 'warning',
});
for (const input of Object.keys(metafile.inputs)) {
  if (input.includes('node_modules')) problems.push(`the bundle inlines ${input}; declare its package`);
}
for (const { path, external } of Object.values(metafile.outputs).flatMap((output) => output.imports)) {
  if (external && !allowed(path)) problems.push(`the bundle imports ${path}, which package.json does not name`);
}

const tsc = createRequire(import.meta.url).resolve('typescript/bin/tsc');
execFileSync(process.execPath, [tsc, '-p', join(lintRules, 'tsconfig.consumers.json')], { stdio: 'inherit' });
const emitted = join(lintRules, '..', '..', 'dist', 'out-tsc', 'lint-rules', 'consumers', `${name}.d.ts`);
const declaration = readFileSync(emitted, 'utf8');
for (const [, specifier = ''] of declaration.matchAll(/^(?:import|export)\b[^;]*?from '([^']+)'/gm)) {
  if (!allowed(specifier)) problems.push(`index.d.ts imports ${specifier}; declare its types in ${basename(entry)}`);
}
cpSync(emitted, join(packageDir, 'dist', 'index.d.ts'));

if (problems.length > 0) {
  console.error(problems.map((problem) => `${name}: ${problem}`).join('\n'));
  process.exit(1);
}
