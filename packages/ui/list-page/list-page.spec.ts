import { Component, LOCALE_ID, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { tokens } from '@avelune/tokens';
import {
  AveAppliedFilters,
  AveFilterPanel,
  AveFilterPanelContent,
  type AveAppliedFilter,
} from '@avelune/ui/filter-panel';
import { AveInput } from '@avelune/ui/input';
import { AveListPage, AveListPageNotice } from '@avelune/ui/list-page';
import { AveListPageHarness } from '@avelune/ui/list-page/testing';
import { AveSearchHeader, AveSearchHeaderSearch } from '@avelune/ui/search-header';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

@Component({
  selector: 'ave-list-page-host',
  imports: [
    AveAppliedFilters,
    AveFilterPanel,
    AveFilterPanelContent,
    AveInput,
    AveListPage,
    AveListPageNotice,
    AveSearchHeader,
    AveSearchHeaderSearch,
  ],
  template: `
    <ave-list-page>
      <ave-search-header heading="Договоры" summary="34 договора" [filters]="filters">
        <input aveInput aveSearchHeaderSearch type="search" aria-label="Поиск договоров" />
      </ave-search-header>
      @if (notice()) {
        <p aveListPageNotice class="notice">Есть истёкшие договоры.</p>
      }
      <ave-applied-filters [filters]="applied()" />
      <ave-filter-panel #filters [count]="applied().length" [(open)]="open">
        <ng-template aveFilterPanelContent><p>Статус</p></ng-template>
      </ave-filter-panel>
      <ul class="rows">
        <li>ДК-2025/114 Поставка офисной мебели</li>
      </ul>
    </ave-list-page>
  `,
})
class ListPageHost {
  readonly applied = signal<readonly AveAppliedFilter[]>([{ key: 'signed', label: 'Статус: Подписан' }]);
  readonly open = signal(false);
  readonly notice = signal(true);
}

@Component({
  selector: 'ave-list-page-plain-host',
  imports: [AveListPage],
  template: `
    <ave-list-page>
      <h1>Контрагенты</h1>
      <p class="rows">Список контрагентов.</p>
    </ave-list-page>
  `,
})
class PlainListPageHost {}

const every = Object.values(tokens);
const root = document.documentElement;
const reset = document.createElement('style');
// The kit's layer order and reset (ADR 0030): without styles.css, layers would stack in the order they first appear.
reset.textContent =
  '@layer reset, tokens, base, components, patterns, utilities, app; @layer reset { *, ::before, ::after { box-sizing: border-box; } p, h1, h2, ul { margin: 0; } }';

beforeEach(() => {
  for (const token of every) root.style.setProperty(token.cssVar, token.css);
  document.head.append(reset);
});

afterEach(() => {
  for (const token of every) root.style.removeProperty(token.cssVar);
  reset.remove();
});

function mount<T>(type: new () => T, width: number): { fixture: ComponentFixture<T>; element: HTMLElement } {
  TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: 'ru' }] });
  const fixture = TestBed.createComponent(type);
  const element = fixture.nativeElement as HTMLElement;
  element.style.display = 'block';
  element.style.inlineSize = `${String(width)}px`;
  document.body.prepend(element);
  fixture.detectChanges();
  return { fixture, element };
}

function box(element: Element | null | undefined): DOMRect {
  if (element === null || element === undefined) throw new Error('No element');
  return element.getBoundingClientRect();
}

describe('AveListPage', () => {
  it('stacks the header, the notices and the list 24px apart, the applied filters 16px over the list', async () => {
    const { fixture, element } = mount(ListPageHost, 1200);
    const page = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveListPageHarness);
    expect(await (await page.getSearchHeader()).getHeading()).toBe('Договоры');
    expect(await page.getNotices()).toEqual(['Есть истёкшие договоры.']);
    expect(await (await page.getAppliedFilters())?.getFilters()).toEqual(['Статус: Подписан']);
    expect(await page.getListText()).toBe('ДК-2025/114 Поставка офисной мебели');

    const header = element.querySelector('ave-search-header');
    const notice = element.querySelector('.notice');
    const applied = element.querySelector('ave-applied-filters');
    const rows = element.querySelector('.rows');
    expect(box(notice).top - box(header).bottom).toBe(24);
    expect(box(applied).top - box(notice).bottom).toBe(24);
    expect(box(rows).top - box(applied).bottom).toBe(16);
    expect(box(rows).width).toBe(1200);
    expect(getComputedStyle(element.querySelector('ave-list-page') ?? element).containerType).toBe('inline-size');

    fixture.componentInstance.notice.set(false);
    fixture.componentInstance.applied.set([]);
    fixture.detectChanges();
    expect(box(rows).top - box(header).bottom).toBe(24);
    element.remove();
  });

  it('gives the filters’ column its room at the list’s start while it is open, and none while it is closed', async () => {
    const { fixture, element } = mount(ListPageHost, 1200);
    const page = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveListPageHarness);
    const panel = await page.getFilterPanel();
    await vi.waitFor(async () => {
      expect(await panel?.isModal()).toBe(false);
    });
    expect(await page.isFiltersColumnShown()).toBe(false);
    await (await page.getSearchHeader()).toggleFilters();
    expect(await page.isFiltersColumnShown()).toBe(true);
    const column = element.querySelector('ave-filter-panel section');
    const rows = element.querySelector('.rows');
    expect(box(column).left).toBe(box(element).left);
    expect(box(rows).left - box(column).right).toBe(24);
    expect(box(rows).right).toBe(box(element).right);
    expect(box(rows).top).toBe(box(column).top);
    element.remove();
  });

  it('leaves the list its width while the filters open in a drawer on a narrow page', async () => {
    const { fixture, element } = mount(ListPageHost, 600);
    const page = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveListPageHarness);
    const panel = await page.getFilterPanel();
    expect(await panel?.isModal()).toBe(true);
    fixture.componentInstance.open.set(true);
    expect(await panel?.isOpen()).toBe(true);
    expect(await page.isFiltersColumnShown()).toBe(false);
    expect(box(element.querySelector('.rows')).width).toBe(600);
    fixture.componentInstance.open.set(false);
    await vi.waitFor(async () => {
      expect(await panel?.isOpen()).toBe(false);
    });
    element.remove();
  });

  it('holds a list without filters', async () => {
    const { fixture, element } = mount(PlainListPageHost, 600);
    const page = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveListPageHarness);
    expect(await page.getFilterPanel()).toBeNull();
    expect(await page.getAppliedFilters()).toBeNull();
    expect(await page.isFiltersColumnShown()).toBe(false);
    expect(await page.getNotices()).toEqual([]);
    expect(await page.getListText()).toContain('Список контрагентов.');
    element.remove();
  });
});
