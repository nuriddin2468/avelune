// avelune/entry-point-layers: inside @avelune/ui, an entry point imports only entry points of its own or a lower
// layer, only through their public specifier, and never a `testing` entry point from runtime code (ADR 0001).
import { AST_NODE_TYPES, type TSESLint, type TSESTree } from '@typescript-eslint/utils';
import { existsSync, readFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve, sep } from 'node:path';
import { createRule } from './create-rule.ts';

const scope = '@avelune/ui/';

type MessageId =
  | 'deepImport'
  | 'unknownEntryPoint'
  | 'upward'
  | 'testingInRuntime'
  | 'relativeCrossing'
  | 'missingManifest'
  | 'invalidLayer';

interface Library {
  readonly root: string;
  /** Layers from lowest to highest, read from entry.schema.json. */
  readonly layers: readonly string[];
}

interface EntryPoint {
  /** The first folder under the library root: `button` for `button/` and `button/testing/`. */
  readonly name: string;
  /** The folder holding the entry point's ng-package.json. */
  readonly dir: string;
  readonly testing: boolean;
}

function readJson(path: string): unknown {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function layersOf(schemaPath: string): readonly string[] {
  const schema = readJson(schemaPath);
  const layers: unknown =
    typeof schema === 'object' && schema !== null
      ? Reflect.get(Reflect.get(Reflect.get(schema, 'properties') ?? {}, 'layer') ?? {}, 'enum')
      : undefined;
  if (!Array.isArray(layers) || !layers.every((layer) => typeof layer === 'string')) {
    throw new Error(`${schemaPath} does not list the layers in properties.layer.enum`);
  }
  return layers;
}

/** The library is the nearest ancestor folder holding entry.schema.json. */
function findLibrary(file: string): Library | null {
  for (let dir = dirname(file); dir !== dirname(dir); dir = dirname(dir)) {
    const schema = join(dir, 'entry.schema.json');
    if (existsSync(schema)) {
      return { root: dir, layers: layersOf(schema) };
    }
  }
  return null;
}

/** The entry point a path belongs to: its nearest folder with ng-package.json below the library root. */
function entryPointOf(path: string, library: Library): EntryPoint | null {
  for (let dir = dirname(path); dir.startsWith(library.root + sep); dir = dirname(dir)) {
    if (existsSync(join(dir, 'ng-package.json'))) {
      const [name = ''] = relative(library.root, dir).split(sep);
      return { name, dir, testing: basename(dir) === 'testing' && dirname(dir) !== library.root };
    }
  }
  return null;
}

/** The entry point's layer, `undefined` when entry.json is missing, `null` when it names an unknown layer. */
function layerOf(library: Library, name: string): string | null | undefined {
  const manifest = join(library.root, name, 'entry.json');
  if (!existsSync(manifest)) {
    return undefined;
  }
  const json = readJson(manifest);
  const layer: unknown = typeof json === 'object' && json !== null ? Reflect.get(json, 'layer') : undefined;
  return typeof layer === 'string' && library.layers.includes(layer) ? layer : null;
}

function listeners(
  context: Readonly<TSESLint.RuleContext<MessageId, []>>,
  library: Library,
  source: EntryPoint,
): TSESLint.RuleListener {
  const file = context.filename;
  const sourceLayer = layerOf(library, source.name);
  const testCode = source.testing || /\.(spec|stories)\.ts$/.test(file);

  function check(node: TSESTree.Node, specifier: string): void {
    if (specifier.startsWith(scope)) {
      const [name = '', ...rest] = specifier.slice(scope.length).split('/');
      const sub = rest.join('/');
      if (sub !== '' && sub !== 'testing') {
        context.report({ node, messageId: 'deepImport', data: { specifier, public: `${scope}${name}` } });
        return;
      }
      const targetLayer = layerOf(library, name);
      if (targetLayer === undefined || targetLayer === null) {
        context.report({ node, messageId: 'unknownEntryPoint', data: { specifier, name } });
        return;
      }
      if (sourceLayer && library.layers.indexOf(targetLayer) > library.layers.indexOf(sourceLayer)) {
        context.report({
          node,
          messageId: 'upward',
          data: { source: source.name, sourceLayer, target: name, targetLayer },
        });
      }
      if (sub === 'testing' && !testCode) {
        context.report({ node, messageId: 'testingInRuntime', data: { specifier } });
      }
    } else if (specifier.startsWith('.')) {
      // Resolve as if to a file inside the target, so that "./testing" lands in the testing entry point.
      const target = entryPointOf(resolve(dirname(file), specifier, 'index.ts'), library);
      if (target?.dir !== source.dir) {
        context.report({ node, messageId: 'relativeCrossing', data: { specifier, source: source.name } });
      }
    }
  }

  function checkSource(node: TSESTree.Node, literal: TSESTree.Node | null | undefined): void {
    if (literal?.type === AST_NODE_TYPES.Literal && typeof literal.value === 'string') {
      check(node, literal.value);
    }
  }

  return {
    Program(node) {
      if (sourceLayer === undefined) {
        context.report({ node, messageId: 'missingManifest', data: { source: source.name } });
      } else if (sourceLayer === null) {
        context.report({
          node,
          messageId: 'invalidLayer',
          data: { source: source.name, layers: library.layers.join(', ') },
        });
      }
    },
    ImportDeclaration: (node) => {
      checkSource(node, node.source);
    },
    ExportNamedDeclaration: (node) => {
      checkSource(node, node.source);
    },
    ExportAllDeclaration: (node) => {
      checkSource(node, node.source);
    },
    ImportExpression: (node) => {
      checkSource(node, node.source);
    },
    TSImportType: (node) => {
      checkSource(node, node.source);
    },
  };
}

export const entryPointLayers = createRule<[], MessageId>({
  meta: {
    type: 'problem',
    docs: {
      description: 'Entry points of @avelune/ui import only their own or lower layers, through public specifiers',
    },
    schema: [],
    messages: {
      deepImport:
        'Import "{{specifier}}" through its public specifier "{{public}}"; entry-point internals are private.',
      unknownEntryPoint: '"{{specifier}}" is not an entry point of @avelune/ui (no {{name}}/entry.json).',
      upward:
        '{{source}} ({{sourceLayer}}) must not import {{target}} ({{targetLayer}}): dependencies point down the layers.',
      testingInRuntime:
        'Runtime code must not import the harness entry point "{{specifier}}"; only specs and harnesses may.',
      relativeCrossing:
        'Relative import "{{specifier}}" leaves the entry point {{source}}; import other entry points as "@avelune/ui/<name>".',
      missingManifest: 'Entry point {{source}} has no entry.json declaring its layer.',
      invalidLayer: 'The entry.json of {{source}} names an unknown layer; use one of {{layers}}.',
    },
  },
  defaultOptions: [],
  create(context) {
    const library = findLibrary(context.filename);
    const source = library === null ? null : entryPointOf(context.filename, library);
    return library === null || source === null ? {} : listeners(context, library, source);
  },
});
