// avelune/component-layer: a kit stylesheet puts every rule inside a cascade layer it may use: `components` for an
// entry point (ADR 0004), `patterns` for a pattern's (ADR 0091), the reset, base and utilities layers for the global
// stylesheets (ADR 0030). The layer order declared in styles.css then decides every conflict, and consumer CSS wins.
import stylelint, { type Rule } from 'stylelint';
import { entryLayerOf } from './entry-layer.ts';

const {
  createPlugin,
  utils: { report, ruleMessages, validateOptions },
} = stylelint;

export const ruleName = 'avelune/component-layer';

const messages = ruleMessages(ruleName, {
  rejected: (layers: string) =>
    `Put this inside @layer ${layers} { … }; kit styles are layered (ADR 0004, 0030, 0091).`,
});

interface Options {
  /** The cascade layer for the stylesheets of an entry point whose entry.json names a layer here: `patterns`. */
  readonly entryLayers?: Readonly<Record<string, string>>;
}

const isLayerName = (value: unknown) => typeof value === 'string' && value !== '';
const isLayerMap = (value: unknown) =>
  typeof value === 'object' && value !== null && Object.values(value).every(isLayerName);

const rule: Rule<string | readonly string[], Options | undefined> = (primary, secondary) => (root, result) => {
  const valid = validateOptions(
    result,
    ruleName,
    { actual: primary, possible: [isLayerName] },
    { actual: secondary, possible: { entryLayers: [isLayerMap] }, optional: true },
  );
  if (!valid) return;
  const entry = entryLayerOf(root.source?.input.file);
  const own = entry === undefined ? undefined : secondary?.entryLayers?.[entry];
  const layers: readonly string[] = own !== undefined ? [own] : typeof primary === 'string' ? [primary] : primary;
  for (const node of root.nodes) {
    const layered =
      node.type === 'atrule' &&
      node.name.toLowerCase() === 'layer' &&
      node.nodes !== undefined &&
      layers.includes(node.params.trim());
    if (node.type !== 'comment' && !layered) {
      report({ result, ruleName, node, message: messages.rejected, messageArgs: [layers.join(' | ')] });
    }
  }
};

rule.ruleName = ruleName;
rule.messages = messages;

export const componentLayer = createPlugin(ruleName, rule);
