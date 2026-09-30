import { Component, LOCALE_ID, PLATFORM_ID, signal, type Provider } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { tokens } from '@avelune/tokens';
import { AveCheckbox, AveChoice } from '@avelune/ui/checkbox';
import {
  AveAppliedFilters,
  AveFilterPanel,
  AveFilterPanelContent,
  type AveAppliedFilter,
} from '@avelune/ui/filter-panel';
import { AveAppliedFiltersHarness, AveFilterPanelHarness } from '@avelune/ui/filter-panel/testing';
import { AveDrawerHarness } from '@avelune/ui/dialog/testing';
import { AveChoiceGroup } from '@avelune/ui/form-field';
import { AveInput } from '@avelune/ui/input';
import { AveSearchHeader, AveSearchHeaderSearch } from '@avelune/ui/search-header';
import { AveSearchHeaderHarness } from '@avelune/ui/search-header/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

@Component({
  selector: 'ave-filter-panel-host',
  imports: [
    AveAppliedFilters,
    AveCheckbox,
    AveChoice,
    AveChoiceGroup,
    AveFilterPanel,
    AveFilterPanelContent,
    AveInput,
    AveSearchHeader,
    AveSearchHeaderSearch,
  ],
  template: `
    <ave-search-header heading="Договоры" [filters]="panel">
      <input aveInput aveSearchHeaderSearch type="search" aria-label="Поиск договоров" />
    </ave-search-header>
    <ave-applied-filters [filters]="applied()" (remove)="removed.set($event)" (clear)="cleared.set(cleared() + 1)" />
    <div class="layout">
      <ave-filter-panel #panel [count]="applied().length" [(open)]="open" (clear)="cleared.set(cleared() + 1)">
        <ng-template aveFilterPanelContent>
          <fieldset aveChoiceGroup legend="Статус">
            <label aveChoice><input type="checkbox" aveCheckbox checked /> Подписан</label>
            <label aveChoice><input type="checkbox" aveCheckbox checked /> На согласовании</label>
          </fieldset>
        </ng-template>
      </ave-filter-panel>
    </div>
  `,
})
class FilterPanelHost {
  readonly applied = signal<readonly AveAppliedFilter[]>([
    { key: 'signed', label: 'Статус: Подписан' },
    { key: 'approval', label: 'Статус: На согласовании' },
  ]);
  readonly open = signal(false);
  readonly removed = signal<string | null>(null);
  readonly cleared = signal(0);
}

const every = Object.values(tokens);
const root = document.documentElement;
const reset = document.createElement('style');
// The kit's layer order and reset (ADR 0030): without styles.css, layers would stack in the order they first appear.
reset.textContent =
  '@layer reset, tokens, base, components, patterns, utilities, app; @layer reset { *, ::before, ::after { box-sizing: border-box; } p, h1, h2, fieldset { margin: 0; } }';

beforeEach(() => {
  for (const token of every) root.style.setProperty(token.cssVar, token.css);
  document.head.append(reset);
});

afterEach(() => {
  for (const token of every) root.style.removeProperty(token.cssVar);
  reset.remove();
});

function mount(
  width: number,
  providers: Provider[] = [],
  open = false,
): { fixture: ComponentFixture<FilterPanelHost>; element: HTMLElement; layout: HTMLElement } {
  TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: 'ru' }, ...providers] });
  const fixture = TestBed.createComponent(FilterPanelHost);
  fixture.componentInstance.open.set(open);
  const element = fixture.nativeElement as HTMLElement;
  element.style.display = 'grid';
  element.style.inlineSize = `${String(width)}px`;
  document.body.prepend(element);
  fixture.detectChanges();
  const layout = element.querySelector<HTMLElement>('.layout');
  if (layout === null) throw new Error('No layout');
  return { fixture, element, layout };
}

async function harnesses(fixture: ComponentFixture<FilterPanelHost>) {
  const loader = TestbedHarnessEnvironment.loader(fixture);
  return {
    panel: await loader.getHarness(AveFilterPanelHarness.with({ label: 'Фильтры' })),
    header: await loader.getHarness(AveSearchHeaderHarness),
    applied: await loader.getHarness(AveAppliedFiltersHarness),
  };
}

