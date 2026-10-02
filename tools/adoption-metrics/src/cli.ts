// Scans a consumer repository for the kit's adoption (ADR 0105):
//
//   node tools/adoption-metrics/src/cli.ts <repository> [--json file] [--summary file] [--previous file] [--ratchet]
//     [--latest version] [--name label] [--exclude glob]…
//
// It prints the summary; --json writes the report, --summary the Markdown (default: $GITHUB_STEP_SUMMARY when set).
// With --previous and --ratchet it exits 1 when any count rose. Build the consumer configs first:
// pnpm nx run-many -t build -p eslint-config stylelint-config.
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { scan } from './scan.ts';
import { increases, previousTotals, summary } from './summary.ts';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    json: { type: 'string' },
    summary: { type: 'string' },
    previous: { type: 'string' },
    ratchet: { type: 'boolean', default: false },
    latest: { type: 'string' },
    name: { type: 'string' },
    exclude: { type: 'string', multiple: true },
  },
});

const [repository] = positionals;
if (repository === undefined || positionals.length > 1) {
  console.error('Usage: cli.ts <repository> [--json file] [--summary file] [--previous file] [--ratchet] [--latest v]');
  process.exit(2);
}

const root = resolve(repository);
const report = await scan(root, { latest: values.latest, exclude: values.exclude });
const previous =
  values.previous === undefined ? undefined : previousTotals(JSON.parse(readFileSync(values.previous, 'utf8')));
if (values.previous !== undefined && previous === undefined) {
  console.error(`${values.previous} is not a report of this tool`);
  process.exit(2);
}
const markdown = summary(values.name ?? basename(root), report, previous);
console.log(markdown);
if (values.json !== undefined) writeFileSync(values.json, `${JSON.stringify(report, null, 2)}\n`);
const summaryFile = values.summary ?? process.env['GITHUB_STEP_SUMMARY'];
if (summaryFile !== undefined && summaryFile !== '') {
  if (values.summary === undefined) appendFileSync(summaryFile, markdown);
  else writeFileSync(summaryFile, markdown);
}
if (values.ratchet && previous !== undefined) {
  const risen = increases(report, previous);
  if (risen.length > 0) {
    console.error(`Adoption went back: ${risen.join(', ')} rose since ${values.previous ?? 'the previous scan'}.`);
    process.exit(1);
  }
}
