import { noAppearanceInputs } from './no-appearance-inputs.ts';
import { RuleTester } from './rule-tester.ts';

const tester = new RuleTester();

tester.run('no-appearance-inputs', noAppearanceInputs, {
  valid: [
    "class A { readonly variant = input<'primary' | 'secondary'>('secondary'); }",
    'class A { readonly size = input.required<Size>(); }',
    "class A { readonly value = model(''); }",
    "class A { readonly colorScheme = input('light'); }",
    "class A { readonly color = signal('red'); }",
    "class A { readonly tone = input('neutral', { alias: 'tone' }); }",
  ],
  invalid: [
    { code: "class A { readonly color = input(''); }", errors: [{ messageId: 'appearance', data: { name: 'color' } }] },
    { code: "class A { readonly class = input(''); }", errors: [{ messageId: 'appearance', data: { name: 'class' } }] },
    { code: 'class A { readonly style = input.required<string>(); }', errors: [{ messageId: 'appearance' }] },
    { code: "class A { readonly appearance = model('outline'); }", errors: [{ messageId: 'appearance' }] },
    { code: 'class A { readonly ngClass = model.required<string>(); }', errors: [{ messageId: 'appearance' }] },
    { code: 'class A { readonly ClassName = input(); }', errors: [{ messageId: 'appearance' }] },
    {
      code: "class A { readonly tone = input('', { alias: 'color' }); }",
      errors: [{ messageId: 'appearance', data: { name: 'color' } }],
    },
    {
      code: "class A { readonly tone = input.required({ alias: 'style' }); }",
      errors: [{ messageId: 'appearance', data: { name: 'style' } }],
    },
  ],
});
