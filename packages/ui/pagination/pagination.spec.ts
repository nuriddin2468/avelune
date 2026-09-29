import { Component, LOCALE_ID, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { tokens, type TokenName } from '@avelune/tokens';
import { AvePagination } from '@avelune/ui/pagination';
import { AvePaginationHarness } from '@avelune/ui/pagination/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';

@Component({
  selector: 'ave-pagination-host',
  imports: [AvePagination],
  template: `
    <div class="frame">
      <ave-pagination [total]="total()" [pageSize]="size()" [(page)]="page" />
    </div>
  `,
})
class PaginationHost {
  readonly total = signal(134);
  readonly size = signal(10);
  readonly page = signal(1);
}

const used = [
  'space.1',
  'space.2',
  'space.4',
  'radius.md',
  'control.height.md',
  'control.padding-inline.md',
  'size.icon.sm',
  'font.body-md',
  'font.label-md',
  'color.fg.default',
  'color.fg.muted',
  'color.fg.on-accent',
  'color.accent.bg',
  'color.bg.hover',
  'easing.standard',
] as const satisfies readonly TokenName[];

const root = document.documentElement;
const reset = document.createElement('style');
// The kit's reset (ADR 0030); a list's width.
reset.textContent = '*, ::before, ::after { box-sizing: border-box; } .frame { inline-size: 800px; }';

beforeEach(() => {
  for (const name of used) root.style.setProperty(tokens[name].cssVar, tokens[name].css);
  root.style.setProperty('--ave-duration-instant', '0ms');
  root.style.setProperty('--ave-timing-tooltip-delay', '0ms');
  document.head.append(reset);
  TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: 'ru' }] });
});

afterEach(() => {
  for (const name of used) root.style.removeProperty(tokens[name].cssVar);
  root.style.removeProperty('--ave-duration-instant');
  root.style.removeProperty('--ave-timing-tooltip-delay');
  reset.remove();
});

async function mount(): Promise<{
  fixture: ComponentFixture<PaginationHost>;
  element: HTMLElement;
  pagination: AvePaginationHarness;
}> {
  const fixture = TestBed.createComponent(PaginationHost);
  const element = fixture.nativeElement as HTMLElement;
  document.body.prepend(element);
  fixture.detectChanges();
  await fixture.whenStable();
  const pagination = await TestbedHarnessEnvironment.loader(fixture).getHarness(AvePaginationHarness);
  return { fixture, element, pagination };
}

function button(element: HTMLElement, name: string): HTMLButtonElement {
  const found = [...element.querySelectorAll('button')].find(
    (one) => (one.getAttribute('aria-label') ?? one.textContent.trim()) === name,
  );
  if (found === undefined) throw new Error(`No button ${name}`);
  return found;
}

