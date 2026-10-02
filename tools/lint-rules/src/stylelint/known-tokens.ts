// avelune/known-tokens: every `var(--ave-*)` names a token of tokens.css. Any other `--ave-*` name is a typo, a
// primitive (never emitted, ADR 0016) or a component's private property, none of which an application may read. The
// application's own custom properties are not checked (ADR 0104).
import { readFileSync } from 'node:fs';
import stylelint, { type Rule } from 'stylelint';

const {
  createPlugin,
  utils: { report, ruleMessages, validateOptions },
} = stylelint;

export const ruleName = 'avelune/known-tokens';

const messages = ruleMessages(ruleName, {
  rejected: (name: string) =>
    `${name} is not a token of @avelune/tokens; use a name from tokens.css, listed on the Foundations pages (ADR 0104).`,
});

/** The `--ave-*` names that a tokens.css declares, read once per file. */
const declared = new Map<string, ReadonlySet<string>>();

function tokenNames(path: string): ReadonlySet<string> {
  let names = declared.get(path);
  if (names === undefined) {
    const css = readFileSync(path, 'utf8');
    names = new Set([...css.matchAll(/(--ave-[a-z0-9-]+)\s*:/g)].map((match) => match[1] ?? ''));
    declared.set(path, names);
  }
  return names;
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
  const names = tokenNames(secondary.tokens);
  root.walkDecls((declaration) => {
    for (const [, name = ''] of declaration.value.matchAll(/var\(\s*(--ave-[\w-]+)/g)) {
      if (!names.has(name)) {
        report({ result, ruleName, node: declaration, word: name, message: messages.rejected, messageArgs: [name] });
      }
    }
  });
};

rule.ruleName = ruleName;
rule.messages = messages;

export const knownTokens = createPlugin(ruleName, rule);
