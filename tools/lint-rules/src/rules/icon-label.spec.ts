import angular from 'angular-eslint';
import { iconLabel } from './icon-label.ts';
import { RuleTester } from './rule-tester.ts';

const tester = new RuleTester({ languageOptions: { parser: angular.templateParser } });

tester.run('icon-label', iconLabel, {
  valid: [
    { code: '<ave-icon name="circle-alert" label="Error" />' },
    { code: '<ave-icon name="download" decorative /> Download' },
    { code: '<ave-icon name="x" [label]="closeLabel" />' },
    { code: '<ave-icon name="x" [decorative]="true" />' },
    { code: '<ave-icon name="x" [label]="named ? name : undefined" [decorative]="!named" />' },
    { code: '<span label="not an icon"></span>' },
  ],
  invalid: [
    { code: '<ave-icon name="check" />', errors: [{ messageId: 'missing', line: 1, column: 1 }] },
    {
      code: '@for (name of names; track name) {\n  <ave-icon [name]="name" />\n}',
      errors: [{ messageId: 'missing', line: 2, column: 3 }],
    },
    { code: '<ave-icon name="x" label="Close" decorative />', errors: [{ messageId: 'both' }] },
  ],
});
