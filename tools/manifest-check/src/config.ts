// Entry points whose components the manifest need not hold, each with its reason (ADR 0090). Adding one needs an ADR.
export const exempt: ReadonlyMap<string, string> = new Map([
  ['forms', 'the plumbing of the kit’s own controls (ADR 0039, 0052): an application binds the controls, never these'],
]);
