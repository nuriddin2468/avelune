// Proves: noImplicitReturns
// Expect: TS7030

export function width(size: 'sm' | 'md'): number | undefined {
  if (size === 'sm') {
    return 32;
  }
}
