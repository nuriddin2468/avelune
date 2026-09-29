import { Component, LOCALE_ID, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { tokens, type TokenName } from '@avelune/tokens';
import { AveBadge, AveCount, type AveBadgeVariant } from '@avelune/ui/badge';
import { AveBadgeHarness, AveCountHarness } from '@avelune/ui/badge/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

@Component({
  selector: 'ave-badge-host',
  imports: [AveBadge, AveCount],
  template: `
    <p class="row">
      <ave-badge>Черновик</ave-badge>
      <ave-badge variant="info">На согласовании</ave-badge>
      <ave-badge variant="success">Подписан</ave-badge>
      <ave-badge variant="warning">Истекает</ave-badge>
      <ave-badge [variant]="variant()">Истёк</ave-badge>
    </p>
    <p class="narrow">
      <ave-badge variant="info">Oʻzbekiston Respublikasi Moliya vazirligida kelishilmoqda</ave-badge>
    </p>
    <p class="empty"><ave-badge variant="success" /></p>
    <div class="grid"><ave-badge variant="success">Подписан</ave-badge><ave-count value="7" /></div>
    <p class="row">
      <ave-count class="one" [value]="count()" />
      <ave-count class="many" value="1234" max="9999" />
      <ave-count class="capped" value="120" />
      <ave-count class="none" value="0" />
    </p>
  `,
})
class BadgeHost {
  readonly variant = signal<AveBadgeVariant>('danger');
  readonly count = signal(3);
}

const used = [
  'space.1',
  'space.2',
  'space.5',
  'border-width.default',
  'radius.sm',
  'radius.full',
  'font.label-sm',
  'color.bg.active',
  'color.fg.muted',
  'color.info.bg-subtle',
  'color.info.fg',
  'color.success.bg-subtle',
  'color.success.fg',
  'color.warning.bg-subtle',
  'color.warning.fg',
  'color.danger.bg-subtle',
  'color.danger.fg',
  'color.accent.bg',
  'color.fg.on-accent',
] as const satisfies readonly TokenName[];

const root = document.documentElement;
const reset = document.createElement('style');
// The kit's reset (ADR 0030): border-box sizing, no margins on paragraphs, long words break.
reset.textContent = '*, ::before, ::after { box-sizing: border-box; } p { margin: 0; overflow-wrap: break-word; }';

beforeEach(() => {
  for (const name of used) root.style.setProperty(tokens[name].cssVar, tokens[name].css);
  document.head.append(reset);
});

afterEach(() => {
  for (const name of used) root.style.removeProperty(tokens[name].cssVar);
  reset.remove();
});

function mount(locale = 'ru'): { fixture: ComponentFixture<BadgeHost>; element: HTMLElement } {
  TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: locale }] });
  const fixture = TestBed.createComponent(BadgeHost);
  const element = fixture.nativeElement as HTMLElement;
  element.style.display = 'block';
  element.style.inlineSize = '600px';
  document.body.append(element);
  fixture.detectChanges();
  return { fixture, element };
}

/** A token's colour as computed styles report it, through an element that paints it. */
function colour(name: TokenName): string {
  const probe = document.createElement('i');
  probe.style.color = `var(${tokens[name].cssVar})`;
  document.body.append(probe);
  const value = getComputedStyle(probe).color;
  probe.remove();
  return value;
}

function box(element: Element | null | undefined): DOMRect {
  if (element === null || element === undefined) throw new Error('No element');
  return element.getBoundingClientRect();
}

