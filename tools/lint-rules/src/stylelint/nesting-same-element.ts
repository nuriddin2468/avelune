// avelune/nesting-same-element: a nested rule may only refine the element of its parent (&:hover, &[aria-…],
// &::before). Angular's emulated shim scopes the outer selector alone, so a nested selector that reaches another
// element (.title, & .icon, :host &) is not scoped and leaks into child components (ADR 0024).
import stylelint, { type Rule } from 'stylelint';

const {
  createPlugin,
  utils: { report, ruleMessages, validateOptions },
} = stylelint;

export const ruleName = 'avelune/nesting-same-element';

const messages = ruleMessages(ruleName, {
  rejected: (selector: string) =>
    `Nested "${selector}" reaches another element, which the emulated shim leaves unscoped; write it as a top-level rule (ADR 0024).`,
});

/** One compound on the parent element: `&`, then only pseudo-classes, pseudo-elements and attribute selectors. */
function refinesParent(selector: string): boolean {
  let flat = selector.trim();
  // Arguments of :not(), :is(), [attr="a b"] may hold spaces; they do not change which element is selected.
  for (let previous = ''; previous !== flat;) {
    previous = flat;
    flat = flat.replace(/\([^()]*\)/g, '()').replace(/\[[^[\]]*\]/g, '[]');
  }
  return /^&(?:::?[a-z-]+(?:\(\))?|\[\])+$/i.test(flat);
}

interface Ancestor {
  readonly type: string;
  readonly parent?: Ancestor | undefined;
}

/** True for a rule inside another rule, also through at-rules: `.card { @media (…) { .title {} } }`. */
function hasRuleAncestor(node: Ancestor): boolean {
  const { parent } = node;
  return parent !== undefined && (parent.type === 'rule' || hasRuleAncestor(parent));
}

const rule: Rule<true> = (primary) => (root, result) => {
  if (!validateOptions(result, ruleName, { actual: primary, possible: [true] })) {
    return;
  }
  root.walkRules((node) => {
    if (!hasRuleAncestor(node)) {
      return;
    }
    for (const selector of node.selectors) {
      if (!refinesParent(selector)) {
        report({ result, ruleName, node, word: selector, message: messages.rejected, messageArgs: [selector] });
      }
    }
  });
};

rule.ruleName = ruleName;
rule.messages = messages;

export const nestingSameElement = createPlugin(ruleName, rule);
