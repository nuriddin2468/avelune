// Proves: noFallthroughCasesInSwitch
// Expect: TS7029

export function height(size: 'sm' | 'md'): number {
  let result = 0;
  switch (size) {
    case 'sm':
      result += 28;
    case 'md':
      result += 32;
  }
  return result;
}
