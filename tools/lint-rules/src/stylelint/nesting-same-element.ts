// avelune/nesting-same-element: a nested rule may only refine the element of its parent (&:hover, &[aria-…],
// &::before), and never the host. Up to Angular 22.1 the emulated shim scoped the outer selector alone, so a nested
// selector that reached another element (.title, & .icon, :host &) leaked into child components; everything else is
// still written flat (ADR 0024). Since Angular 22.2 the shim adds the content attribute to every nested selector, `&`
// included, and the host does not carry that attribute: `:host { &:hover {} }` never matches (ADR 0024, addendum).
import stylelint, { type Rule } from 'stylelint';

const {
  createPlugin,
  utils: { report, ruleMessages, validateOptions },
} = stylelint;

export const ruleName = 'avelune/nesting-same-element';

const messages = ruleMessages(ruleName, {
  rejected: (selector: string) =>
    `Nested "${selector}" reaches another element; write it as a top-level rule (ADR 0024).`,
  host: (selector: string) =>
    `Nested "${selector}" refines :host, and the emulated shim scopes it to the component's content, so it never matches the host; write it as :host(…) (ADR 0024, addendum).`,
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
  readonly selector?: string;
  readonly parent?: Ancestor | undefined;
}

/** The nearest rule around a rule, also through at-rules: `.card` for `.card { @media (…) { .title {} } }`. */
function parentRule(node: Ancestor): Ancestor | undefined {
  const { parent } = node;
  if (parent === undefined) return undefined;
  return parent.type === 'rule' ? parent : parentRule(parent);
}

const rule: Rule<true> = (primary) => (root, result) => {
  if (!validateOptions(result, ruleName, { actual: primary, possible: [true] })) {
    return;
  }
  root.walkRules((node) => {
    const parent = parentRule(node);
    if (parent === undefined) {
      return;
    }
    const underHost = (parent.selector ?? '').includes(':host');
    for (const selector of node.selectors) {
      if (!refinesParent(selector)) {
        report({ result, ruleName, node, word: selector, message: messages.rejected, messageArgs: [selector] });
      } else if (underHost) {
        report({ result, ruleName, node, word: selector, message: messages.host, messageArgs: [selector] });
      }
    }
  });
};

rule.ruleName = ruleName;
rule.messages = messages;

export const nestingSameElement = createPlugin(ruleName, rule);
