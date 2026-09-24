// Proves: useUnknownInCatchVariables
// Expect: TS18046

export function parse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch (error) {
    return error.message;
  }
}