describe('AveBadge', () => {
  it('writes each status on its tinted fill in its colour, the neutral one on the pressed fill', async () => {
    const { fixture, element } = mount();
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const fills: Record<AveBadgeVariant, readonly [TokenName, TokenName]> = {
      neutral: ['color.bg.active', 'color.fg.muted'],
      info: ['color.info.bg-subtle', 'color.info.fg'],
      success: ['color.success.bg-subtle', 'color.success.fg'],
      warning: ['color.warning.bg-subtle', 'color.warning.fg'],
      danger: ['color.danger.bg-subtle', 'color.danger.fg'],
    };
    const badges = await loader.getAllHarnesses(AveBadgeHarness);
    expect(badges).toHaveLength(8);
    for (const [variant, [fill, text]] of Object.entries(fills)) {
      const host = element.querySelector(`ave-badge[data-variant="${variant}"]`) ?? element;
      const style = getComputedStyle(host);
      expect(style.backgroundColor).toBe(colour(fill));
      expect(style.color).toBe(colour(text));
    }
    const signed = await loader.getHarness(AveBadgeHarness.with({ text: 'Подписан' }));
    expect(await signed.getVariant()).toBe('success');
    expect(await loader.getHarness(AveBadgeHarness.with({ variant: 'neutral' }))).toBeTruthy();
    expect(await (await loader.getHarness(AveBadgeHarness.with({ variant: 'danger' }))).getText()).toBe('Истёк');
    fixture.componentInstance.variant.set('warning');
    fixture.detectChanges();
    expect(await loader.getAllHarnesses(AveBadgeHarness.with({ variant: 'warning' }))).toHaveLength(2);
    expect(await loader.getAllHarnesses(AveBadgeHarness.with({ variant: 'success' }))).toHaveLength(3);
    expect(await loader.getAllHarnesses(AveBadgeHarness.with({ variant: 'danger' }))).toHaveLength(0);
    // A variant the kit does not know is a broken page, which the harness reports.
    element.querySelector('ave-badge')?.setAttribute('data-variant', 'loud');
    const [first] = await loader.getAllHarnesses(AveBadgeHarness);
    await expect(first?.getVariant()).rejects.toThrow('unexpected data-variant "loud"');
    element.remove();
  });

  it('is a 20px rectangle with the small radius and 8px either side of its words, whose border only forced colours paint', () => {
    const { element } = mount();
    const host = element.querySelector('ave-badge[data-variant="success"]');
    const style = getComputedStyle(host ?? element);
    expect(box(host).height).toBe(20);
    expect(style.borderTopLeftRadius).toBe('4px');
    expect(style.borderTopColor).toBe('rgba(0, 0, 0, 0)');
    expect(Number.parseFloat(style.paddingInlineStart) + Number.parseFloat(style.borderInlineStartWidth)).toBe(8);
    const words = document.createRange();
    words.selectNodeContents(host ?? element);
    expect(Math.round(words.getBoundingClientRect().left - box(host).left)).toBe(8);
    element.remove();
  });

  it('wraps long words inside its container instead of truncating them', () => {
    const { element } = mount('uz-Latn');
    const narrow = element.querySelector<HTMLElement>('.narrow');
    if (narrow === null) throw new Error('No container');
    narrow.style.inlineSize = '160px';
    const host = narrow.querySelector('ave-badge');
    expect(box(host).width).toBeLessThanOrEqual(160);
    expect(box(host).height).toBeGreaterThan(20);
    expect((box(host).height - 4) % 16).toBe(0);
    expect(getComputedStyle(host ?? element).textOverflow).toBe('clip');
    // In a grid's column, as wide as its words, never stretched; the count too.
    const grid = element.querySelector<HTMLElement>('.grid');
    if (grid === null) throw new Error('No grid');
    grid.style.display = 'grid';
    grid.style.inlineSize = '400px';
    expect(box(grid.querySelector('ave-badge')).width).toBeLessThan(100);
    expect(box(grid.querySelector('ave-count')).width).toBe(20);
    // A badge without words draws nothing.
    expect(box(element.querySelector('.empty ave-badge')).width).toBe(0);
    element.remove();
  });
});

describe('AveCount', () => {
  it('writes the number in the locale on the accent fill, and caps it', async () => {
    const { fixture, element } = mount();
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const counts = await loader.getAllHarnesses(AveCountHarness);
    expect(await Promise.all(counts.map((count) => count.getText()))).toEqual(['7', '3', '1 234', '99+', '']);
    const one = element.querySelector('.one');
    const style = getComputedStyle(one ?? element);
    expect(style.backgroundColor).toBe(colour('color.accent.bg'));
    expect(style.color).toBe(colour('color.fg.on-accent'));
    expect(style.fontVariantNumeric).toBe('tabular-nums');
    // One figure is a 20px circle; more figures widen it.
    expect(box(one).height).toBe(20);
    expect(box(one).width).toBe(20);
    expect(style.borderTopLeftRadius).not.toBe('0px');
    expect(box(element.querySelector('.capped')).width).toBeGreaterThan(20);
    fixture.componentInstance.count.set(12.7);
    fixture.detectChanges();
    expect(await (await loader.getHarness(AveCountHarness.with({ selector: '.one' }))).getText()).toBe('12');
    element.remove();
  });

  it('draws nothing at 0 or below, or without a number', async () => {
    const { fixture, element } = mount();
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const none = await loader.getHarness(AveCountHarness.with({ selector: '.none' }));
    expect(await none.isShown()).toBe(false);
    expect(box(element.querySelector('.none')).width).toBe(0);
    const one = await loader.getHarness(AveCountHarness.with({ selector: '.one' }));
    expect(await one.isShown()).toBe(true);
    for (const value of [-2, Number.NaN, 0.5]) {
      fixture.componentInstance.count.set(value);
      fixture.detectChanges();
      expect(await one.isShown()).toBe(false);
      expect(await one.getText()).toBe('');
    }
    expect(await loader.getAllHarnesses(AveCountHarness.with({ text: '99+' }))).toHaveLength(1);
    element.remove();
  });

  it('writes Uzbek in Latin script with the separators of Uzbek', async () => {
    const { fixture, element } = mount('uz-Latn');
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const many = await loader.getHarness(AveCountHarness.with({ selector: '.many' }));
    expect(await many.getText()).toBe('1 234');
    element.remove();
  });
});
