import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { tokens, type TokenName } from '@avelune/tokens';
import { AveCard, AveCardEnd, AveCardFooter, AveCardTitle } from '@avelune/ui/card';
import { AveCardHarness } from '@avelune/ui/card/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

@Component({
  selector: 'ave-card-host',
  imports: [AveCard, AveCardEnd, AveCardFooter, AveCardTitle],
  template: `
    <div class="frame">
      <ave-card class="full">
        <h3 aveCardTitle>{{ title() }}</h3>
        <span aveCardEnd class="status">Подписан</span>
        <p class="body">ООО «Мебель Сервис», до 31.12.2026</p>
        <div aveCardFooter>
          <button type="button">Продлить</button>
          <button type="button">Открыть договор</button>
        </div>
      </ave-card>
      <ave-card class="plain"><p>Изменения сохраняются сразу.</p></ave-card>
      <ave-card class="titled"><h2 aveCardTitle>Уведомления</h2></ave-card>
      <ave-card class="ended"
        ><span aveCardEnd>Черновик</span>
        <p>Без названия</p></ave-card
      >
      <ave-card class="toggled">
        @if (named()) {
          <h3 aveCardTitle>Сводка</h3>
        }
        <p>Еженедельная сводка по договорам.</p>
      </ave-card>
    </div>
  `,
})
class CardHost {
  readonly title = signal('Поставка офисной мебели');
  readonly named = signal(true);
}

const used = [
  'space.2',
  'space.4',
  'border-width.default',
  'radius.lg',
  'font.body-md',
  'font.heading-sm',
  'color.bg.surface',
  'color.border.subtle',
  'color.fg.default',
] as const satisfies readonly TokenName[];

const root = document.documentElement;
const reset = document.createElement('style');
// The kit's reset, in its layer (ADR 0030), under the components' styles: a heading's margins go.
reset.textContent =
  '@layer reset, components; @layer reset { *, ::before, ::after { box-sizing: border-box; } p { margin: 0; } h3 { margin: 1em 0; } }';

beforeEach(() => {
  for (const name of used) root.style.setProperty(tokens[name].cssVar, tokens[name].css);
  document.head.append(reset);
});

afterEach(() => {
  for (const name of used) root.style.removeProperty(tokens[name].cssVar);
  reset.remove();
});

function mount(): { fixture: ComponentFixture<CardHost>; element: HTMLElement } {
  const fixture = TestBed.createComponent(CardHost);
  const element = fixture.nativeElement as HTMLElement;
  element.style.display = 'block';
  element.style.inlineSize = '480px';
  document.body.append(element);
  fixture.detectChanges();
  return { fixture, element };
}

function box(element: Element | null | undefined): DOMRect {
  if (element === null || element === undefined) throw new Error('No element');
  return element.getBoundingClientRect();
}

describe('AveCard', () => {
  it('is a bordered surface without a shadow, 16px from its edge and 16px between its parts', () => {
    const { element } = mount();
    const card = element.querySelector('.full');
    const style = getComputedStyle(card ?? element);
    expect(Number.parseFloat(style.paddingTop) + Number.parseFloat(style.borderTopWidth)).toBe(16);
    expect(style.borderTopWidth).toBe('1px');
    expect(style.borderTopLeftRadius).toBe('12px');
    expect(style.boxShadow).toBe('none');
    const head = card?.querySelector('.head');
    const body = card?.querySelector('.body');
    const footer = card?.querySelector('[aveCardFooter]');
    expect(box(body).top - box(head).bottom).toBe(16);
    expect(box(footer).top - box(body).bottom).toBe(16);
    element.remove();
  });

  it('puts the title at the start of the heading row and its end at the inline end, the footer’s actions at the end', () => {
    const { element } = mount();
    const card = element.querySelector('.full');
    const title = card?.querySelector('h3');
    const status = card?.querySelector('.status');
    expect(getComputedStyle(title ?? element).fontSize).toBe(`${String(tokens['font.heading-sm'].value.fontSize)}px`);
    expect(getComputedStyle(title ?? element).marginTop).toBe('0px');
    expect(box(title).top).toBe(box(status).top);
    expect(box(card).right - box(status).right).toBe(16);
    const [renew, open] = card?.querySelectorAll('[aveCardFooter] button') ?? [];
    expect(box(card).right - box(open).right).toBe(16);
    expect(box(open).left - box(renew).right).toBe(8);
    element.remove();
  });

  it('wraps a long title and keeps its end on the first line, and draws no heading row without a title or an end', () => {
    const { fixture, element } = mount();
    element.style.inlineSize = '240px';
    fixture.componentInstance.title.set('Oʻzbekiston Respublikasi Vazirlar Mahkamasining qarori');
    fixture.detectChanges();
    const card = element.querySelector('.full');
    expect(card?.scrollWidth).toBe(card?.clientWidth);
    expect(box(card?.querySelector('.status')).top).toBeGreaterThanOrEqual(box(card?.querySelector('h3')).top);
    expect(element.querySelector('.plain .head')).toBeNull();
    // A title alone, or an end alone, draws the row with what it has.
    expect(element.querySelector('.titled .head h2')).not.toBeNull();
    expect(element.querySelector('.titled .end')).toBeNull();
    expect(element.querySelector('.ended .head .end')?.textContent.trim()).toBe('Черновик');
    // A title that leaves takes the row with it.
    expect(element.querySelector('.toggled .head')).not.toBeNull();
    fixture.componentInstance.named.set(false);
    fixture.detectChanges();
    expect(element.querySelector('.toggled .head')).toBeNull();
    element.remove();
  });

  it('reads its title, text and footer through the harness', async () => {
    const { fixture, element } = mount();
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const card = await loader.getHarness(AveCardHarness.with({ title: 'Поставка офисной мебели' }));
    expect(await card.getFooterActions()).toEqual(['Продлить', 'Открыть договор']);
    expect(await card.getText()).toContain('ООО «Мебель Сервис»');
    const plain = await loader.getHarness(AveCardHarness.with({ selector: '.plain' }));
    expect(await plain.getTitle()).toBe('');
    expect(await plain.getFooterActions()).toEqual([]);
    expect(await loader.getAllHarnesses(AveCardHarness.with({ title: /^Аренда/ }))).toHaveLength(0);
    element.remove();
  });
});
