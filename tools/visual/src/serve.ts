// A static file server for the browser suites: Playwright's webServer starts it inside the container to serve a built
// site (the Storybook or showcase build, or a fixture site).
//
//   node serve.ts --port <n> --root <dir> [--mount <url-prefix>=<dir>]… [--spa]
//
// --mount serves another folder under a URL prefix (the tokens and fonts for fixture sites). --spa answers unknown
// extensionless paths with index.html, as the showcase's router needs. Paths are relative to the working directory.
import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';

const types: Readonly<Record<string, string>> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
};

interface Mount {
  readonly prefix: string;
  readonly dir: string;
}

function parseArgs(args: readonly string[]): { port: number; mounts: Mount[]; spa: boolean } {
  let port = Number.NaN;
  const mounts: Mount[] = [];
  let spa = false;
  for (let index = 0; index < args.length; index++) {
    const arg = args[index];
    const value = args[index + 1] ?? '';
    if (arg === '--port') {
      port = Number(value);
      index++;
    } else if (arg === '--root') {
      mounts.push({ prefix: '/', dir: resolve(value) });
      index++;
    } else if (arg === '--mount') {
      const [prefix = '', dir = ''] = value.split('=');
      mounts.push({ prefix: `${prefix.replace(/\/$/, '')}/`, dir: resolve(dir) });
      index++;
    } else if (arg === '--spa') {
      spa = true;
    } else {
      throw new Error(`serve.ts: unknown argument ${arg ?? ''}`);
    }
  }
  if (!Number.isInteger(port) || !mounts.some((mount) => mount.prefix === '/')) {
    throw new Error('serve.ts: --port and --root are required');
  }
  // Longest prefix first, so /fonts/ wins over /.
  mounts.sort((a, b) => b.prefix.length - a.prefix.length);
  return { port, mounts, spa };
}

/** The file a URL path names, or undefined when it is outside every mount or missing. */
function resolveFile(mounts: readonly Mount[], pathname: string): string | undefined {
  const mount = mounts.find((candidate) => pathname.startsWith(candidate.prefix));
  if (mount === undefined) return undefined;
  const file = normalize(join(mount.dir, pathname.slice(mount.prefix.length)));
  if (file !== mount.dir && !file.startsWith(mount.dir + sep)) return undefined;
  try {
    const stats = statSync(file);
    if (stats.isFile()) return file;
    if (stats.isDirectory()) return resolveFile([{ prefix: '/', dir: file }], '/index.html');
  } catch {
    return undefined;
  }
  return undefined;
}

const { port, mounts, spa } = parseArgs(process.argv.slice(2));
const root = mounts.find((mount) => mount.prefix === '/');

createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
  let file = resolveFile(mounts, pathname);
  if (file === undefined && spa && root !== undefined && extname(pathname) === '') {
    file = resolveFile([root], '/index.html');
  }
  if (file === undefined) {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end(`Not found: ${pathname}`);
    return;
  }
  response.writeHead(200, {
    'content-type': types[extname(file)] ?? 'application/octet-stream',
    'cache-control': 'no-store',
  });
  createReadStream(file).pipe(response);
}).listen(port, '127.0.0.1', () => {
  console.log(`serve.ts: http://127.0.0.1:${String(port)}`);
});
