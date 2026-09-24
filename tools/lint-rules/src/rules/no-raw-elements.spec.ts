import angular from 'angular-eslint';
import { noRawElements } from './no-raw-elements.ts';
import { RuleTester } from './rule-tester.ts';

const tester = new RuleTester({ languageOptions: { parser: angular.templateParser } });
const options = [{ elements: { button: ['aveButton', 'aveIconButton'], select: [], dialog: [] } }] as const;

tester.run('no-raw-elements', noRawElements, {
  valid: [
    { code: '<button aveButton type="button">Save</button>', options },
    { code: '<button type="button" aveIconButton aria-label="Close"></button>', options },
    { code: '<button type="button" [aveButton]="variant">Save</button>', options },
    { code: '<ave-select />', options },
    { code: '<a href="/reports">Reports</a>', options },
    { code: '<input type="text" />', options },
  ],
  invalid: [
    {
      code: '<button type="button">Save</button>',
      options,
      errors: [{ messageId: 'needsMarker', data: { element: 'button', markers: 'aveButton, aveIconButton' } }],
    },
    { code: '<select></select>', options, errors: [{ messageId: 'replaced', line: 1, column: 1 }] },
    {
      code: '@if (open) {\n  <dialog open>Saved</dialog>\n}',
      options,
      errors: [{ messageId: 'replaced', line: 2, column: 3 }],
    },
    {
      code: '<button type="button" aveButtonish>Save</button>',
      options,
      errors: [{ messageId: 'needsMarker' }],
    },
  ],
});