describe('AveFilterPanel', () => {
  it('is a column from container.lg, hidden until the search header’s button shows it', async () => {
    const { fixture, element } = mount(1000);
    const { panel, header } = await harnesses(fixture);
    await vi.waitFor(async () => {
      expect(await panel.isModal()).toBe(false);
    });
    const host = element.querySelector('ave-filter-panel');
    const column = element.querySelector('section');
    expect(await panel.isOpen()).toBe(false);
    expect(getComputedStyle(host ?? element).display).toBe('none');
    expect(column?.id).toBe(element.querySelector('search > button')?.getAttribute('aria-controls'));
    expect(await header.isFiltersExpanded()).toBe(false);
    expect(await header.getFiltersButtonText()).toBe('Фильтры 2');

    await header.toggleFilters();
    expect(await panel.isOpen()).toBe(true);
    expect(fixture.componentInstance.open()).toBe(true);
    expect(await header.isFiltersExpanded()).toBe(true);
    expect(await panel.getLabel()).toBe('Фильтры');
    expect(await panel.getFieldsText()).toMatch(/^Статус .*Подписан На согласовании$/);
    expect(column?.getAttribute('aria-labelledby')).toBe(column?.querySelector('h2')?.id);
    const style = getComputedStyle(column ?? element);
    expect(column?.getBoundingClientRect().width).toBe(256);
    expect(style.borderTopLeftRadius).toBe(tokens['radius.lg'].css);
    expect(Number.parseFloat(style.paddingTop) + Number.parseFloat(style.borderTopWidth)).toBe(16);

    expect(await panel.canClear()).toBe(true);
    await panel.clear();
    expect(fixture.componentInstance.cleared()).toBe(1);
    fixture.componentInstance.applied.set([]);
    expect(await panel.canClear()).toBe(false);
    await expect(panel.clear()).rejects.toThrow('No filter is applied.');
    await expect(panel.showResults()).rejects.toThrow('The filters are not in a drawer.');
    element.remove();
  });

  it('opens in a drawer from the start below container.lg, which "Показать результаты" closes', async () => {
    const { fixture, element } = mount(600);
    const { panel, header } = await harnesses(fixture);
    expect(await panel.isModal()).toBe(true);
    expect(await header.isFiltersExpanded()).toBeNull();
    expect(element.querySelector('search > button')?.getAttribute('aria-haspopup')).toBe('dialog');
    expect(getComputedStyle(element.querySelector('ave-filter-panel') ?? element).display).toBe('contents');

    await header.toggleFilters();
    expect(await panel.isOpen()).toBe(true);
    expect(await panel.getLabel()).toBe('Фильтры');
    expect(await panel.getFieldsText()).toMatch(/^Статус .*Подписан На согласовании$/);
    expect(element.querySelector('dialog')?.getAttribute('data-side')).toBe('start');
    await panel.clear();
    expect(fixture.componentInstance.cleared()).toBe(1);
    const drawer = await TestbedHarnessEnvironment.documentRootLoader(fixture).getHarness(AveDrawerHarness);
    await drawer.close();
    expect(fixture.componentInstance.open()).toBe(false);
    await header.toggleFilters();
    expect(await panel.isOpen()).toBe(true);
    await panel.showResults();
    expect(fixture.componentInstance.open()).toBe(false);
    await vi.waitFor(async () => {
      expect(await panel.isOpen()).toBe(false);
    });
    expect(await panel.getFieldsText()).toBe('');
    element.remove();
  });

  it('follows its container across container.lg', async () => {
    const { fixture, element, layout } = mount(1000);
    const { panel } = await harnesses(fixture);
    await vi.waitFor(async () => {
      expect(await panel.isModal()).toBe(false);
    });
    layout.style.inlineSize = '700px';
    await vi.waitFor(async () => {
      expect(await panel.isModal()).toBe(true);
    });
    element.remove();
  });

  it('opens in its form from the first frame it draws, and is a drawer where it cannot read the width', async () => {
    const { fixture, element } = mount(1000, [], true);
    const { panel } = await harnesses(fixture);
    expect(await panel.isModal()).toBe(false);
    expect(await panel.isOpen()).toBe(true);
    expect(element.querySelector('dialog')).toBeNull();
    element.remove();
    TestBed.resetTestingModule();

    root.style.removeProperty(tokens['container.lg'].cssVar);
    const unread = mount(1000);
    expect(await (await harnesses(unread.fixture)).panel.isModal()).toBe(true);
    unread.element.remove();
  });

  it('draws nothing and measures nothing on the server', () => {
    const observe = vi.spyOn(ResizeObserver.prototype, 'observe');
    const { element } = mount(1000, [{ provide: PLATFORM_ID, useValue: 'server' }]);
    expect(observe).not.toHaveBeenCalled();
    expect(element.querySelector('ave-filter-panel section, ave-filter-panel dialog')).toBeNull();
    element.remove();
  });
});

describe('AveAppliedFilters', () => {
  it('shows each applied filter as a tag that takes it away, then a button that clears them all', async () => {
    const { fixture, element } = mount(1000);
    const { applied } = await harnesses(fixture);
    expect(await applied.getLabel()).toBe('Применённые фильтры');
    expect(await applied.getFilters()).toEqual(['Статус: Подписан', 'Статус: На согласовании']);
    await applied.remove('Статус: На согласовании');
    expect(fixture.componentInstance.removed()).toBe('approval');
    await applied.remove(/Подписан/);
    expect(fixture.componentInstance.removed()).toBe('signed');
    await expect(applied.remove('Статус: Истёк')).rejects.toThrow('No applied filter "Статус: Истёк".');
    await applied.clear();
    expect(fixture.componentInstance.cleared()).toBe(1);

    const [first, second] = element.querySelectorAll('ave-applied-filters li');
    expect((second?.getBoundingClientRect().left ?? 0) - (first?.getBoundingClientRect().right ?? 0)).toBe(8);
    fixture.componentInstance.applied.set([]);
    expect(await applied.getLabel()).toBeNull();
    expect(await applied.getFilters()).toEqual([]);
    expect(getComputedStyle(element.querySelector('ave-applied-filters') ?? element).display).toBe('none');
    await expect(applied.clear()).rejects.toThrow('No filter is applied.');
    element.remove();
  });
});
