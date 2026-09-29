import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { tokens, type TokenName } from '@avelune/tokens';
import { AveList, AveListItem } from '@avelune/ui/list';
import { AveListHarness } from '@avelune/ui/list/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

@Component({
  selector: 'ave-list-host',
  imports: [AveList, AveListItem],
  template: `
    <ave-list label="Файлы договора">
      @for (file of files(); track file) {
        <ave-list-item>
          <span aveListStart class="start">PDF</span>
          <span class="name">{{ file }}</span>
          <span aveListEnd class="end">1,2 МБ</span>
        </ave-list-item>
      }
    </ave-list>
    <ave-list class="empty" label="Черновики">
      @for (draft of drafts(); track draft) {
        <ave-list-item>{{ draft }}</ave-list-item>
      }
    </ave-list>
    <ave-list-item class="alone">Без списка</ave-list-item>
    <ave-list class="plain" label="Заметки"><ave-list-item>Только текст</ave-list-item></ave-list>
  `,
})
class ListHost {
  readonly files = signal(['Договор поставки.pdf', 'Спецификация.xlsx']);
  readonly drafts = signal<string[]>([]);
}

const used = [
  'space.1',
  'space.3',
  'space.4',
  'border-width.default',
  'radius.lg',
  'font.body-md',
  'color.bg.surface',
  'color.border.subtle',
  'color.fg.default',
] as const satisfies readonly TokenName[];

const root = document.documentElement;
const reset = document.createElement('style');
// The kit's reset, and the catalog's list classes (motion.css) in a short form, so an entering row keeps its class.
reset.textContent =
  '*, ::before, ::after { box-sizing: border-box; }' +
  ' @keyframes list-test { from { opacity: 0; } } .ave-motion-list-enter { animation: list-test 5s; }';

beforeEach(() => {
  for (const name of used) root.style.setProperty(tokens[name].cssVar, tokens[name].css);
  document.head.append(reset);
});

afterEach(() => {
  for (const name of used) root.style.removeProperty(tokens[name].cssVar);
  reset.remove();
});

async function mount(): Promise<{ fixture: ComponentFixture<ListHost>; element: HTMLElement }> {
  // animate.enter and animate.leave run in tests only when asked.
  TestBed.configureTestingModule({ animationsEnabled: true });
  const fixture = TestBed.createComponent(ListHost);
  const element = fixture.nativeElement as HTMLElement;
  element.style.display = 'block';
  element.style.inlineSize = '480px';
  document.body.append(element);
  fixture.detectChanges();
  await fixture.whenStable();
  return { fixture, element };
}

function box(element: Element | null | undefined): DOMRect {
  if (element === null || element === undefined) throw new Error('No element');
  return element.getBoundingClientRect();
}

describe('AveList', () => {
  it('is a named list of items, read through the harness', async () => {
    const { fixture, element } = await mount();
    const list = await TestbedHarnessEnvironment.loader(fixture).getHarness(
      AveListHarness.with({ label: 'Файлы договора' }),
    );
    expect(await list.getItems()).toEqual(['Договор поставки.pdf', 'Спецификация.xlsx']);
    const host = element.querySelector('ave-list');
    expect(host?.getAttribute('role')).toBe('list');
    expect(host?.querySelector('ave-list-item')?.getAttribute('role')).toBe('listitem');
    element.remove();
  });

  it('draws its rows between lines, 12px and 16px of padding, the start 12px before the content', async () => {
    const { element } = await mount();
    const [first, second] = element.querySelectorAll('ave-list:first-of-type ave-list-item');
    expect(getComputedStyle(first ?? element).borderTopWidth).toBe('0px');
    expect(getComputedStyle(second ?? element).borderTopWidth).toBe('1px');
    const row = first?.querySelector('.row');
    expect(getComputedStyle(row ?? element).paddingTop).toBe('12px');
    expect(getComputedStyle(row ?? element).paddingLeft).toBe('16px');
    expect(box(first?.querySelector('.content')).left - box(first?.querySelector('[aveListStart]')).right).toBe(12);
    expect(box(first?.querySelector('[aveListEnd]')).left - box(first?.querySelector('.content')).right).toBe(16);
    expect(getComputedStyle(element.querySelector('ave-list') ?? element).borderTopLeftRadius).toBe('12px');
    // An item without a start or an end gives them no room.
    const plain = element.querySelector('.plain ave-list-item');
    expect(box(plain?.querySelector('.content')).left - box(plain).left).toBe(16);
    // A list without rows draws nothing.
    expect(box(element.querySelector('.empty')).height).toBe(0);
    element.remove();
  });

  it('keeps its first rows still and lets later rows enter, the ones that came together in turn', async () => {
    const { fixture, element } = await mount();
    for (const item of element.querySelectorAll('ave-list:first-of-type ave-list-item')) {
      expect(item.classList.contains('ave-motion-list-enter')).toBe(false);
    }
    fixture.componentInstance.files.update((files) => [...files, 'Акт.pdf', 'Счёт.pdf', 'Письмо.pdf']);
    fixture.detectChanges();
    await fixture.whenStable();
    const items = [...element.querySelectorAll<HTMLElement>('ave-list:first-of-type ave-list-item')].slice(2);
    expect(items.map((item) => item.classList.contains('ave-motion-list-enter'))).toEqual([true, true, true]);
    expect(items.map((item) => item.style.getPropertyValue('--ave-motion-order'))).toEqual(['0', '1', '2']);
    // An item of no list enters as it is.
    expect(element.querySelector<HTMLElement>('.alone')?.style.getPropertyValue('--ave-motion-order')).toBe('0');
    element.remove();
  });

  it('counts the stagger from the first again for rows that come later, up to the fifth', async () => {
    const { fixture, element } = await mount();
    fixture.componentInstance.files.update((files) => [...files, 'a', 'b', 'c', 'd', 'e', 'f']);
    fixture.detectChanges();
    const orders = () =>
      [...element.querySelectorAll<HTMLElement>('ave-list:first-of-type ave-list-item')].map((item) =>
        item.style.getPropertyValue('--ave-motion-order'),
      );
    expect(orders().slice(2)).toEqual(['0', '1', '2', '3', '4', '4']);
    await new Promise((resolve) => {
      setTimeout(resolve);
    });
    fixture.componentInstance.files.update((files) => [...files, 'g']);
    fixture.detectChanges();
    expect(orders().at(-1)).toBe('0');
    element.remove();
  });

  it('lets a row that goes play its exit, then removes it', async () => {
    const { fixture, element } = await mount();
    const leaving = element.querySelector('ave-list-item');
    fixture.componentInstance.files.set(['Спецификация.xlsx']);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(leaving?.classList.contains('ave-motion-list-exit')).toBe(true);
    for (const frame of [1, 2, 3]) {
      await new Promise((resolve) => {
        requestAnimationFrame(() => {
          resolve(frame);
        });
      });
    }
    expect(leaving?.isConnected).toBe(false);
    const list = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveListHarness);
    expect(await list.getItems()).toEqual(['Спецификация.xlsx']);
    element.remove();
  });
});
