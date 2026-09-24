// The kit's icon data: every icon of lucide-static (ADR 0020, 0036).
//
//   node scripts/generate.ts            fail when src/index.ts, src/lucide.ts, src/lucide-all.ts or LICENSE-lucide.txt
//                                       is not what the installed lucide-static generates (CI; also catches hand edits)
//   node scripts/generate.ts --update   regenerate them (local, then review the diff)
//   node scripts/generate.ts <dir>      check a copy of the package in <dir> instead (used by the tests)
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative, resolve } from 'node:path';
import { format, resolveConfig } from 'prettier';
import { IconError, allModule, indexModule, lucideModule, readLucide } from './lucide.ts';

const repositoryPackage = join(import.meta.dirname, '..');
const args = process.argv.slice(2);
const update = args.includes('--update');
const packageRoot = resolve(args.find((arg) => !arg.startsWith('--')) ?? repositoryPackage);

const nodesFile = createRequire(import.meta.url).resolve('lucide-static/icon-nodes.json');
const lucideRoot = dirname(nodesFile);
const lucide: unknown = JSON.parse(readFileSync(join(lucideRoot, 'package.json'), 'utf8'));
const version = typeof lucide === 'object' && lucide !== null ? String(Reflect.get(lucide, 'version')) : 'unknown';
const source = `lucide-static ${version}`;

let icons;
try {
  icons = readLucide(JSON.parse(readFileSync(nodesFile, 'utf8')));
} catch (error) {
  if (error instanceof IconError) {
    console.error(`icons: lucide-static ${version} has icons outside the kit's rules:\n${error.message}`);
    process.exit(1);
  }
  throw error;
}

// Formatted with the repository's Prettier config, so the committed files pass `prettier --check` unchanged.
const prettierConfig = (await resolveConfig(join(repositoryPackage, 'src', 'index.ts'))) ?? {};
const formatted = (file: string, code: string) => format(code, { ...prettierConfig, filepath: file });
const indexFile = join(packageRoot, 'src', 'index.ts');
const lucideFile = join(packageRoot, 'src', 'lucide.ts');
const allFile = join(packageRoot, 'src', 'lucide-all.ts');
const outputs = new Map([
  [indexFile, await formatted(indexFile, indexModule([...icons.keys()], source))],
  [lucideFile, await formatted(lucideFile, lucideModule(icons, source))],
  [allFile, await formatted(allFile, allModule(icons, source))],
  [join(packageRoot, 'LICENSE-lucide.txt'), readFileSync(join(lucideRoot, 'LICENSE'), 'utf8')],
]);

let stale = false;
for (const [file, content] of outputs) {
  const name = relative(process.cwd(), file);
  let current: string | undefined;
  try {
    current = readFileSync(file, 'utf8');
  } catch {
    current = undefined;
  }
  if (current === content) {
    console.log(`icons: ${name} is up to date`);
  } else if (update) {
    writeFileSync(file, content);
    console.log(`icons: wrote ${name}`);
  } else {
    console.error(`icons: ${name} is not what ${source} generates.`);
    stale = true;
  }
}
if (stale) {
  console.error('Run `pnpm nx run icons:generate --update` and review the diff.');
  process.exit(1);
}
console.log(`icons: ${String(icons.size)} icons from ${source}`);
