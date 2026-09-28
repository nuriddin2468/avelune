import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { tokens, type TokenName } from '@avelune/tokens';
import { AveSkeleton, type AveSkeletonShape } from '@avelune/ui/skeleton';
import { AveSkeletonHarness } from '@avelune/ui/skeleton/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

@Component({
  selector: 'ave-skeleton-host',
  imports: [AveSkeleton],
  template: `
    <ave-skeleton [shape]="shape()" [lines]="lines()" />
    <ave-skeleton shape="block" />
  `,
})
class SkeletonHost {
  readonly shape = signal<AveSkeletonShape>('text');
  readonly lines = signal(3);
}

const used = [
  'font.body-md',
  'space.1',
  'space.2',
  'radius.sm',
  'radius.md',
  'control.height.md',
  'color.bg.placeholder',
  'color.bg.placeholder-highlight',
] as const satisfies readonly TokenName[];

const root = document.documentElement;

beforeEach(() => {
  for (const name of used) root.style.setProperty(tokens[name].cssVar, tokens[name].css);
  // The typography token's parts, which the kit's CSS reads on their own.
  root.style.setProperty('--ave-font-body-md-line-height', '20px');
});

afterEach(() => {
  for (const name of used) root.style.removeProperty(tokens[name].cssVar);
  root.style.removeProperty('--ave-font-body-md-line-height');
});

function mount(): { fixture: ComponentFixture<SkeletonHost>; element: HTMLElement } {
  const fixture = TestBed.createComponent(SkeletonHost);
  const element = fixture.nativeElement as HTMLElement;
  // A 300px column, so the lines' widths are known.
  element.style.display = 'block';
  element.style.inlineSize = '300px';
  document.body.append(element);
  fixture.detectChanges();
  return { fixture, element };
}

/** `#rrggbb` → `rgb(r, g, b)`, as computed styles report colours. */
function rgb(hex: string): string {
  const [r, g, b] = [1, 3, 5].map((start) => Number.parseInt(hex.slice(start, start + 2), 16));
  return `rgb(${String(r)}, ${String(g)}, ${String(b)})`;
}

describe('AveSkeleton', () => {
  it('draws lines of body text, 12px bars in 20px lines, the last of several shorter', async () => {
    const { fixture, element } = mount();
    const text = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveSkeletonHarness.with({ shape: 'text' }));
    expect(await text.getParts()).toBe(3);
    expect(await text.isHidden()).toBe(true);
    const skeleton = element.querySelector('ave-skeleton');
    const parts = [...(skeleton?.querySelectorAll<HTMLElement>('.part') ?? [])];
    expect(skeleton?.getBoundingClientRect().height).toBe(60);
    expect(parts.map((part) => part.getBoundingClientRect().height)).toEqual([12, 12, 12]);
    expect(parts.map((part) => part.getBoundingClientRect().width)).toEqual([300, 300, 180]);
    expect(getComputedStyle(parts[0] ?? element).backgroundColor).toBe(rgb(tokens['color.bg.placeholder'].css));
    const highlight = parts[0]?.querySelector('.highlight');
    expect(highlight?.classList.contains('ave-motion-shimmer')).toBe(true);
    // At rest the band waits before the part's start, out of sight, so a shimmer of period 0 leaves a still fill.
    expect(getComputedStyle(highlight ?? element).translate).toBe('-100%');

    fixture.componentInstance.lines.set(1);
    fixture.detectChanges();
    expect(await text.getParts()).toBe(1);
    expect(element.querySelector('ave-skeleton .part')?.getBoundingClientRect().width).toBe(300);
    fixture.componentInstance.lines.set(0);
    fixture.detectChanges();
    expect(await text.getParts()).toBe(1);
  });

  it('draws one block as tall as a medium control, or as the application makes it', async () => {
    const { fixture, element } = mount();
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const block = await loader.getHarness(AveSkeletonHarness.with({ shape: 'block' }));
    expect(await block.getParts()).toBe(1);
    const host = element.querySelectorAll('ave-skeleton')[1];
    expect(host?.getBoundingClientRect().height).toBe(36);
    expect(getComputedStyle(host?.querySelector('.part') ?? element).borderTopLeftRadius).toBe(tokens['radius.md'].css);
    if (host instanceof HTMLElement) host.style.blockSize = '120px';
    expect(host?.querySelector('.part')?.getBoundingClientRect().height).toBe(120);

    fixture.componentInstance.shape.set('block');
    fixture.detectChanges();
    expect(await loader.getAllHarnesses(AveSkeletonHarness.with({ shape: 'block' }))).toHaveLength(2);
    expect(element.querySelector('ave-skeleton')?.querySelectorAll('.part')).toHaveLength(1);
  });

  it('rejects a shape it does not know', async () => {
    const { fixture, element } = mount();
    const [harness] = await TestbedHarnessEnvironment.loader(fixture).getAllHarnesses(AveSkeletonHarness);
    element.querySelector('ave-skeleton')?.setAttribute('data-shape', 'circle');
    await expect(harness?.getShape()).rejects.toThrow('unexpected data-shape "circle"');
  });
});
