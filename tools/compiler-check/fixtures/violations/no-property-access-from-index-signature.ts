// Proves: noPropertyAccessFromIndexSignature
// Expect: TS4111

const labels: Record<string, string> = { save: 'Save' };

export const save = labels.save;
