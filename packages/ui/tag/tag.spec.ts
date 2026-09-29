import { Component, LOCALE_ID, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { tokens, type TokenName } from '@avelune/tokens';
import { AveTag } from '@avelune/ui/tag';
import { AveTagHarness } from '@avelune/ui/tag/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';

@Component({
  selector: 'ave-tag-host',
  imports: [AveTag],
  template: `
    <div class="list">
      @for (region of regions(); track region) {
        <ave-tag removable (remove)="drop(region)">{{ region }}</ave-tag>
      }
    </div>
    <ul class="items">
      @for (label of labels(); track label) {
        <li>
          <ave-tag size="sm" removable (remove)="kept.set(kept() + 1)">{{ label }}</ave-tag>
        </li>
      }
    </ul>
    <p class="narrow"><ave-tag>Oʻzbekiston Respublikasi Vazirlar Mahkamasi</ave-tag></p>
    <p class="alone"><ave-tag removable (remove)="alone.set(false)">Срочно</ave-tag></p>
    <div class="pair">
      @for (value of pair(); track value) {
        <ave-tag removable (remove)="pair.set([])">{{ value }}</ave-tag>
      }
    </div>
    <div class="moved">
      @for (value of moved(); track value) {
        <ave-tag removable (remove)="moved.set([]); after.focus()">{{ value }}</ave-tag>
      }
      <button #after type="button" class="after">Добавить регион</button>
    </div>
  `,
})
class TagHost {
  readonly regions = signal(['Ташкент', 'Самарканд', 'Бухара']);
  readonly labels = signal(['Срочно', 'Для служебного пользования']);
  readonly kept = signal(0);
  readonly alone = signal(true);
  readonly pair = signal(['Андижан', 'Наманган']);
  readonly moved = signal(['Термез', 'Карши']);

  drop(region: string): void {
    this.regions.update((regions) => regions.filter((one) => one !== region));
  }
}

const used = [
  'space.1',
  'space.2',
  'border-width.default',
  'radius.sm',
  'size.control.xs',
  'size.target.min',
  'size.icon.sm',
  'size.icon.md',
  'font.label-sm',
  'color.border.default',
  'color.bg.surface',
  'color.bg.hover',
  'color.fg.default',
  'color.fg.muted',
] as const satisfies readonly TokenName[];

const root = document.documentElement;
const reset = document.createElement('style');
// The kit's reset (ADR 0030): border-box sizing, no margins, long words break.
reset.textContent =
  '*, ::before, ::after { box-sizing: border-box; } p, ul { margin: 0; padding: 0; overflow-wrap: break-word; }' +
  ' .list { display: flex; gap: 8px; }';

beforeEach(() => {
  for (const name of used) root.style.setProperty(tokens[name].cssVar, tokens[name].css);
  root.style.setProperty('--ave-font-label-sm-line-height', '16px');
  root.style.setProperty('--ave-duration-instant', '0ms');
  document.head.append(reset);
});

afterEach(() => {
  for (const name of used) root.style.removeProperty(tokens[name].cssVar);
  root.style.removeProperty('--ave-font-label-sm-line-height');
  root.style.removeProperty('--ave-duration-instant');
  reset.remove();
});

function mount(locale = 'ru'): { fixture: ComponentFixture<TagHost>; element: HTMLElement } {
  TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: locale }] });
  const fixture = TestBed.createComponent(TagHost);
  const element = fixture.nativeElement as HTMLElement;
  element.style.display = 'block';
  element.style.inlineSize = '600px';
  document.body.append(element);
  fixture.detectChanges();
  return { fixture, element };
}

function box(element: Element | null | undefined): DOMRect {
  if (element === null || element === undefined) throw new Error('No element');
  return element.getBoundingClientRect();
}

