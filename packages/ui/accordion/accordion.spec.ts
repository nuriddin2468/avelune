import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { tokens, type TokenName } from '@avelune/tokens';
import { AveAccordion, AveAccordionItem } from '@avelune/ui/accordion';
import { AveAccordionHarness } from '@avelune/ui/accordion/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';

@Component({
  selector: 'ave-accordion-host',
  imports: [AveAccordion, AveAccordionItem],
  template: `
    <ave-accordion class="terms" [multiple]="multiple()">
      <ave-accordion-item heading="Штрафы и пени" [(expanded)]="fines">
        <p>Пеня 0,1% от суммы за каждый день просрочки.</p>
      </ave-accordion-item>
      <ave-accordion-item heading="Форс-мажор"><p>Стороны освобождаются от ответственности.</p></ave-accordion-item>
      <ave-accordion-item heading="Конфиденциальность" disabled><p>Не раскрывать условия.</p></ave-accordion-item>
    </ave-accordion>
    <ave-accordion class="deep" [level]="4">
      <ave-accordion-item heading="Реквизиты"><p>ИНН 305 118 427</p></ave-accordion-item>
    </ave-accordion>
  `,
})
class AccordionHost {
  readonly multiple = signal(true);
  readonly fines = signal(true);
}

const used = [
  'space.2',
  'space.4',
  'border-width.default',
  'radius.md',
  'control.height.lg',
  'size.icon.sm',
  'font.heading-sm',
  'color.border.subtle',
  'color.fg.default',
  'color.fg.muted',
  'color.fg.disabled',
  'color.bg.hover',
  'easing.standard',
] as const satisfies readonly TokenName[];

const root = document.documentElement;
const reset = document.createElement('style');
reset.textContent =
  '@layer reset, components; @layer reset { *, ::before, ::after { box-sizing: border-box; } p { margin: 0; } }';

beforeEach(() => {
  for (const name of used) root.style.setProperty(tokens[name].cssVar, tokens[name].css);
  root.style.setProperty('--ave-font-heading-sm-line-height', '20px');
  root.style.setProperty('--ave-duration-instant', '0ms');
  root.style.setProperty('--ave-timing-expand', '0ms');
  document.head.append(reset);
});

afterEach(() => {
  for (const name of used) root.style.removeProperty(tokens[name].cssVar);
  for (const name of ['--ave-font-heading-sm-line-height', '--ave-duration-instant', '--ave-timing-expand'])
    root.style.removeProperty(name);
  reset.remove();
});

async function mount(): Promise<{ fixture: ComponentFixture<AccordionHost>; element: HTMLElement }> {
  const fixture = TestBed.createComponent(AccordionHost);
  const element = fixture.nativeElement as HTMLElement;
  element.style.display = 'block';
  element.style.inlineSize = '480px';
  document.body.append(element);
  fixture.detectChanges();
  await fixture.whenStable();
  return { fixture, element };
}

function trigger(element: HTMLElement, words: string): HTMLButtonElement {
  const found = [...element.querySelectorAll<HTMLButtonElement>('.trigger')].find(
    (button) => button.textContent.trim() === words,
  );
  if (found === undefined) throw new Error(`No trigger ${words}`);
  return found;
}

