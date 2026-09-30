import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { tokens } from '@avelune/tokens';
import { AveDashboard, AveDashboardActions, AveDashboardMetric, AveDashboardWide } from '@avelune/ui/dashboard';
import { AveDashboardHarness } from '@avelune/ui/dashboard/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

@Component({
  selector: 'ave-dashboard-host',
  imports: [AveDashboard, AveDashboardActions, AveDashboardMetric, AveDashboardWide],
  template: `
    <ave-dashboard heading="Обзор" [description]="description()" metricsLabel="Договоры в цифрах">
      <div aveDashboardActions><button type="button" class="period">За месяц</button></div>
      @for (figure of figures(); track figure.label) {
        <ave-dashboard-metric [label]="figure.label" [value]="figure.value" [note]="figure.note" />
      }
      <section class="tile first">Ждут согласования</section>
      <section class="tile second">Истекают скоро</section>
      <div aveDashboardWide class="wide"><section class="tile">Последние изменения</section></div>
    </ave-dashboard>
  `,
})
class DashboardHost {
  readonly description = signal('Договоры отдела на сегодня');
  readonly figures = signal([
    { label: 'Действующие', value: '34', note: '+3 за месяц' },
    { label: 'На согласовании', value: '5', note: '' },
  ]);
}

const every = Object.values(tokens);
const root = document.documentElement;
const reset = document.createElement('style');
// The kit's layer order and reset (ADR 0030): without styles.css, layers would stack in the order they first appear.
reset.textContent =
  '@layer reset, tokens, base, components, patterns, utilities, app; @layer reset { *, ::before, ::after { box-sizing: border-box; } p, h1 { margin: 0; } } .tile { display: block; } .first { block-size: 160px; }';

beforeEach(() => {
  for (const token of every) root.style.setProperty(token.cssVar, token.css);
  document.head.append(reset);
});

afterEach(() => {
  for (const token of every) root.style.removeProperty(token.cssVar);
  reset.remove();
});

function mount(width: number): { fixture: ComponentFixture<DashboardHost>; element: HTMLElement } {
  const fixture = TestBed.createComponent(DashboardHost);
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

describe('AveDashboard', () => {
  it('heads the page, lists its key figures, and puts its cards in three columns from container.lg', async () => {
    const { fixture, element } = mount(1000);
    const page = await TestbedHarnessEnvironment.loader(fixture).getHarness(
      AveDashboardHarness.with({ heading: 'Обзор' }),
    );
    expect(await page.getDescription()).toBe('Договоры отдела на сегодня');
    expect(await page.getMetrics()).toEqual([
      { label: 'Действующие', value: '34', note: '+3 за месяц' },
      { label: 'На согласовании', value: '5', note: '' },
    ]);
    expect(await page.getColumnCount()).toBe(3);

    const metrics = element.querySelector('.metrics');
    expect(metrics?.getAttribute('role')).toBe('list');
    expect(metrics?.getAttribute('aria-label')).toBe('Договоры в цифрах');
    const [first] = element.querySelectorAll('ave-dashboard-metric');
    expect(first?.getAttribute('role')).toBe('listitem');
    expect(getComputedStyle(first?.querySelector('.value') ?? element).fontVariantNumeric).toBe('tabular-nums');
    expect(getComputedStyle(first ?? element).borderTopLeftRadius).toBe(tokens['radius.lg'].css);
    expect(box(element.querySelector('.period')).right).toBe(box(element).right);

    const one = element.querySelector('.first');
    const two = element.querySelector('.second');
    expect(box(two).left - box(one).right).toBe(24);
    expect(box(two).height).toBe(160);
    expect(box(metrics).top - box(element.querySelector('.header')).bottom).toBe(24);
    expect(box(one).top - box(metrics).bottom).toBe(24);
    const wide = element.querySelector('.wide');
    expect(box(wide).width).toBe(box(two).right - box(one).left);
    element.remove();
  });

  it('stands its cards in two columns from container.md, a wide one across both, and in one below it', async () => {
    const { fixture, element } = mount(700);
    const page = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveDashboardHarness);
    expect(await page.getColumnCount()).toBe(2);
    expect(box(element.querySelector('.wide')).width).toBe(700);
    element.style.inlineSize = '400px';
    expect(await page.getColumnCount()).toBe(1);
    expect(box(element.querySelector('.wide')).width).toBe(400);
    expect(element.scrollWidth).toBe(element.clientWidth);

    fixture.componentInstance.figures.set([]);
    fixture.componentInstance.description.set('');
    expect(await page.getMetrics()).toEqual([]);
    expect(await page.getDescription()).toBe('');
    expect(getComputedStyle(element.querySelector('.metrics') ?? element).display).toBe('none');
    element.remove();
  });
});
