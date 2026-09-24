// avelune/component-layer: a kit stylesheet puts every rule inside a cascade layer it may use: `components` for an
// entry point (ADR 0004), the reset, base and utilities layers for the global stylesheets (ADR 0030). The layer order
// declared in styles.css then decides every conflict, and consumer CSS wins.
import stylelint, { type Rule } from 'stylelint';

const {
  createPlugin,
  utils: { report, ruleMessages, validateOptions },
} = stylelint;

export const ruleName = 'avelune/component-layer';

const messages = ruleMessages(ruleName, {
  rejected: (layers: string) => `Put this inside @layer ${layers} { … }; kit styles are layered (ADR 0004, 0030).`,
});

const isLayerName = (value: unknown) => typeof value === 'string' && value !== '';

const rule: Rule<string | readonly string[]> = (primary) => (root, result) => {
  if (!validateOptions(result, ruleName, { actual: primary, possible: [isLayerName] })) return;
  const layers: readonly string[] = typeof primary === 'string' ? [primary] : primary;
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
