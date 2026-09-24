import { publicApiJsdoc } from './public-api-jsdoc.ts';
import { RuleTester } from './rule-tester.ts';

const tester = new RuleTester();

tester.run('public-api-jsdoc', publicApiJsdoc, {
  valid: [
    `/** A. */
    export class A {
      /** X. */
      readonly x = 1;
      private y = 2;
      protected z = 3;
      #w = 4;
      constructor() {}
      ngOnInit(): void {}
      writeValue(value: unknown): void {}
    }`,
    `/** Sample. */
    @Directive({ selector: '[aveSample]' })
    export class AveSample {
      /** Tone. */
      readonly tone = input('neutral');
      /** Label. */
      @Input() label = '';
    }`,
    `@Directive({ selector: '[aveSample]' })
    /** Documented after the decorator. */
    export class AveSample {}`,
    "export { AveSample } from './sample';",
    "export * from './sample';",
    "/** Tone. */\nexport type Tone = 'a' | 'b';",
    '/** Options. */\nexport interface Options {\n  /** Label. */\n  readonly label?: string;\n}',
    '/** Point. */\nexport type Point = {\n  /** X. */\n  readonly x: number;\n};',
    'class Internal { readonly x = 1; }',
    '/** Answer. */\nexport const answer = 42;',
  ],
  invalid: [
    { code: 'export class A {}', errors: [{ messageId: 'declaration', data: { name: 'A' } }] },
    {
      code: '/** A. */\nexport class A {\n  readonly x = 1;\n  static hostSelector = "[a]";\n}',
      errors: [
        { messageId: 'member', data: { name: 'x' } },
        { messageId: 'member', data: { name: 'hostSelector' } },
      ],
    },
    {
      code: '/** A. */\nexport class A {\n  @Input() label = "";\n}',
      errors: [{ messageId: 'member', data: { name: 'label' } }],
    },
    {
      code: '/** Options. */\nexport interface Options {\n  readonly label?: string;\n  focus(): void;\n}',
      errors: [
        { messageId: 'member', data: { name: 'label' } },
        { messageId: 'member', data: { name: 'focus' } },
      ],
    },
    { code: 'export const a = 1, b = 2;', errors: [{ messageId: 'declaration', data: { name: 'a, b' } }] },
    { code: '// A line comment is not JSDoc.\nexport function f(): void {}', errors: [{ messageId: 'declaration' }] },
    { code: '/* Nor is a plain block. */\nexport type T = string;', errors: [{ messageId: 'declaration' }] },
    {
      code: '/** Belongs to the constant. */\nconst unrelated = 1;\nexport class A {}',
      errors: [{ messageId: 'declaration', data: { name: 'A' } }],
    },
    {
      code: "@Component({ selector: 'ave-x', template: '' })\nexport class X {}",
      errors: [{ messageId: 'declaration', data: { name: 'X' } }],
    },
    { code: 'export default class {}', errors: [{ messageId: 'declaration', data: { name: 'default' } }] },
  ],
});
