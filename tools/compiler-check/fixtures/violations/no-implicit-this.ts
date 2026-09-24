// Proves: noImplicitThis
// Expect: TS2683

export function label() {
  return this.name;
}
