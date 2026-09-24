// Proves: noUncheckedIndexedAccess
// Expect: TS2322

const sizes: readonly string[] = ['sm', 'md', 'lg'];

export const first: string = sizes[0];
