// Every Nx project carries exactly one layer or type tag (ADR 0001): @nx/enforce-module-boundaries only constrains
// projects by their tags, so a project without one would escape the layering, and one with two would be ambiguous.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ESLint } from 'eslint';

export interface ProjectTags {
  readonly name: string;
  readonly tags: readonly string[];
}

/** Projects without exactly one of the constrained tags, and constrained tags no project uses. */
export function tagProblems(projects: readonly ProjectTags[], constrained: ReadonlySet<string>): string[] {
  const problems: string[] = [];
  for (const { name, tags } of projects) {
    const own = tags.filter((tag) => constrained.has(tag));
    if (own.length !== 1) {
      problems.push(
        `${name}: needs exactly one of ${[...constrained].join(', ')}; has ${own.length === 0 ? 'none' : own.join(', ')}`,
      );
    }
    for (const tag of tags.filter((tag) => /^(layer|type):/.test(tag) && !constrained.has(tag))) {
      problems.push(`${name}: ${tag} is not constrained by @nx/enforce-module-boundaries`);
    }
  }
  return problems;
}

/** The source tags of the workspace's @nx/enforce-module-boundaries rule, as ESLint resolves it for a tool file. */
export async function constrainedTags(workspaceRoot: string): Promise<Set<string>> {
  const eslint = new ESLint({ cwd: workspaceRoot });
  const config: unknown = await eslint.calculateConfigForFile(
    join(workspaceRoot, 'tools', 'repo-check', 'src', 'tags.ts'),
  );
  const rules: unknown = typeof config === 'object' && config !== null ? Reflect.get(config, 'rules') : undefined;
  const rule: unknown =
    typeof rules === 'object' && rules !== null ? Reflect.get(rules, '@nx/enforce-module-boundaries') : undefined;
  const options: unknown = Array.isArray(rule) ? rule[1] : undefined;
  const constraints: unknown =
    typeof options === 'object' && options !== null ? Reflect.get(options, 'depConstraints') : undefined;
  if (!Array.isArray(constraints)) throw new Error('eslint.config.mjs configures no depConstraints');
  return new Set(
    constraints.map((constraint: unknown) =>
      String(typeof constraint === 'object' && constraint !== null ? Reflect.get(constraint, 'sourceTag') : ''),
    ),
  );
}

/** Every project of the workspace and its tags, from Nx's project graph. */
export function workspaceProjects(workspaceRoot: string): ProjectTags[] {
  const dir = mkdtempSync(join(tmpdir(), 'repo-check-'));
  try {
    const file = join(dir, 'graph.json');
    const run = spawnSync(join(workspaceRoot, 'node_modules', '.bin', 'nx'), ['graph', `--file=${file}`], {
      cwd: workspaceRoot,
      encoding: 'utf8',
      env: { ...process.env, NX_DAEMON: 'false' },
    });
    if (run.status !== 0) throw new Error(`nx graph failed:\n${run.stdout}\n${run.stderr}`);
    const graph: unknown = JSON.parse(readFileSync(file, 'utf8'));
    const nodes: unknown = Reflect.get(Reflect.get(Object(graph), 'graph') ?? {}, 'nodes');
    return Object.entries(Object(nodes) as Record<string, unknown>).map(([name, node]) => {
      const tags: unknown = Reflect.get(Reflect.get(Object(node), 'data') ?? {}, 'tags');
      return { name, tags: Array.isArray(tags) ? tags.map(String) : [] };
    });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
