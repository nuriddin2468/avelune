import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { tokens, type TokenName } from '@avelune/tokens';
import { AveProgress, type AveProgressSize, type AveProgressVariant } from '@avelune/ui/progress';
import { AveProgressHarness } from '@avelune/ui/progress/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

@Component({
  selector: 'ave-progress-host',
  imports: [AveProgress],
  template: `
    <label for="upload">Договор.pdf</label>
    <progress aveProgress id="upload" max="200" [value]="sent()" [variant]="variant()" [size]="size()"></progress>
    <progress aveProgress aria-label="Import" value="0.5"></progress>
    <progress aveProgress aria-label="Waiting"></progress>
  `,
})
class ProgressHost {
  readonly sent = signal(50);
  readonly variant = signal<AveProgressVariant>('accent');
  readonly size = signal<AveProgressSize>('md');
}

const used = [
  'space.1',
  'space.2',
  'radius.full',
  'border-width.default',
  'color.bg.track',
  'color.accent.bg',
  'color.success.bg',
  'color.danger.bg',
] as const satisfies readonly TokenName[];

const root = document.documentElement;

beforeEach(() => {
  for (const name of used) root.style.setProperty(tokens[name].cssVar, tokens[name].css);
});

afterEach(() => {
  for (const name of used) root.style.removeProperty(tokens[name].cssVar);
});

function mount(): { fixture: ComponentFixture<ProgressHost>; bar: HTMLProgressElement } {
  const fixture = TestBed.createComponent(ProgressHost);
  const host = fixture.nativeElement as HTMLElement;
  // A 300px column, so the bar's full width is known.
  host.style.display = 'block';
  host.style.inlineSize = '300px';
  document.body.append(host);
  fixture.detectChanges();
  const bar = (fixture.nativeElement as HTMLElement).querySelector('progress');
  if (bar === null) throw new Error('No progress bar');
  return { fixture, bar };
}

/** `#rrggbb` → `rgb(r, g, b)`, as computed styles report colours. */
function rgb(hex: string): string {
  const [r, g, b] = [1, 3, 5].map((start) => Number.parseInt(hex.slice(start, start + 2), 16));
  return `rgb(${String(r)}, ${String(g)}, ${String(b)})`;
}

describe('AveProgress', () => {
  it('stays a native progress bar, named by its label, with its value and maximum', async () => {
    const { fixture } = mount();
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const upload = await loader.getHarness(AveProgressHarness.with({ label: 'Договор.pdf' }));
    expect(await upload.getValue()).toBe(50);
    expect(await upload.getMax()).toBe(200);
    expect(await upload.getPercent()).toBe(25);
    fixture.componentInstance.sent.set(300);
    fixture.detectChanges();
    expect(await upload.getPercent()).toBe(100);
    const imported = await loader.getHarness(AveProgressHarness.with({ label: 'Import' }));
    expect(await imported.getMax()).toBe(1);
    expect(await imported.getPercent()).toBe(50);
    const waiting = await loader.getHarness(AveProgressHarness.with({ label: /Wait/ }));
    expect(await waiting.getValue()).toBeNull();
    expect(await waiting.getPercent()).toBeNull();
  });

  it('draws a full-width rounded track, 8px or 4px thick, the fill in the variant colour', async () => {
    const { fixture, bar } = mount();
    const harness = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveProgressHarness);
    expect(await harness.getVariant()).toBe('accent');
    expect(await harness.getSize()).toBe('md');
    expect([bar.getBoundingClientRect().width, bar.getBoundingClientRect().height]).toEqual([300, 8]);
    expect(getComputedStyle(bar).backgroundColor).toBe(rgb(tokens['color.bg.track'].css));
    expect(getComputedStyle(bar).borderTopLeftRadius).toBe(tokens['radius.full'].css);
    const fill = (): string => getComputedStyle(bar).getPropertyValue('--ave-progress-fill').trim();
    expect(fill()).toBe(tokens['color.accent.bg'].css);

    fixture.componentInstance.size.set('sm');
    fixture.componentInstance.variant.set('success');
    fixture.detectChanges();
    expect(await harness.getSize()).toBe('sm');
    expect(await harness.getVariant()).toBe('success');
    expect(bar.getBoundingClientRect().height).toBe(4);
    expect(fill()).toBe(tokens['color.success.bg'].css);
    fixture.componentInstance.variant.set('danger');
    fixture.detectChanges();
    expect(fill()).toBe(tokens['color.danger.bg'].css);
  });
});