describe('AveAccordion', () => {
  it('puts each trigger in a heading of the accordion’s level, controlling its region, inert while closed', async () => {
    const { fixture, element } = await mount();
    const accordion = await TestbedHarnessEnvironment.loader(fixture).getHarness(
      AveAccordionHarness.with({ heading: 'Форс-мажор' }),
    );
    expect(await accordion.getHeadings()).toEqual(['Штрафы и пени', 'Форс-мажор', 'Конфиденциальность']);
    expect(await accordion.getExpanded()).toEqual(['Штрафы и пени']);
    const fines = trigger(element, 'Штрафы и пени');
    expect(fines.parentElement?.getAttribute('role')).toBe('heading');
    expect(fines.parentElement?.getAttribute('aria-level')).toBe('3');
    expect(trigger(element, 'Реквизиты').parentElement?.getAttribute('aria-level')).toBe('4');
    const panel = document.getElementById(fines.getAttribute('aria-controls') ?? '');
    expect(panel?.getAttribute('role')).toBe('region');
    expect(panel?.hasAttribute('inert')).toBe(false);
    const closed = document.getElementById(trigger(element, 'Форс-мажор').getAttribute('aria-controls') ?? '');
    expect(closed?.hasAttribute('inert')).toBe(true);
    expect(closed?.getBoundingClientRect().height).toBe(0);
    expect(getComputedStyle(closed ?? element).visibility).toBe('hidden');
    expect(await accordion.getPanelText('Штрафы и пени')).toBe('Пеня 0,1% от суммы за каждый день просрочки.');
    expect(await accordion.getPanelText('Форс-мажор')).toBe('');
    element.remove();
  });

  it('opens several items, or one at a time with multiple set to false, and follows its expanded model', async () => {
    const { fixture, element } = await mount();
    const accordion = await TestbedHarnessEnvironment.loader(fixture).getHarness(
      AveAccordionHarness.with({ selector: '.terms' }),
    );
    await accordion.toggle('Форс-мажор');
    expect(await accordion.getExpanded()).toEqual(['Штрафы и пени', 'Форс-мажор']);
    expect(await accordion.isExpanded('Форс-мажор')).toBe(true);
    await accordion.toggle('Штрафы и пени');
    expect(fixture.componentInstance.fines()).toBe(false);
    fixture.componentInstance.fines.set(true);
    fixture.detectChanges();
    expect(await accordion.isExpanded('Штрафы и пени')).toBe(true);
    fixture.componentInstance.multiple.set(false);
    fixture.detectChanges();
    await accordion.toggle('Форс-мажор');
    await accordion.toggle('Форс-мажор');
    expect(await accordion.getExpanded()).toEqual(['Форс-мажор']);
    await expect(accordion.toggle('Реквизиты')).rejects.toThrow('no item has the heading');
    element.remove();
  });

  it('moves between headings with the arrows, Home and End, and toggles with Enter; a disabled one stays shut', async () => {
    const { fixture, element } = await mount();
    const accordion = await TestbedHarnessEnvironment.loader(fixture).getHarness(
      AveAccordionHarness.with({ selector: '.terms' }),
    );
    // The ring is drawn inside the trigger, clear of the open panel's first line.
    expect(trigger(element, 'Штрафы и пени').dataset['focusRing']).toBe('inset');
    trigger(element, 'Штрафы и пени').focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(trigger(element, 'Форс-мажор'));
    await userEvent.keyboard('{Enter}');
    expect(await accordion.isExpanded('Форс-мажор')).toBe(true);
    await userEvent.keyboard('{End}');
    expect(document.activeElement).toBe(trigger(element, 'Конфиденциальность'));
    expect(await accordion.isDisabled('Конфиденциальность')).toBe(true);
    await userEvent.keyboard('{Enter}');
    expect(await accordion.isExpanded('Конфиденциальность')).toBe(false);
    await userEvent.keyboard('{Home}');
    expect(document.activeElement).toBe(trigger(element, 'Штрафы и пени'));
    element.remove();
  });

  it('opens on timing.expand only once used, turning its chevron over; a trigger of the large control height', async () => {
    root.style.setProperty('--ave-timing-expand', tokens['timing.expand'].css);
    const { fixture, element } = await mount();
    const fines = trigger(element, 'Штрафы и пени');
    const panel = document.getElementById(fines.getAttribute('aria-controls') ?? '');
    expect(panel?.hasAttribute('data-used')).toBe(false);
    expect(getComputedStyle(panel ?? element).transitionProperty).toBe('all');
    expect(getComputedStyle(fines.querySelector('.chevron') ?? element).rotate).toBe('180deg');
    expect(fines.getBoundingClientRect().height).toBe(40);
    expect(getComputedStyle(fines).paddingInlineStart).toBe('8px');
    await userEvent.click(trigger(element, 'Форс-мажор'));
    fixture.detectChanges();
    const opened = document.getElementById(trigger(element, 'Форс-мажор').getAttribute('aria-controls') ?? '');
    const style = getComputedStyle(opened ?? element);
    expect(opened?.hasAttribute('data-used')).toBe(true);
    expect(style.transitionProperty).toBe('grid-template-rows, visibility');
    expect(style.transitionDuration).toBe('0.2s');
    // The panel's content 16px from the line below.
    const inner = opened?.querySelector('.inner');
    expect(getComputedStyle(inner ?? element).paddingBottom).toBe('16px');
    element.remove();
  });
});
