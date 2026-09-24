// The axe rules of the Storybook gate (parameters.a11y.test = 'error'), for the independent sweep of stories and docs
// pages (ADR 0006, 0027): axe's defaults without `region`, because a story or a docs page is a fragment of
// Storybook, not a page. Showcase screens keep `region` (tools/invariants).
import { AxeBuilder } from '@axe-core/playwright';
import type { Page } from '@playwright/test';

export interface Violation {
  readonly rule: string;
  readonly help: string;
  readonly targets: readonly string[];
}

/** The axe violations inside `include`, leaving out the `exclude` selectors. */
export async function axeViolations(
  page: Page,
  include: string,
  exclude: readonly string[] = [],
): Promise<Violation[]> {
  let axe = new AxeBuilder({ page }).include(include).disableRules(['region']);
  for (const selector of exclude) axe = axe.exclude(selector);
  const { violations } = await axe.analyze();
  return violations.map((violation) => ({
    rule: violation.id,
    help: violation.help,
    targets: violation.nodes.map((node) => node.target.join(' ')),
  }));
}
