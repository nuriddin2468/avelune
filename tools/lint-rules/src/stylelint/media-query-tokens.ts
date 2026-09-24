// avelune/media-query-tokens: a width in a media query is a breakpoint token and a width in a container query is a
// container token (ADR 0017). Queries cannot read custom properties, so the values are checked against tokens.css.
import { readFileSync } from 'node:fs';
import stylelint, { type Rule } from 'stylelint';

const {
  createPlugin,
  utils: { report, ruleMessages, validateOptions },
} = stylelint;

export const ruleName = 'avelune/media-query-tokens';

const messages = ruleMessages(ruleName, {
  rejected: (value: string, kind: string, allowed: string) =>
    `${value} is not a ${kind} token; use one of ${allowed} (ADR 0017).`,
});

/** The width features that each kind of query may compare against a token. */
const features = {
  media: { kind: 'breakpoint', names: /\b(?:min-|max-)?width\b/ },
  container: { kind: 'container', names: /\b(?:min-|max-)?(?:width|inline-size)\b/ },
} as const;

/** The px values of `--ave-<group>-*` in tokens.css, e.g. breakpoint → 600px, 840px, … */
function tokenValues(css: string, group: string): readonly string[] {
  const values = [...css.matchAll(new RegExp(`--ave-${group}-[a-z0-9-]+:\\s*([0-9.]+px)`, 'g'))].map(
    (match) => match[1] ?? '',
  );
  return [...new Set(values)].sort((a, b) => parseFloat(a) - parseFloat(b));
}

const isString = (value: unknown) => typeof value === 'string';

const rule: Rule<true, { readonly tokens: string }> = (primary, secondary) => (root, result) => {
  const valid = validateOptions(
    result,
    ruleName,
    { actual: primary, possible: [true] },
    { actual: secondary, possible: { tokens: [isString] } },
  );
  if (!valid) {
    return;
  }
  const css = readFileSync(secondary.tokens, 'utf8');
  const allowed = { breakpoint: tokenValues(css, 'breakpoint'), container: tokenValues(css, 'container') };

  root.walkAtRules(/^(?:media|container)$/i, (atRule) => {
    const { kind, names } = features[atRule.name.toLowerCase() === 'media' ? 'media' : 'container'];
    for (const [, group = ''] of atRule.params.matchAll(/\(([^()]*)\)/g)) {
      if (!names.test(group)) {
        continue;
      }
      for (const [value] of group.matchAll(/-?\d*\.?\d+[a-z%]*/gi)) {
        if (!allowed[kind].includes(value)) {
          report({
            result,
            ruleName,
            node: atRule,
            word: value,
            message: messages.rejected,
            messageArgs: [value, kind, allowed[kind].join(', ')],
          });
        }
      }
    }
  });
};

rule.ruleName = ruleName;
rule.messages = messages;

export const mediaQueryTokens = createPlugin(ruleName, rule);
