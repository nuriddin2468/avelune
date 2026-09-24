// Proves: exactOptionalPropertyTypes
// Expect: TS2375

interface Options {
  readonly label?: string;
}

// An absent option and an option set to `undefined` are different; only the first is allowed.
export const options: Options = { label: undefined };
