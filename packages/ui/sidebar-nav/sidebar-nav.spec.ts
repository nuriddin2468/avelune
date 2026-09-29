import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { Location } from '@angular/common';
import { provideLocationMocks } from '@angular/common/testing';
import { Router, provideRouter } from '@angular/router';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { lucideBookOpen, lucideFileText, lucideHouse, lucideSettings } from '@avelune/icons/lucide';
import { tokens, type TokenName } from '@avelune/tokens';
import { provideAveIcons } from '@avelune/ui/icon';
import { AveSidebarNav, type AveSidebarEntry } from '@avelune/ui/sidebar-nav';
import { AveSidebarNavHarness } from '@avelune/ui/sidebar-nav/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

@Component({ selector: 'ave-sidebar-nav-page', template: '' })
class Page {}

const pages: readonly AveSidebarEntry[] = [
  { label: 'Главная', link: '/', icon: 'house', exact: true },
  { label: 'Договоры', link: ['/contracts'], icon: 'file-text' },
  {
    label: 'Справочники',
    icon: 'book-open',
    items: [
      { label: 'Контрагенты', link: '/directories/counterparties' },
      { label: 'Подразделения', link: '/directories/departments' },
    ],
  },
  {
    heading: 'Администрирование',
    items: [
      { label: 'Настройки', link: '/settings', icon: 'settings' },
      { label: 'Журналы', items: [{ label: 'Журнал входов', link: '/logs/sign-ins' }] },
    ],
  },
];

@Component({
  selector: 'ave-sidebar-nav-host',
  imports: [AveSidebarNav],
  providers: [provideAveIcons([lucideBookOpen, lucideFileText, lucideHouse, lucideSettings])],
  template: `<div class="frame"><ave-sidebar-nav label="Разделы" [items]="items()" /></div>`,
})
class NavHost {
  readonly items = signal(pages);
}

const used = [
  'space.1',
  'space.2',
  'space.4',
  'radius.md',
  'radius.full',
  'border-width.selected',
  'control.height.md',
  'control.padding-inline.sm',
  'size.icon.sm',
  'font.body-md',
  'font.label-sm',
  'color.fg.default',
  'color.fg.muted',
  'color.bg.hover',
  'color.bg.active',
  'color.accent.bg',
  'easing.standard',
] as const satisfies readonly TokenName[];

const root = document.documentElement;
const reset = document.createElement('style');
// The kit's reset (ADR 0030); a sidebar's column.
reset.textContent = '*, ::before, ::after { box-sizing: border-box; } .frame { inline-size: 256px; }';

beforeEach(() => {
  for (const name of used) root.style.setProperty(tokens[name].cssVar, tokens[name].css);
  root.style.setProperty('--ave-font-body-md-line-height', '20px');
  root.style.setProperty('--ave-duration-instant', '0ms');
  document.head.append(reset);
  TestBed.configureTestingModule({
    providers: [provideRouter([{ path: '**', component: Page }]), provideLocationMocks()],
  });
});

afterEach(() => {
  for (const name of used) root.style.removeProperty(tokens[name].cssVar);
  root.style.removeProperty('--ave-font-body-md-line-height');
  root.style.removeProperty('--ave-duration-instant');
  reset.remove();
});

async function mount(url = '/'): Promise<{
  fixture: ComponentFixture<NavHost>;
  element: HTMLElement;
  nav: AveSidebarNavHarness;
}> {
  await TestBed.inject(Router).navigateByUrl(url);
  const fixture = TestBed.createComponent(NavHost);
  const element = fixture.nativeElement as HTMLElement;
  document.body.prepend(element);
  fixture.detectChanges();
  await fixture.whenStable();
  const nav = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveSidebarNavHarness);
  return { fixture, element, nav };
}

function link(element: HTMLElement, name: string): HTMLAnchorElement {
  const found = [...element.querySelectorAll('a')].find((anchor) => anchor.textContent.trim() === name);
  if (found === undefined) throw new Error(`No link ${name}`);
  return found;
}

