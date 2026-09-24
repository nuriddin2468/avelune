// avelune/layer-order: the global stylesheet declares the kit's layer order once, before anything else (brief §6.1,
// ADR 0004, 0030). A layer takes its place in the cascade from the first time it is named, so the statement must come
// before the tokens' `@layer tokens` block that the stylesheet imports, and it must list exactly the kit's layers.
import stylelint, { type Rule } from 'stylelint';

const {
  createPlugin,
  utils: { report, ruleMessages, validateOptions },
} = stylelint;

export const ruleName = 'avelune/layer-order';

const messages = ruleMessages(ruleName, {
  missing: (order: string) => `Start the stylesheet with @layer ${order}; (ADR 0030).`,
  wrong: (found: string, order: string) => `The layer order is ${order}, not ${found} (ADR 0004, 0030).`,
  repeated: () => 'Declare the layer order once, at the top of the stylesheet (ADR 0030).',
});

const isLayerName = (value: unknown) => typeof value === 'string' && /^[a-z][a-z-]*$/.test(value);

const rule: Rule<readonly string[]> = (primary) => (root, result) => {
  if (!validateOptions(result, ruleName, { actual: primary, possible: [isLayerName] })) return;
  const order = primary.join(', ');
  const statements = root.nodes.filter(
    (node) => node.type === 'atrule' && node.name.toLowerCase() === 'layer' && node.nodes === undefined,
  );
  const first = root.nodes.find((node) => node.type !== 'comment');
  if (first === undefined || !statements.includes(first)) {
    report({ result, ruleName, node: first ?? root, message: messages.missing, messageArgs: [order] });
  }
  for (const statement of statements) {
    if (statement !== first) {
      report({ result, ruleName, node: statement, message: messages.repeated });
      continue;
    }
    if (statement.type !== 'atrule') continue;
    const found = statement.params
      .split(',')
      .map((name) => name.trim())
      .join(', ');
    if (found !== order) {
      report({ result, ruleName, node: statement, message: messages.wrong, messageArgs: [found, order] });
    }
  }
};

rule.ruleName = ruleName;
rule.messages = messages;

export const layerOrder = createPlugin(ruleName, rule);
