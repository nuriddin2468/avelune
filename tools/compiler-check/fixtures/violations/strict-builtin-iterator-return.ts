// Proves: strictBuiltinIteratorReturn
// Expect: TS2322

// The iterator's return value is `undefined`, not `any`, so a finished iterator cannot pass for a number.
export const first: number = [1, 2, 3].values().next().value;
