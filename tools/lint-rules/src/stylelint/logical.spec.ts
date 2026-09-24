// The physical properties and keywords that stylelint.config.mjs lets through are exactly those whose logical
// replacement the browser floor lacks (ADR 0024). Derived, not remembered: the plugin names each replacement, MDN
// browser-compat-data says where it works, .browserslistrc says where it must work.
import bcd from '@mdn/browser-compat-data' with { type: 'json' };
import type { Identifier } from '@mdn/browser-compat-data/types';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import stylelint from 'stylelint';
import { browserFloor, logicalFallsShort } from './browser-floor.ts';

const workspaceRoot = join(import.meta.dirname, '..', '..', '..', '..');
const floor = browserFloor(workspaceRoot);
const properties: Identifier = bcd.css['properties'] ?? {};
/** Every CSS property that browser-compat-data knows, without its own compat block. */
const propertyNames = Object.keys(properties).filter((name) => name !== '__compat');

/** The ignore list the workspace config gives a logical-css rule. */
async function configuredIgnore(rule: string): Promise<readonly string[]> {
  const config = await stylelint.resolveConfig(join(workspaceRoot, 'apps', 'showcase', 'src', 'fixture.css'));
  const setting: unknown = config?.rules?.[rule];
  const options: unknown = Array.isArray(setting) ? setting[1] : undefined;
  const ignore: unknown = typeof options === 'object' && options !== null ? Reflect.get(options, 'ignore') : undefined;
  return Array.isArray(ignore) ? ignore.map(String).sort() : [];
}

/** Lints one declaration per line with a single logical-css rule; returns [line, physical, logical] per finding. */
async function replacements(
  rule: string,
  lines: readonly string[],
): Promise<readonly (readonly [number, string, string])[]> {
  const { results } = await stylelint.lint({
    code: lines.join('\n'),
    config: { plugins: ['stylelint-plugin-logical-css'], rules: { [rule]: true } },
  });
  return (results[0]?.warnings ?? []).flatMap((warning) => {
    const match = /(?:property|keyword) (\S+?)\.? Please use the logical equivalent — (\S+)/.exec(warning.text);
    return match?.[1] && match[2] ? [[warning.line, match[1], match[2]] as const] : [];
  });
}

describe('logical-css exceptions', () => {
  it('reads a floor for every browser family', () => {
    assert.deepEqual([...floor.keys()].sort(), ['chrome', 'edge', 'firefox', 'safari', 'safari_ios']);
  });

  it('lets a physical property through only when its logical form falls short at the floor', async () => {
    const found = await replacements(
      'logical-css/require-logical-properties',
      propertyNames.map((name) => `a { ${name}: initial; }`),
    );
    assert.ok(found.length > 20, 'the plugin reported the physical properties');
    const needed = found
      .filter(([, physical, logical]) => logicalFallsShort(properties[physical], properties[logical], floor))
      .map(([, physical]) => physical)
      .sort();
    assert.deepEqual(await configuredIgnore('logical-css/require-logical-properties'), needed);
  });

  it('lets a physical keyword through only when its logical keyword falls short at the floor', async () => {
    const lines: string[] = [];
    const owners: string[] = [];
    for (const name of propertyNames) {
      for (const keyword of Object.keys(properties[name] ?? {}).filter((key) => key !== '__compat')) {
        lines.push(`a { ${name}: ${keyword}; }`);
        owners.push(name);
      }
    }
    const found = await replacements('logical-css/require-logical-keywords', lines);
    assert.ok(found.length > 5, 'the plugin reported the physical keywords');
    const needed = new Set(
      found
        .filter(([line, physical, logical]) => {
          const feature = properties[owners[line - 1] ?? ''];
          return logicalFallsShort(feature?.[physical], feature?.[logical], floor);
        })
        .map(([line]) => owners[line - 1] ?? ''),
    );
    assert.deepEqual(await configuredIgnore('logical-css/require-logical-keywords'), [...needed].sort());
  });
});
