// Proves: strictFunctionTypes
// Expect: TS2322

type Handler = (value: string | number) => void;

export const handler: Handler = (value: string) => value.trim();
