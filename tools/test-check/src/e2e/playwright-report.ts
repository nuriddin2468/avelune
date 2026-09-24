// Runs a browser suite in the pinned container (tools/visual/src/container.ts) with Playwright's JSON reporter, and
// flattens the report into one entry per test.
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';

export const workspaceRoot = join(import.meta.dirname, '..', '..', '..', '..');

export interface TestResult {
  /** Describe titles and the test title, joined with " › ". */
  readonly title: string;
  readonly project: string;
  readonly passed: boolean;
  /** Error messages, without colour codes. */
  readonly errors: readonly string[];
  /** Attachments that carry a body, decoded as UTF-8. */
  readonly attachments: ReadonlyMap<string, string>;
}

export interface SuiteRun {
  readonly status: number | null;
  readonly tests: readonly TestResult[];
  /** stderr, for assertion messages. */
  readonly log: string;
}

const ansi = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g');

const record = (value: unknown): Readonly<Record<string, unknown>> =>
  typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
const list = (value: unknown): readonly unknown[] => (Array.isArray(value) ? value : []);
const text = (value: unknown): string => (typeof value === 'string' ? value : '');

function collect(suite: unknown, path: readonly string[], into: TestResult[]): void {
  const { title, specs, suites } = record(suite);
  // The top-level suites are files; their titles are not part of a test's name.
  const titles = path.length === 0 && text(title).endsWith('.ts') ? [] : [...path, text(title)].filter(Boolean);
  for (const spec of list(specs)) {
    for (const test of list(record(spec)['tests'])) {
      const results = list(record(test)['results']).map(record);
      const attachments = new Map<string, string>();
      for (const attachment of results.flatMap((result) => list(result['attachments']).map(record))) {
        const body = text(attachment['body']);
        if (body !== '') attachments.set(text(attachment['name']), Buffer.from(body, 'base64').toString('utf8'));
      }
      into.push({
        title: [...titles, text(record(spec)['title'])].join(' › '),
        project: text(record(test)['projectName']),
        passed: record(test)['status'] === 'expected',
        errors: results.flatMap((result) =>
          list(result['errors']).map((error) => text(record(error)['message']).replace(ansi, '')),
        ),
        attachments,
      });
    }
  }
  for (const child of list(suites)) collect(child, titles, into);
}

/** Runs `config` in the container with `env` (AVELUNE_* variables pass through) and extra Playwright arguments. */
export function runSuite(config: string, env: Readonly<Record<string, string>>, args: readonly string[]): SuiteRun {
  const run = spawnSync(
    process.execPath,
    [join(workspaceRoot, 'tools', 'visual', 'src', 'container.ts'), config, '--reporter=json', ...args],
    { cwd: workspaceRoot, encoding: 'utf8', env: { ...process.env, ...env }, maxBuffer: 64 * 1024 * 1024 },
  );
  const tests: TestResult[] = [];
  const stdout = run.stdout;
  const report: unknown = JSON.parse(stdout.slice(stdout.indexOf('{'), stdout.lastIndexOf('}') + 1));
  for (const suite of list(record(report)['suites'])) collect(suite, [], tests);
  return { status: run.status, tests, log: run.stderr };
}
