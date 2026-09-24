// Proves: strictBindCallApply
// Expect: TS2345

function double(value: number): number {
  return value * 2;
}

export const doubled = double.call(undefined, 'two');
