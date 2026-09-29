import { Component, LOCALE_ID, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { Location } from '@angular/common';
import { provideLocationMocks } from '@angular/common/testing';
import { provideRouter } from '@angular/router';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { tokens, type TokenName } from '@avelune/tokens';
import { AveBreadcrumbs, type AveBreadcrumb } from '@avelune/ui/breadcrumbs';
import { AveBreadcrumbsHarness } from '@avelune/ui/breadcrumbs/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';

@Component({ selector: 'ave-breadcrumbs-page', template: '' })
class Page {}

@Component({
  selector: 'ave-breadcrumbs-host',
  imports: [AveBreadcrumbs],
  template: ` <div class="frame"><ave-breadcrumbs [items]="items()" [current]="current()" /></div> `,
})
class BreadcrumbsHost {
  readonly items = signal<readonly AveBreadcrumb[]>([
    { label: 'Главная', link: '/' },
    { label: 'Договоры', link: '/contracts' },
    { label: 'Поставки', link: ['/contracts', 'supply'] },
  ]);
  readonly current = signal('ДК-2026/114');
}

const used = [
  'space.1',
  'radius.sm',
  'size.target.min',
  'size.icon.sm',
  'border-width.default',
  'font.body-md',
  'color.fg.default',
  'color.fg.muted',
  'color.fg.subtle',
  'easing.standard',
] as const satisfies readonly TokenName[];

const root = document.documentElement;
const reset = document.createElement('style');
// The kit's reset (ADR 0030).
reset.textContent = '*, ::before, ::after { box-sizing: border-box; } .frame { inline-size: 640px; }';

beforeEach(() => {
  for (const name of used) root.style.setProperty(tokens[name].cssVar, tokens[name].css);
  root.style.setProperty('--ave-font-body-md-size', '14px');
  // The hover colour at once, so a test reads it without waiting for the transition.
  root.style.setProperty('--ave-duration-instant', '0ms');
  document.head.append(reset);
  TestBed.configureTestingModule({
    providers: [
      { provide: LOCALE_ID, useValue: 'ru' },
      provideRouter([{ path: '**', component: Page }]),
      provideLocationMocks(),
    ],
  });
});

afterEach(() => {
  for (const name of used) root.style.removeProperty(tokens[name].cssVar);
  root.style.removeProperty('--ave-font-body-md-size');
  root.style.removeProperty('--ave-duration-instant');
  reset.remove();
});

async function mount(): Promise<{
  fixture: ComponentFixture<BreadcrumbsHost>;
  element: HTMLElement;
  trail: AveBreadcrumbsHarness;
}> {
  const fixture = TestBed.createComponent(BreadcrumbsHost);
  const element = fixture.nativeElement as HTMLElement;
  document.body.prepend(element);
  fixture.detectChanges();
  await fixture.whenStable();
  const trail = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveBreadcrumbsHarness);
  return { fixture, element, trail };
}

