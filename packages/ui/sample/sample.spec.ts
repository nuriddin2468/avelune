import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { AveSample, type AveSampleTone } from '@avelune/ui/sample';
import { AveSampleHarness } from '@avelune/ui/sample/testing';
import { describe, expect, it } from 'vitest';

@Component({
  selector: 'ave-sample-host',
  imports: [AveSample],
  template: `
    <p aveSample [tone]="tone()" [disabled]="disabled()">Sample</p>
    <p aveSample>Default</p>
  `,
})
class SampleHost {
  readonly tone = signal<AveSampleTone>('accent');
  readonly disabled = signal(false);
}

function setup() {
  const fixture = TestBed.createComponent(SampleHost);
  const loader = TestbedHarnessEnvironment.loader(fixture);
  return { fixture, loader };
}

describe('AveSample', () => {
  it('reflects the tone on the host', async () => {
    const { loader } = setup();
    const [first, second] = await loader.getAllHarnesses(AveSampleHarness);
    expect(await first?.getTone()).toBe('accent');
    expect(await second?.getTone()).toBe('neutral');
  });

  it('reflects disabled only while it is set', async () => {
    const { fixture, loader } = setup();
    const sample = await loader.getHarness(AveSampleHarness.with({ tone: 'accent' }));
    expect(await sample.isDisabled()).toBe(false);
    fixture.componentInstance.disabled.set(true);
    expect(await sample.isDisabled()).toBe(true);
  });

  it('filters harnesses by tone', async () => {
    const { loader } = setup();
    expect(await loader.getAllHarnesses(AveSampleHarness.with({ tone: 'neutral' }))).toHaveLength(1);
    expect(await loader.getAllHarnesses(AveSampleHarness.with({ tone: 'accent' }))).toHaveLength(1);
  });

  it('rejects a tone the harness does not know', async () => {
    const { fixture, loader } = setup();
    const [first] = await loader.getAllHarnesses(AveSampleHarness);
    const host = fixture.nativeElement as HTMLElement;
    host.querySelector('p')?.setAttribute('data-tone', 'loud');
    await expect(first?.getTone()).rejects.toThrow('unexpected data-tone "loud"');
  });

  it('runs in a real browser: the host lays out with a size', async () => {
    const { fixture } = setup();
    await fixture.whenStable();
    const host = fixture.nativeElement as HTMLElement;
    const sample = host.querySelector('p');
    document.body.append(host);
    expect(sample?.getBoundingClientRect().height ?? 0).toBeGreaterThan(0);
  });
});
