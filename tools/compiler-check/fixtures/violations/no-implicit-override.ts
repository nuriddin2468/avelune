// Proves: noImplicitOverride
// Expect: TS4114

export class Base {
  describe(): string {
    return 'base';
  }
}

export class Derived extends Base {
  describe(): string {
    return 'derived';
  }
}