describe('AveTag', () => {
  it('names its remove button "Убрать" and its words, and asks the application to remove it', async () => {
    const { fixture, element } = mount();
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const tag = await loader.getHarness(AveTagHarness.with({ text: 'Самарканд' }));
    expect(await tag.isRemovable()).toBe(true);
    expect(await tag.getRemoveLabel()).toBe('Убрать Самарканд');
    const button = element.querySelector('ave-tag:nth-child(2) .remove');
    const ids = button?.getAttribute('aria-labelledby')?.split(' ') ?? [];
    expect(ids.map((id) => document.getElementById(id)?.textContent.trim())).toEqual(['Убрать', 'Самарканд']);
    await tag.remove();
    fixture.detectChanges();
    expect(fixture.componentInstance.regions()).toEqual(['Ташкент', 'Бухара']);
    const plain = await loader.getHarness(AveTagHarness.with({ text: /^Oʻzbekiston/ }));
    expect(await plain.isRemovable()).toBe(false);
    expect(await plain.getRemoveLabel()).toBeNull();
    expect(await plain.isRemoveFocused()).toBe(false);
    await expect(plain.remove()).rejects.toThrow('no remove button');
    element.remove();
  });

  it('moves focus to the next tag once one is gone, then to the one before', async () => {
    const { fixture, element } = mount();
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const first = element.querySelector<HTMLElement>('.list ave-tag .remove');
    first?.focus();
    await userEvent.keyboard('{Enter}');
    await fixture.whenStable();
    expect(fixture.componentInstance.regions()).toEqual(['Самарканд', 'Бухара']);
    expect(await (await loader.getHarness(AveTagHarness.with({ text: 'Самарканд' }))).isRemoveFocused()).toBe(true);
    await userEvent.keyboard('{Tab}');
    await userEvent.keyboard(' ');
    await fixture.whenStable();
    // The last one gone: focus goes to the one before it.
    expect(fixture.componentInstance.regions()).toEqual(['Самарканд']);
    expect(await (await loader.getHarness(AveTagHarness.with({ text: 'Самарканд' }))).isRemoveFocused()).toBe(true);
    element.remove();
  });

  it('keeps focus on a tag the application keeps, and finds its neighbours in a list', async () => {
    const { fixture, element } = mount();
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const kept = await loader.getHarness(AveTagHarness.with({ text: 'Срочно', ancestor: '.items' }));
    element.querySelector<HTMLElement>('.items .remove')?.focus();
    await userEvent.keyboard('{Enter}');
    await fixture.whenStable();
    expect(fixture.componentInstance.kept()).toBe(1);
    expect(await kept.isRemoveFocused()).toBe(true);
    // A tag alone: nothing to move to, and focus is the application's.
    const alone = element.querySelector<HTMLElement>('.alone .remove');
    alone?.focus();
    await userEvent.keyboard('{Enter}');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.alone()).toBe(false);
    element.remove();
  });

  it('leaves focus alone when its neighbour went too, or when the application moved it', async () => {
    const { fixture, element } = mount();
    element.querySelector<HTMLElement>('.pair .remove')?.focus();
    await userEvent.keyboard('{Enter}');
    await fixture.whenStable();
    expect(element.querySelectorAll('.pair ave-tag')).toHaveLength(0);
    expect(document.activeElement).toBe(document.body);
    element.querySelector<HTMLElement>('.moved .remove')?.focus();
    await userEvent.keyboard('{Enter}');
    await fixture.whenStable();
    expect(element.querySelectorAll('.moved ave-tag')).toHaveLength(0);
    expect(document.activeElement).toBe(element.querySelector('.after'));
    element.remove();
  });

  it('is an outlined rectangle 28px tall, 24px small, its remove button 1px inside the border', () => {
    const { element } = mount();
    const tag = element.querySelector('.list ave-tag');
    const style = getComputedStyle(tag ?? element);
    expect(box(tag).height).toBe(28);
    expect(style.borderTopLeftRadius).toBe('4px');
    expect(style.borderTopWidth).toBe('1px');
    const button = tag?.querySelector('.remove');
    expect(box(button).width).toBe(24);
    expect(box(button).top - box(tag).top).toBe(2);
    expect(box(tag).right - box(button).right).toBe(2);
    // 8px before the words, the button 4px after them.
    const words = tag?.querySelector('.words');
    expect(box(words).left - box(tag).left).toBe(8);
    expect(box(button).left - box(words).right).toBe(4);
    const small = element.querySelector('.items ave-tag');
    expect(box(small).height).toBe(24);
    const smallButton = small?.querySelector('.remove');
    expect(box(smallButton).height).toBe(20);
    expect(box(smallButton).top - box(small).top).toBe(2);
    expect(box(small).right - box(smallButton).right).toBe(2);
    expect(box(element.querySelector('.alone ave-tag')).width).toBeLessThan(120);
    element.remove();
  });

  it('turns its remove button the hover fill under the pointer', async () => {
    const { element } = mount();
    const button = element.querySelector<HTMLElement>('.list ave-tag .remove');
    if (button === null) throw new Error('No button');
    const rest = getComputedStyle(button).backgroundColor;
    await userEvent.hover(button);
    expect(getComputedStyle(button).backgroundColor).not.toBe(rest);
    await userEvent.unhover(button);
    element.remove();
  });

  it('wraps long words instead of cutting them', () => {
    const { element } = mount('uz-Latn');
    const narrow = element.querySelector<HTMLElement>('.narrow');
    if (narrow === null) throw new Error('No container');
    narrow.style.inlineSize = '140px';
    const tag = narrow.querySelector('ave-tag');
    expect(box(tag).width).toBeLessThanOrEqual(140);
    expect(box(tag).height).toBeGreaterThan(28);
    expect((box(tag).height - 12) % 16).toBe(0);
    element.remove();
  });

  it('names its button in the locale', async () => {
    const { fixture, element } = mount('uz-Latn');
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const tag = await loader.getHarness(AveTagHarness.with({ text: 'Бухара' }));
    expect(await tag.getRemoveLabel()).toBe('Olib tashlash Бухара');
    element.remove();
  });
});
