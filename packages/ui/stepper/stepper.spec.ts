import { Component, LOCALE_ID, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { tokens, type TokenName } from '@avelune/tokens';
import { AveStepper, type AveStep, type AveStepperOrientation } from '@avelune/ui/stepper';
import { AveStepperHarness } from '@avelune/ui/stepper/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';

@Component({
  selector: 'ave-stepper-host',
  imports: [AveStepper],
  template: `
    <div class="frame">
      <ave-stepper
        label="Оформление договора"
        [steps]="steps()"
        [current]="current()"
        [orientation]="orientation()"
        [selectable]="selectable()"
        (stepSelected)="current.set($event)"
      />
    </div>
  `,
})
class StepperHost {
  readonly steps = signal<readonly AveStep[]>([
    { label: 'Стороны', description: 'Контрагент и подписанты' },
    { label: 'Условия', description: 'Не указан срок оплаты', error: true },
    { label: 'Файлы' },
    { label: 'Проверка' },
  ]);
  readonly current = signal(2);
  readonly orientation = signal<AveStepperOrientation>('horizontal');
  readonly selectable = signal(true);
}

const used = [
  'space.1',
  'space.2',
  'space.3',
  'space.6',
  'radius.sm',
  'radius.full',
  'size.icon.sm',
  'size.icon.lg',
  'border-width.default',
  'border-width.selected',
  'font.label-md',
  'font.label-sm',
  'font.caption',
  'color.fg.default',
  'color.fg.muted',
  'color.fg.on-accent',
  'color.fg.on-danger',
  'color.accent.bg',
  'color.accent.fg',
  'color.accent.border',
  'color.danger.bg',
  'color.danger.fg',
  'color.border.default',
  'color.border.strong',
] as const satisfies readonly TokenName[];

const root = document.documentElement;
const reset = document.createElement('style');
// The kit's reset (ADR 0030); a form's width.
reset.textContent = '*, ::before, ::after { box-sizing: border-box; } .frame { inline-size: 720px; }';

beforeEach(() => {
  for (const name of used) root.style.setProperty(tokens[name].cssVar, tokens[name].css);
  root.style.setProperty('--ave-font-label-md-line-height', '20px');
  document.head.append(reset);
  TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: 'ru' }] });
});

afterEach(() => {
  for (const name of used) root.style.removeProperty(tokens[name].cssVar);
  root.style.removeProperty('--ave-font-label-md-line-height');
  reset.remove();
});

async function mount(): Promise<{
  fixture: ComponentFixture<StepperHost>;
  element: HTMLElement;
  stepper: AveStepperHarness;
}> {
  const fixture = TestBed.createComponent(StepperHost);
  const element = fixture.nativeElement as HTMLElement;
  document.body.prepend(element);
  fixture.detectChanges();
  await fixture.whenStable();
  const stepper = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveStepperHarness);
  return { fixture, element, stepper };
}

function step(element: HTMLElement, index: number): HTMLElement {
  const found = element.querySelectorAll<HTMLElement>('li')[index];
  if (found === undefined) throw new Error(`No step ${String(index)}`);
  return found;
}

