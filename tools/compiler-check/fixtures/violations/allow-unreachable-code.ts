// Proves: allowUnreachableCode
// Expect: TS7027

export function label(): string {
  return 'label';
  console.log('never runs');
}
