// avelune/no-token-declarations: an application never declares an `--ave-*` property. A token it redefines changes one
// theme and breaks the other, with no contrast check, and a component's private properties are the component's. A
// product's or a tenant's colour goes through the brand generator (ADR 0089, 0104).
import stylelint, { type Rule } from 'stylelint';

const {
  createPlugin,
  utils: { report, ruleMessages, validateOptions },
} = stylelint;

export const ruleName = 'avelune/no-token-declarations';

const messages = ruleMessages(ruleName, {
  rejected: (property: string) =>
    `${property} belongs to the kit; never declare an --ave-* property. A brand colour goes through the brand generator (ADR 0089).`,
});

const rule: Rule<true> = (primary) => (root, result) => {
  if (!validateOptions(result, ruleName, { actual: primary, possible: [true] })) {
    return;
  }
  root.walkDecls(/^--ave-/, (declaration) => {
    report({
      result,
      ruleName,
      node: declaration,
      word: declaration.prop,
      message: messages.rejected,
      messageArgs: [declaration.prop],
    });
  });
};

rule.ruleName = ruleName;
rule.messages = messages;

export const noTokenDeclarations = createPlugin(ruleName, rule);