describe('AveStepper', () => {
  it('is a named ordered list of steps, done before the current one and ahead after it', async () => {
    const { element, stepper } = await mount();
    expect(await stepper.getLabel()).toBe('Оформление договора');
    expect(await stepper.getSteps()).toEqual([
      { label: 'Стороны', state: 'done', error: false },
      { label: 'Условия', state: 'done', error: true },
      { label: 'Файлы', state: 'current', error: false },
      { label: 'Проверка', state: 'ahead', error: false },
    ]);
    expect(await stepper.getCurrent()).toBe('Файлы');
    expect(step(element, 2).getAttribute('aria-current')).toBe('step');
    expect(step(element, 1).hasAttribute('aria-current')).toBe(false);
    // The marks say the state in words: a check for a done step, a cross for one that needs attention, else the number.
    expect(step(element, 0).querySelector('ave-icon')?.getAttribute('aria-label')).toBe('Выполнен');
    expect(step(element, 1).querySelector('ave-icon')?.getAttribute('aria-label')).toBe('Требует внимания');
    expect(step(element, 2).querySelector('.mark')?.textContent.trim()).toBe('3');
    expect(step(element, 3).querySelector('.mark')?.textContent.trim()).toBe('4');
    element.remove();
  });

  it('makes the done steps buttons back to them when it is selectable, and text when it is not', async () => {
    const { fixture, element, stepper } = await mount();
    expect(element.querySelectorAll('li button')).toHaveLength(2);
    await stepper.goTo(/^Условия/);
    expect(fixture.componentInstance.current()).toBe(1);
    await stepper.goTo('Стороны');
    expect(fixture.componentInstance.current()).toBe(0);
    expect(await stepper.getCurrent()).toBe('Стороны');
    await expect(stepper.goTo('Проверка')).rejects.toThrow('no done step to go back to matches Проверка');
    fixture.componentInstance.current.set(3);
    fixture.componentInstance.selectable.set(false);
    fixture.detectChanges();
    expect(element.querySelectorAll('li button')).toHaveLength(0);
    // Every step done: nothing is current.
    fixture.componentInstance.current.set(4);
    fixture.detectChanges();
    expect(await stepper.getCurrent()).toBeNull();
    element.remove();
  });

  it('underlines a done step under the pointer and rings it on focus', async () => {
    const { element } = await mount();
    const back = element.querySelector<HTMLElement>('li button');
    if (back === null) throw new Error('No button');
    await userEvent.hover(back);
    expect(getComputedStyle(back.querySelector('.label') ?? back).textDecorationLine).toBe('underline');
    await userEvent.unhover(back);
    back.focus();
    expect(document.activeElement).toBe(back);
    element.remove();
  });

  it('lays a row of steps that share the width, words under the marks, lines between them', async () => {
    const { element } = await mount();
    const first = step(element, 0).getBoundingClientRect();
    const second = step(element, 1).getBoundingClientRect();
    expect(first.top).toBe(second.top);
    expect(Math.round(first.width)).toBe(Math.round(second.width));
    const mark = step(element, 0).querySelector('.mark')?.getBoundingClientRect();
    const label = step(element, 0).querySelector('.label')?.getBoundingClientRect();
    expect(mark?.width).toBe(24);
    expect((label?.top ?? 0) - (mark?.bottom ?? 0)).toBe(8);
    const line = getComputedStyle(step(element, 0), '::after');
    expect(line.height).toBe('1px');
    expect(line.backgroundColor).toBe(
      getComputedStyle(step(element, 0).querySelector('.mark') ?? element).backgroundColor,
    );
    expect(getComputedStyle(step(element, 3), '::after').display).toBe('none');
    // The current mark: a 2px ring; one ahead: a 1px ring.
    expect(getComputedStyle(step(element, 2).querySelector('.mark') ?? element).borderTopWidth).toBe('2px');
    expect(getComputedStyle(step(element, 3).querySelector('.mark') ?? element).borderTopWidth).toBe('1px');
    element.remove();
  });

  it('lays out as a column when asked, and in a container under 480px', async () => {
    const { fixture, element } = await mount();
    fixture.componentInstance.orientation.set('vertical');
    fixture.detectChanges();
    const column = (): boolean =>
      step(element, 1).getBoundingClientRect().top > step(element, 0).getBoundingClientRect().bottom - 1;
    expect(column()).toBe(true);
    const mark = step(element, 0).querySelector('.mark')?.getBoundingClientRect();
    const label = step(element, 0).querySelector('.label')?.getBoundingClientRect();
    expect((label?.left ?? 0) - (mark?.right ?? 0)).toBe(12);
    fixture.componentInstance.orientation.set('horizontal');
    element.querySelector<HTMLElement>('.frame')?.style.setProperty('inline-size', '360px');
    fixture.detectChanges();
    expect(column()).toBe(true);
    element.remove();
  });

  it('finds a stepper by the name of its list', async () => {
    const { fixture, element } = await mount();
    const loader = TestbedHarnessEnvironment.loader(fixture);
    expect(await loader.getAllHarnesses(AveStepperHarness.with({ label: /договора$/ }))).toHaveLength(1);
    expect(await loader.getAllHarnesses(AveStepperHarness.with({ label: 'Маршрут' }))).toHaveLength(0);
    element.remove();
  });
});
