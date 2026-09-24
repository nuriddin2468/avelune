import { ESLintUtils } from '@typescript-eslint/utils';

/** Rule factory for the `avelune` plugin. The rules are documented in tools/lint-rules/README.md. */
export const createRule = ESLintUtils.RuleCreator.withoutDocs;