describe('AveSidebarNav', () => {
  it('is a named landmark of lists of links, with groups and a headed section', async () => {
    const { element, nav } = await mount();
    expect(await nav.getLabel()).toBe('Разделы');
    expect(await nav.getLinks()).toEqual(['Главная', 'Договоры', 'Настройки']);
    expect(await nav.getGroups()).toEqual(['Справочники', 'Журналы']);
    expect(link(element, 'Договоры').getAttribute('href')).toBe('/contracts');
    // The section's heading names its list.
    const heading = [...element.querySelectorAll('.heading')].find((one) => one.textContent === 'Администрирование');
    expect(heading?.nextElementSibling?.getAttribute('aria-labelledby')).toBe(heading?.id);
    // A group's button controls its list, hidden while it is closed.
    const group = element.querySelector('button');
    const list = document.getElementById(group?.getAttribute('aria-controls') ?? '');
    expect(group?.getAttribute('aria-expanded')).toBe('false');
    expect(list?.hidden).toBe(true);
    expect(link(element, 'Главная').querySelector('ave-icon')?.getAttribute('data-icon')).toBe('house');
    expect(group?.querySelector('.chevron')?.getAttribute('data-icon')).toBe('chevron-right');
    element.remove();
  });

  it('marks the current page, and the pages above it, from the router', async () => {
    const { fixture, element, nav } = await mount('/');
    expect(await nav.getCurrent()).toBe('Главная');
    await TestBed.inject(Router).navigateByUrl('/contracts?page=2');
    fixture.detectChanges();
    expect(await nav.getCurrent()).toBe('Договоры');
    await TestBed.inject(Router).navigateByUrl('/contracts/114');
    fixture.detectChanges();
    // The register is above the contract's page; the home page, exact, is not.
    expect(await nav.getCurrent()).toBeNull();
    expect(await nav.getAbove()).toEqual(['Договоры']);
    expect(link(element, 'Главная').hasAttribute('aria-current')).toBe(false);
    element.remove();
  });

  it('opens a group when navigation reaches one of its pages, and keeps what the person chose', async () => {
    const { fixture, element, nav } = await mount('/directories/departments');
    expect(await nav.isGroupOpen('Справочники')).toBe(true);
    expect(await nav.getCurrent()).toBe('Подразделения');
    expect(element.querySelector('button .chevron')?.getAttribute('data-icon')).toBe('chevron-down');
    // Closed by the person, the group that holds the current page is current to eyes and to screen readers.
    await nav.toggleGroup('Справочники');
    expect(await nav.isGroupOpen('Справочники')).toBe(false);
    expect(element.querySelector('button')?.getAttribute('aria-current')).toBe('true');
    // New items (a count, the person's rights) leave the closed group closed.
    fixture.componentInstance.items.set([...pages]);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(await nav.isGroupOpen('Справочники')).toBe(false);
    await nav.toggleGroup('Журналы');
    expect(await nav.getLinks()).toEqual(['Главная', 'Договоры', 'Настройки', 'Журнал входов']);
    await nav.follow('Журнал входов');
    await fixture.whenStable();
    fixture.detectChanges();
    expect(TestBed.inject(Location).path()).toBe('/logs/sign-ins');
    expect(await nav.isGroupOpen('Справочники')).toBe(false);
    expect(await nav.isGroupOpen('Журналы')).toBe(true);
    await expect(nav.follow('Отчёты')).rejects.toThrow('no link matches Отчёты');
    await expect(nav.toggleGroup('Отчёты')).rejects.toThrow('no group matches Отчёты');
    element.remove();
  });

  it('draws rows of the control height, the current one on the pressed fill with an accent bar', async () => {
    const { element } = await mount('/settings');
    const current = link(element, 'Настройки');
    const other = link(element, 'Договоры');
    expect(current.getBoundingClientRect().height).toBe(36);
    expect(getComputedStyle(current).backgroundColor).not.toBe(getComputedStyle(other).backgroundColor);
    const bar = getComputedStyle(current, '::before');
    expect(bar.width).toBe('2px');
    expect(bar.height).toBe('20px');
    expect(getComputedStyle(other, '::before').content).toBe('none');
    // 4px between rows; the icon 8px before the words.
    const home = link(element, 'Главная').getBoundingClientRect();
    expect(other.getBoundingClientRect().top - home.bottom).toBe(4);
    const icon = other.querySelector('ave-icon')?.getBoundingClientRect();
    const words = other.querySelector('.label')?.getBoundingClientRect();
    expect((words?.left ?? 0) - (icon?.right ?? 0)).toBe(8);
    element.remove();
  });

  it('wraps a long name and indents a group’s pages to its words', async () => {
    const { fixture, element } = await mount('/directories/counterparties');
    fixture.componentInstance.items.set([
      { label: 'Oʻzbekiston Respublikasi Vazirlar Mahkamasining qarorlari', link: '/decrees', icon: 'file-text' },
      ...pages,
    ]);
    fixture.detectChanges();
    const long = link(element, 'Oʻzbekiston Respublikasi Vazirlar Mahkamasining qarorlari');
    expect(long.getBoundingClientRect().height).toBeGreaterThan(36);
    expect(long.scrollWidth).toBe(long.clientWidth);
    const group = element.querySelector('button .label')?.getBoundingClientRect();
    const page = link(element, 'Контрагенты').querySelector('.label')?.getBoundingClientRect();
    expect(page?.left).toBe(group?.left);
    element.remove();
  });

  it('finds a navigation by its name', async () => {
    const { fixture, element } = await mount();
    const loader = TestbedHarnessEnvironment.loader(fixture);
    expect(await loader.getAllHarnesses(AveSidebarNavHarness.with({ label: 'Разделы' }))).toHaveLength(1);
    expect(await loader.getAllHarnesses(AveSidebarNavHarness.with({ label: /^Отчёты/ }))).toHaveLength(0);
    element.remove();
  });
});
