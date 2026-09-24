// avelune/component-layer: a component stylesheet puts every rule inside one cascade layer, `components` for the kit
// (ADR 0004), so that the layer order declared in styles.css decides every conflict and consumer CSS wins.
import stylelint, { type Rule } from 'stylelint';

const {
  createPlugin,
  utils: { report, ruleMessages, validateOptions },
} = stylelint;

export const ruleName = 'avelune/component-layer';

const messages = ruleMessages(ruleName, {
  rejected: (layer: string) => `Put this inside @layer ${layer} { … }; component styles are layered (ADR 0004).`,
});

const rule: Rule<string> = (layer) => (root, result) => {
  if (
    !validateOptions(result, ruleName, { actual: layer, possible: [(value: unknown) => typeof value === 'string'] })
  ) {
    return;
  }
  for (const node of root.nodes) {
    const layered = node.type === 'atrule' && node.name.toLowerCase() === 'layer' && node.params.trim() === layer;
    if (node.type !== 'comment' && !(layered && node.nodes !== undefined)) {
      report({ result, ruleName, node, message: messages.rejected, messageArgs: [layer] });
    }
  }
};

rule.ruleName = ruleName;
rule.messages = messages;

export const componentLayer = createPlugin(ruleName, rule);