describe('AvePagination', () => {
  it('is a named landmark with the range, the arrows and the pages in seven places', async () => {
    const { element, pagination } = await mount();
    expect(element.querySelector('nav')?.getAttribute('aria-label')).toBe('Страницы');
    expect(await pagination.getRange()).toBe('1–10 из 134');
    expect(element.querySelector('.range')?.getAttribute('role')).toBe('status');
    expect(await pagination.getPages()).toEqual(['1', '2', '3', '4', '5', '…', '14']);
    expect(await pagination.getCurrentPage()).toBe(1);
    const current = button(element, 'Страница 1');
    expect(current.getAttribute('aria-current')).toBe('page');
    expect(button(element, 'Страница 2').hasAttribute('aria-current')).toBe(false);
    // The gap is out of the accessibility tree.
    expect(element.querySelector('li:has(.gap)')?.getAttribute('aria-hidden')).toBe('true');
    expect(await pagination.hasPrevious()).toBe(false);
    expect(await pagination.hasNext()).toBe(true);
    element.remove();
  });

  it('keeps seven places as it pages, the current page and its neighbours between the ends', async () => {
    const { fixture, element, pagination } = await mount();
    await pagination.goToPage(5);
    expect(fixture.componentInstance.page()).toBe(5);
    expect(await pagination.getPages()).toEqual(['1', '…', '4', '5', '6', '…', '14']);
    expect(await pagination.getRange()).toBe('41–50 из 134');
    await pagination.goToPage(14);
    expect(await pagination.getPages()).toEqual(['1', '…', '10', '11', '12', '13', '14']);
    expect(await pagination.getRange()).toBe('131–134 из 134');
    expect(await pagination.hasNext()).toBe(false);
    await pagination.previous();
    expect(await pagination.getCurrentPage()).toBe(13);
    await pagination.next();
    await pagination.next();
    expect(await pagination.getCurrentPage()).toBe(14);
    await expect(pagination.goToPage(7)).rejects.toThrow('page 7 is not shown');
    element.remove();
  });

  it('keeps focus on the page a person pressed, and on an arrow that has no page left', async () => {
    const { fixture, element } = await mount();
    await userEvent.click(button(element, 'Страница 5'));
    await fixture.whenStable();
    expect(document.activeElement?.getAttribute('aria-label')).toBe('Страница 5');
    await userEvent.click(button(element, 'Страница 6'));
    await fixture.whenStable();
    expect(document.activeElement?.getAttribute('aria-current')).toBe('page');
    expect(document.activeElement?.textContent.trim()).toBe('6');
    const next = button(element, 'Следующая страница');
    fixture.componentInstance.page.set(13);
    fixture.detectChanges();
    await userEvent.click(next);
    expect(fixture.componentInstance.page()).toBe(14);
    expect(next).toBe(document.activeElement);
    expect(next.getAttribute('aria-disabled')).toBe('true');
    // A press on the arrow without a page does nothing (a DOM click: Playwright waits for an enabled element).
    next.click();
    expect(fixture.componentInstance.page()).toBe(14);
    element.remove();
  });

  it('shows every page when they fit, keeps the page within them, and draws nothing without items', async () => {
    const { fixture, element, pagination } = await mount();
    fixture.componentInstance.total.set(45);
    fixture.componentInstance.page.set(9);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(await pagination.getPages()).toEqual(['1', '2', '3', '4', '5']);
    expect(fixture.componentInstance.page()).toBe(5);
    fixture.componentInstance.total.set(0);
    fixture.detectChanges();
    expect(await pagination.getRange()).toBeNull();
    expect(await pagination.getCurrentPage()).toBeNull();
    await expect(pagination.next()).rejects.toThrow('nothing is drawn');
    element.remove();
  });

  it('draws square pages of the control height, the current one on the accent fill', async () => {
    const { element } = await mount();
    const current = button(element, 'Страница 1');
    const other = button(element, 'Страница 2');
    expect(current.getBoundingClientRect().height).toBe(36);
    expect(other.getBoundingClientRect().width).toBe(36);
    expect(getComputedStyle(current).backgroundColor).not.toBe(getComputedStyle(other).backgroundColor);
    expect(getComputedStyle(current).color).not.toBe(getComputedStyle(other).color);
    // The arrows are icon buttons of the same height; the pages 4px apart.
    expect(button(element, 'Предыдущая страница').getBoundingClientRect().height).toBe(36);
    expect(other.getBoundingClientRect().left - current.getBoundingClientRect().right).toBe(4);
    element.remove();
  });

  it('gives way to the page of pages in a narrow container', async () => {
    const { fixture, element } = await mount();
    element.querySelector<HTMLElement>('.frame')?.style.setProperty('inline-size', '320px');
    fixture.componentInstance.page.set(3);
    fixture.detectChanges();
    await fixture.whenStable();
    const compact = element.querySelector<HTMLElement>('.compact');
    expect(compact?.textContent.trim()).toBe('Страница 3 из 14');
    expect(getComputedStyle(compact ?? element).display).not.toBe('none');
    expect(getComputedStyle(element.querySelector('.numbers') ?? element).display).toBe('none');
    const nav = element.querySelector('nav');
    expect(nav?.scrollWidth).toBe(nav?.clientWidth);
    element.remove();
  });

  it('finds a pagination by its current page', async () => {
    const { fixture, element } = await mount();
    const loader = TestbedHarnessEnvironment.loader(fixture);
    expect(await loader.getAllHarnesses(AvePaginationHarness.with({ page: 1 }))).toHaveLength(1);
    expect(await loader.getAllHarnesses(AvePaginationHarness.with({ page: 2 }))).toHaveLength(0);
    element.remove();
  });
});
