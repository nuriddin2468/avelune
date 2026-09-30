import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { tokens } from '@avelune/tokens';
import { AveInput } from '@avelune/ui/input';
import {
  AveSearchHeader,
  AveSearchHeaderActions,
  AveSearchHeaderSearch,
  type AveSearchFilters,
} from '@avelune/ui/search-header';
import { AveSearchHeaderHarness } from '@avelune/ui/search-header/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

/** Filters that keep the contract, as FilterPanel does: a column while wide, a drawer while narrow. */
class Filters implements AveSearchFilters {
  readonly id = 'contract-filters';
  readonly shown = signal(false);
  readonly applied = signal(2);
  readonly narrow = signal(false);
  readonly label = signal('Фильтры').asReadonly();
  readonly count = this.applied.asReadonly();
  readonly open = this.shown.asReadonly();
  readonly modal = this.narrow.asReadonly();
  toggle(): void {
    this.shown.update((shown) => !shown);
  }
}

@Component({
  selector: 'ave-search-header-host',
  imports: [AveInput, AveSearchHeader, AveSearchHeaderActions, AveSearchHeaderSearch],
  template: `
    <ave-search-header
      heading="Договоры"
      [summary]="summary()"
      [searchLabel]="label()"
      [filters]="withFilters() ? filters : null"
    >
      <div aveSearchHeaderActions>
        <button type="button" class="action">Выгрузить в Excel</button>
        <a href="/contracts/new" class="action">Новый договор</a>
      </div>
      <input aveInput aveSearchHeaderSearch type="search" aria-label="Поиск договоров" />
    </ave-search-header>
  `,
})
class SearchHeaderHost {
  readonly summary = signal('34 договора');
  readonly label = signal<string | undefined>('Поиск договоров');
  readonly withFilters = signal(true);
  readonly filters = new Filters();
}

const every = Object.values(tokens);
const root = document.documentElement;
const reset = document.createElement('style');
// The kit's layer order and reset (ADR 0030): without styles.css, layers would stack in the order they first appear.
reset.textContent =
  '@layer reset, tokens, base, components, patterns, utilities, app; @layer reset { *, ::before, ::after { box-sizing: border-box; } p { margin: 0; } }';

beforeEach(() => {
  for (const token of every) root.style.setProperty(token.cssVar, token.css);
  document.head.append(reset);
});

afterEach(() => {
  for (const token of every) root.style.removeProperty(token.cssVar);
  reset.remove();
});

function mount(width: number): { fixture: ComponentFixture<SearchHeaderHost>; element: HTMLElement } {
  const fixture = TestBed.createComponent(SearchHeaderHost);
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

describe('AveSearchHeader', () => {
  it('puts the heading, its count and the actions on the first row, the search and the filters under them', async () => {
    const { fixture, element } = mount(960);
    const header = await TestbedHarnessEnvironment.loader(fixture).getHarness(
      AveSearchHeaderHarness.with({ heading: 'Договоры' }),
    );
    expect(await header.getSummary()).toBe('34 договора');
    expect(await header.getSearchLabel()).toBe('Поиск договоров');
    expect(await header.getActions()).toEqual(['Выгрузить в Excel', 'Новый договор']);

    const heading = element.querySelector('h1');
    const summary = element.querySelector('.summary');
    expect(getComputedStyle(heading ?? element).fontSize).toBe(`${String(tokens['font.heading-xl'].value.fontSize)}px`);
    expect(summary?.getAttribute('role')).toBe('status');
    expect(box(summary).left - box(heading).right).toBe(12);
    const [, primary] = element.querySelectorAll('.action');
    expect(box(primary).right).toBe(box(element).right);
    const input = element.querySelector('input');
    const button = element.querySelector('search > button');
    expect(box(input).top - box(element.querySelector('.head')).bottom).toBe(16);
    expect(box(input).left).toBe(box(element).left);
    expect(box(button).left - box(input).right).toBe(8);
    expect(box(button).right).toBe(box(element).right);
    expect(box(button).height).toBe(box(input).height);
    element.remove();
  });

  it('shows and hides a column of filters as a disclosure, and opens a drawer of them as a dialog', async () => {
    const { fixture, element } = mount(960);
    const header = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveSearchHeaderHarness);
    const { filters } = fixture.componentInstance;
    expect(await header.getFiltersButtonText()).toBe('Фильтры 2');
    expect(await header.isFiltersExpanded()).toBe(false);
    const button = element.querySelector('search > button');
    expect(button?.getAttribute('aria-controls')).toBe('contract-filters');
    expect(button?.hasAttribute('aria-haspopup')).toBe(false);
    await header.toggleFilters();
    expect(filters.open()).toBe(true);
    expect(await header.isFiltersExpanded()).toBe(true);

    filters.narrow.set(true);
    filters.applied.set(0);
    expect(await header.isFiltersExpanded()).toBeNull();
    expect(button?.getAttribute('aria-haspopup')).toBe('dialog');
    expect(button?.hasAttribute('aria-controls')).toBe(false);
    expect(await header.getFiltersButtonText()).toBe('Фильтры');
    element.remove();
  });

  it('wraps the actions under the heading on a narrow page, and fills the row with the search without filters', async () => {
    const { fixture, element } = mount(320);
    const header = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveSearchHeaderHarness);
    const heading = element.querySelector('h1');
    const [first] = element.querySelectorAll('.action');
    expect(box(first).top).toBeGreaterThan(box(heading).bottom);
    expect(box(first).left).toBe(box(element).left);
    expect(element.scrollWidth).toBe(element.clientWidth);

    fixture.componentInstance.withFilters.set(false);
    fixture.componentInstance.label.set(undefined);
    fixture.componentInstance.summary.set('');
    expect(await header.hasFiltersButton()).toBe(false);
    expect(await header.getSearchLabel()).toBeNull();
    expect(await header.getSummary()).toBe('');
    expect(box(element.querySelector('input')).right).toBe(box(element).right);
    await expect(header.toggleFilters()).rejects.toThrow('The search header has no filters.');
    element.remove();
  });
});
