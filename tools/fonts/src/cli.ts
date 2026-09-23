// tools/fonts CLI (brief §4.4, ADR 0018).
//
//   node src/cli.ts            fail when packages/ui/styles/fonts is not what the build produces, or when a shipped
//                              file misses a required character, keeps the Reserved Font Name or has other axes
//   node src/cli.ts --update   rebuild the files (then review and commit them)
//   node src/cli.ts --dir <d>  check another directory instead (used by the tests)
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, relative, resolve } from 'node:path';
import * as fontkit from 'fontkit';
import { subsetFile, subsets, weight } from './config.ts';
import { buildFonts, coverageProblems, outputDir as defaultOutputDir, reservedNameRecords } from './fonts.ts';
import { checksum, readNames, readSfnt } from './sfnt.ts';

const require = createRequire(import.meta.url);
const fontverter = require('fontverter') as { convert(font: Uint8Array, format: 'truetype'): Promise<Uint8Array> };

const args = process.argv.slice(2);
const update = args.includes('--update');
const dirIndex = args.indexOf('--dir');
const outputDir = dirIndex === -1 ? defaultOutputDir : resolve(args[dirIndex + 1] ?? '');
const shown = relative(process.cwd(), outputDir) || '.';

const built = await buildFonts();
const problems: string[] = [];

if (update) {
  mkdirSync(outputDir, { recursive: true });
  for (const [name, data] of built) writeFileSync(join(outputDir, name), data);
  console.log(`fonts: wrote ${built.size} files to ${shown}`);
} else {
  const present = existsSync(outputDir) ? readdirSync(outputDir) : [];
  for (const [name, data] of built) {
    const path = join(outputDir, name);
    if (!existsSync(path)) problems.push(`${name} is missing`);
    else if (!Buffer.from(data).equals(readFileSync(path))) problems.push(`${name} is not what the build produces`);
  }
  for (const name of present) if (!built.has(name)) problems.push(`${name} is not produced by the build`);
}

// Checks on the files as shipped (read back from disk), not on the in-memory build.
const cmaps = new Map<(typeof subsets)[number]['name'], ReadonlySet<number>>();
for (const subset of subsets) {
  const path = join(outputDir, subsetFile(subset));
  if (!existsSync(path)) continue;
  const woff2 = readFileSync(path);
  if (woff2.subarray(0, 4).toString('latin1') !== 'wOF2') problems.push(`${subsetFile(subset)} is not woff2`);
  const font = fontkit.create(woff2);
  if (!('characterSet' in font)) {
    problems.push(`${subsetFile(subset)} is a font collection`);
    continue;
  }
  cmaps.set(subset.name, new Set(font.characterSet));
  const axes = font.variationAxes;
  const wght = axes['wght'];
  if (Object.keys(axes).join() !== 'wght' || wght?.min !== weight.min || wght.max !== weight.max) {
    problems.push(
      `${subsetFile(subset)} has axes ${JSON.stringify(axes)}; expected wght ${weight.min}–${weight.max} only`,
    );
  }
  const truetype = await fontverter.convert(woff2, 'truetype');
  if (checksum(truetype) !== 0xb1b0afba) problems.push(`${subsetFile(subset)} has a wrong checkSumAdjustment`);
  const name = readSfnt(truetype).tables.get('name');
  for (const record of name === undefined ? [] : reservedNameRecords(readNames(name))) {
    problems.push(`${subsetFile(subset)} name ID ${record.nameId} still says "${record.text}" (Reserved Font Name)`);
  }
}
for (const problem of coverageProblems(cmaps)) {
  const codePoint = `U+${(problem.character.codePointAt(0) ?? 0).toString(16).toUpperCase().padStart(4, '0')}`;
  problems.push(`${problem.locale}: ${codePoint} "${problem.character}" ${problem.problem}`);
}

if (problems.length > 0) {
  console.error(
    `fonts: ${problems.length} problem(s) in ${shown}\n${problems.map((p) => `  - ${p}`).join('\n')}` +
      (update
        ? ''
        : '\nRun `pnpm nx run fonts:check --update` if the sources or tools/fonts changed, and review the diff.'),
  );
  process.exit(1);
}
console.log(`fonts: ${shown} is up to date; every required character of ${subsets.length} subsets is covered`);
