// Runs a Playwright suite in the pinned container (ADR 0010, 0027). The Nx e2e targets call it.
//
//   node container.ts <playwright config> [--update] [<playwright test arguments>]
//
// On a developer machine it starts the pinned image with Docker, linux/amd64, the workspace mounted at /work and no
// network. Inside the image (the CI job, or the container this script started) it runs Playwright directly.
// --update rewrites the baselines that differ or are missing; review every changed image before committing it. Every
// other argument goes to `playwright test` (--grep, --project, --reporter).
// Environment variables named AVELUNE_* are passed through (the proofs use them to point a suite at its fixtures).
import { spawnSync } from 'node:child_process';
import { userInfo } from 'node:os';
import { relative, resolve } from 'node:path';
import { imageVariable, isPinnedContainer, workspaceRoot } from './environment.ts';
import { containerPlatform, playwrightImage } from './image.ts';

const [config, ...rest] = process.argv.slice(2);
if (config === undefined || config.startsWith('-')) {
  console.error('usage: node container.ts <playwright config> [--update] [<playwright test arguments>]');
  process.exit(2);
}

const playwright = [
  'node_modules/@playwright/test/cli.js',
  'test',
  '--config',
  relative(workspaceRoot, resolve(config)),
  ...rest.map((arg) => (arg === '--update' ? '--update-snapshots=changed' : arg)),
];

const inImage = isPinnedContainer({ env: process.env, platform: process.platform, arch: process.arch });

const run = inImage
  ? spawnSync('node', playwright, { cwd: workspaceRoot, stdio: 'inherit' })
  : spawnSync(
      'docker',
      [
        'run',
        '--rm',
        '--init',
        '--ipc=host',
        '--network=none',
        `--platform=${containerPlatform}`,
        // Files the suite writes (baselines, reports) belong to the developer, not to root.
        `--user=${String(userInfo().uid)}:${String(userInfo().gid)}`,
        '--env=HOME=/tmp',
        `--env=${imageVariable}=${playwrightImage}`,
        ...(process.stdout.isTTY ? ['--tty'] : []),
        ...Object.keys(process.env)
          .filter((name) => name.startsWith('AVELUNE_') && name !== imageVariable)
          .map((name) => `--env=${name}`),
        ...(process.env['CI'] === undefined ? [] : ['--env=CI']),
        `--volume=${workspaceRoot}:/work`,
        '--workdir=/work',
        playwrightImage,
        'node',
        ...playwright,
      ],
      { stdio: 'inherit' },
    );

if (run.error !== undefined) {
  console.error(`container.ts: ${run.error.message}`);
  process.exit(1);
}
process.exit(run.status ?? 1);
