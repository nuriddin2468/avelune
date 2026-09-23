// Finishes the schematics build: copies the JSON manifests (collections, option schemas) next to the compiled
// factories and marks the folder as CommonJS, because the published package is "type": "module" and the Angular
// CLI loads factories with require(). tsc emits only the .js files.
import { cpSync, globSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const source = join(dirname(fileURLToPath(import.meta.url)), '..', 'schematics');
const target = join(source, '..', '..', '..', 'dist', 'packages', 'ui', 'schematics');

for (const file of globSync('**/*.json', { cwd: source, exclude: (path) => path.includes('fixtures') })) {
  cpSync(join(source, file), join(target, file));
}
writeFileSync(join(target, 'package.json'), `${JSON.stringify({ type: 'commonjs' }, null, 2)}\n`);
