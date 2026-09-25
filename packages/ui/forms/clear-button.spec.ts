import { Component, LOCALE_ID, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AVE_FIELD, AveClearButton, type AveFieldContext } from '@avelune/ui/forms';
import { describe, expect, it } from 'vitest';

@Component({
  selector: 'ave-clear-host',
  imports: [AveClearButton],
  template: `
    <button aveClearButton type="button">×</button>
    <button aveClearButton type="button" label="Вид договора">×</button>
  `,
})
class Host {}

/** A stand-in for `<ave-form-field>`, with the id of its label. */
const field: AveFieldContext = {
  defaultId: 'field-control',
  labelId: 'field-label',
  describedBy: signal<readonly string[]>([]),
  register: () => undefined,
};

/** The ids that name a button. */
function ids(button: Element | undefined): string[] {
  return (button?.getAttribute('aria-labelledby') ?? '').split(' ');
}

function mount(providers: unknown[] = []): HTMLButtonElement[] {
  TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: 'uz-Cyrl' }, ...providers] });
  const fixture = TestBed.createComponent(Host);
  document.body.append(fixture.nativeElement as HTMLElement);
  fixture.detectChanges();
  return [...(fixture.nativeElement as HTMLElement).querySelectorAll('button')];
}

describe('AveClearButton', () => {
  it('is a plain button out of the Tab order, says "Clear" in the locale, and keeps focus where it is', () => {
    const [plain, labelled] = mount();
    expect(plain?.type).toBe('button');
    expect(plain?.tabIndex).toBe(-1);
    expect(plain?.getAttribute('data-focus-ring')).toBe('inset');
    expect(plain?.querySelector('[hidden]')?.textContent).toBe('Тозалаш');
    expect(ids(plain)).toHaveLength(1);
    const press = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    labelled?.dispatchEvent(press);
    expect(press.defaultPrevented).toBe(true);
    expect(document.activeElement).not.toBe(labelled);
  });

  it("adds the control's own label without a form field, and the field's label inside one", () => {
    const [, labelled] = mount();
    const [clear, label] = ids(labelled);
    expect(document.getElementById(clear ?? '')?.textContent).toBe('Тозалаш');
    expect(document.getElementById(label ?? '')?.textContent).toBe('Вид договора');
    TestBed.resetTestingModule();
    const inField = mount([{ provide: AVE_FIELD, useValue: field }]);
    for (const button of inField) {
      expect(button.getAttribute('aria-labelledby')?.endsWith(' field-label')).toBe(true);
      expect(button.querySelectorAll('[hidden]')).toHaveLength(1);
    }
  });
});