describe('AveBreadcrumbs', () => {
  it('is a named navigation landmark with an ordered list of links and the current page last', async () => {
    const { element, trail } = await mount();
    expect(await trail.getLabel()).toBe('Навигационная цепочка');
    expect(await trail.getLinks()).toEqual(['Главная', 'Договоры', 'Поставки']);
    expect(await trail.getAddresses()).toEqual(['/', '/contracts', '/contracts/supply']);
    expect(await trail.getCurrent()).toBe('ДК-2026/114');
    const items = element.querySelectorAll('nav > ol > li');
    expect(items).toHaveLength(4);
    // The current page is text, not a link to itself.
    expect(items[3]?.querySelector('a')).toBeNull();
    expect(items[3]?.querySelector('[aria-current="page"]')?.localName).toBe('span');
    element.remove();
  });

  it('puts a decorative chevron after each link and none after the current page', async () => {
    const { element } = await mount();
    const separators = [...element.querySelectorAll('li ave-icon')];
    expect(separators.map((icon) => icon.getAttribute('data-icon'))).toEqual([
      'chevron-right',
      'chevron-right',
      'chevron-right',
    ]);
    expect(separators.every((icon) => icon.getAttribute('aria-hidden') === 'true')).toBe(true);
    expect(element.querySelector('li:last-child ave-icon')).toBeNull();
    element.remove();
  });

  it('follows a link through the router', async () => {
    const { fixture, element, trail } = await mount();
    await trail.follow('Договоры');
    await fixture.whenStable();
    expect(TestBed.inject(Location).path()).toBe('/contracts');
    await trail.follow(/Постав/);
    await fixture.whenStable();
    expect(TestBed.inject(Location).path()).toBe('/contracts/supply');
    await expect(trail.follow('Отчёты')).rejects.toThrow('no link matches Отчёты');
    element.remove();
  });

  it('draws muted links that take the text colour and an underline under the pointer', async () => {
    const { element } = await mount();
    const link = element.querySelector<HTMLElement>('a');
    const current = element.querySelector<HTMLElement>('[aria-current="page"]');
    if (link === null || current === null) throw new Error('No trail');
    const muted = getComputedStyle(element.querySelector('ave-breadcrumbs') ?? link).color;
    expect(getComputedStyle(link).color).toBe(muted);
    expect(getComputedStyle(link).textDecorationLine).toBe('none');
    expect(getComputedStyle(current).color).not.toBe(muted);
    await userEvent.hover(link);
    expect(getComputedStyle(link).textDecorationLine).toBe('underline');
    expect(getComputedStyle(link).color).toBe(getComputedStyle(current).color);
    await userEvent.unhover(link);
    element.remove();
  });

  it('sets every item on 24px lines, the chevron 4px after the last word, and wraps a long trail', async () => {
    const { fixture, element } = await mount();
    for (const item of element.querySelectorAll('li')) expect(item.getBoundingClientRect().height).toBe(24);
    const first = element.querySelector('li')?.getBoundingClientRect();
    const link = element.querySelector('a')?.getBoundingClientRect();
    const chevron = element.querySelector('li ave-icon')?.getBoundingClientRect();
    // Padding around the letters: a press at least 24px tall.
    expect(link?.height).toBeGreaterThanOrEqual(24);
    // The chevron is 16px, 4px after the words and level with their line.
    expect(chevron?.width).toBe(16);
    expect((chevron?.left ?? 0) - (link?.right ?? 0)).toBe(4);
    expect((chevron?.top ?? 0) - (first?.top ?? 0)).toBe(4);

    element.querySelector<HTMLElement>('.frame')?.style.setProperty('inline-size', '160px');
    fixture.componentInstance.current.set('Oʻzbekiston Respublikasi Vazirlar Mahkamasining qarori');
    fixture.detectChanges();
    const trail = element.querySelector<HTMLElement>('ol');
    if (trail === null) throw new Error('No trail');
    const items = [...element.querySelectorAll('li')];
    const tops = new Set(items.map((item) => item.getBoundingClientRect().top));
    expect(tops.size).toBeGreaterThan(1);
    // The long name wraps inside its item, on lines of 24px.
    expect((items.at(-1)?.getBoundingClientRect().height ?? 0) % 24).toBe(0);
    expect(items.at(-1)?.getBoundingClientRect().height).toBeGreaterThan(24);
    expect(trail.scrollWidth).toBe(trail.clientWidth);
    element.remove();
  });

  it('finds a trail by its current page', async () => {
    const { fixture, element } = await mount();
    const loader = TestbedHarnessEnvironment.loader(fixture);
    expect(await loader.getAllHarnesses(AveBreadcrumbsHarness.with({ current: 'ДК-2026/114' }))).toHaveLength(1);
    expect(await loader.getAllHarnesses(AveBreadcrumbsHarness.with({ current: /^Отчёт/ }))).toHaveLength(0);
    element.remove();
  });
});
