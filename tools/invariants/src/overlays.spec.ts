import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { overlayViolations, type OverlayProbe } from './overlays.ts';

const probe = (overrides: Partial<OverlayProbe>): OverlayProbe => ({
  overlay: 'ave-menu [menu] "Действия"',
  path: '/contracts',
  modal: false,
  opened: true,
  radius: '12px',
  shadow: 'rgba(0, 0, 0, 0.1) 0px 2px 4px 0px',
  entered: ['ave-motion-pop-in'],
  exited: ['ave-motion-pop-out'],
  closesOnEscape: true,
  returnsFocus: true,
  closesOnOutsidePress: true,
  removed: true,
  ...overrides,
});

describe('overlayViolations', () => {
  it('accepts popups and modal dialogs that each share their family, open, leave and close as they should', () => {
    assert.deepEqual(
      overlayViolations([
        probe({}),
        probe({ overlay: 'ave-select [listbox] "Вид"', path: '/' }),
        probe({
          overlay: 'button [dialog] "Выгрузить"',
          modal: true,
          radius: '12px',
          shadow: 'rgba(0, 0, 0, 0.2) 0px 8px 24px 0px',
          entered: ['ave-motion-fade-in', 'ave-motion-pop-in'],
          exited: ['ave-motion-fade-out', 'ave-motion-pop-out'],
        }),
        probe({ overlay: 'button [dialog] "Настройки"', modal: true, shadow: 'rgba(0, 0, 0, 0.2) 0px 8px 24px 0px' }),
      ]),
      [],
    );
  });

  it('names each broken invariant, the family reference and the screen', () => {
    assert.deepEqual(
      overlayViolations([
        probe({}),
        probe({
          overlay: 'ave-popover [dialog] "Статус"',
          radius: '0px',
          shadow: 'none',
          entered: ['ave-motion-shimmer'],
          closesOnOutsidePress: false,
        }),
        probe({ overlay: 'ave-select [listbox] "Вид"', path: '/', exited: [], returnsFocus: false, removed: false }),
        probe({ overlay: 'ave-date-picker [dialog] "Дата"', closesOnEscape: false, exited: [], removed: false }),
        probe({ overlay: 'ave-combobox [listbox] ""', opened: false, radius: '', shadow: '' }),
      ]),
      [
        'ave-popover [dialog] "Статус": radius 0px, but the popup ave-menu [menu] "Действия" has 12px on /contracts',
        'ave-popover [dialog] "Статус": elevation none, but the popup ave-menu [menu] "Действия" has rgba(0, 0, 0, 0.1) 0px 2px 4px 0px on /contracts',
        'ave-popover [dialog] "Статус": plays no enter of the motion catalog on /contracts',
        'ave-popover [dialog] "Статус": does not close on a press outside it on /contracts',
        'ave-select [listbox] "Вид": plays no exit of the motion catalog on /',
        'ave-select [listbox] "Вид": does not give focus back to its control after Escape on /',
        'ave-select [listbox] "Вид": stays in the DOM after it closed on /',
        // Not closed by Escape: its exit, focus and removal are not judged.
        'ave-date-picker [dialog] "Дата": does not close on Escape on /contracts',
        'ave-combobox [listbox] "": does not open on a click or ArrowDown on /contracts',
      ],
    );
  });

  it('compares a modal dialog with the first modal dialog only', () => {
    const [violation] = overlayViolations([
      probe({ modal: true, overlay: 'a' }),
      probe({}),
      probe({ modal: true, overlay: 'b', radius: '8px' }),
    ]);
    assert.equal(violation, 'b: radius 8px, but the modal dialog a has 12px on /contracts');
  });
});
