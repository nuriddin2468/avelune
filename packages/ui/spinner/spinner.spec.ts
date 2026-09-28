import { Component, LOCALE_ID, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { tokens, type TokenName } from '@avelune/tokens';
import { AveSpinner, type AveSpinnerSize } from '@avelune/ui/spinner';
import { AveSpinnerHarness } from '@avelune/ui/spinner/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

@Component({
  selector: 'ave-spinner-host',
  imports: [AveSpinner],
  template: `
    <p>Before <ave-spinner [loading]="loading()" [size]="size()" [label]="label()" /> after</p>
    <ave-spinner />
  `,
})
class SpinnerHost {
  readonly loading = signal(false);
  readonly size = signal<AveSpinnerSize>('md');
  readonly label = signal('');
}

const used = [
  'size.icon.sm',
  'size.icon.md',
  'size.icon.lg',
  'timing.spinner-delay',
  'timing.spinner-min-visible',
] as const satisfies readonly TokenName[];

const root = document.documentElement;

beforeEach(() => {
  for (const name of used) root.style.setProperty(tokens[name].cssVar, tokens[name].css);
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
});

afterEach(() => {
  for (const name of used) root.style.removeProperty(tokens[name].cssVar);
  vi.useRealTimers();
});

function setup(locale = 'en'): { fixture: ComponentFixture<SpinnerHost>; spinner: Element } {
  TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: locale }] });
  const fixture = TestBed.createComponent(SpinnerHost);
  document.body.append(fixture.nativeElement as HTMLElement);
  fixture.detectChanges();
  const spinner = (fixture.nativeElement as HTMLElement).querySelector('ave-spinner');
  if (spinner === null) throw new Error('No spinner');
  return { fixture, spinner };
}

describe('AveSpinner', () => {
  it('shows only once the wait has lasted the spinner delay, as a named progress bar', async () => {
    const { fixture, spinner } = setup();
    const harness = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveSpinnerHarness);
    expect(await harness.isShown()).toBe(false);
    expect(spinner.getAttribute('aria-hidden')).toBe('true');
    expect(spinner.getAttribute('role')).toBeNull();

    fixture.componentInstance.loading.set(true);
    fixture.detectChanges();
    vi.advanceTimersByTime(tokens['timing.spinner-delay'].value - 1);
    fixture.detectChanges();
    expect(await harness.isShown()).toBe(false);
    vi.advanceTimersByTime(1);
    fixture.detectChanges();
    expect(await harness.isShown()).toBe(true);
    expect(spinner.getAttribute('role')).toBe('progressbar');
    expect(spinner.getAttribute('aria-hidden')).toBeNull();
    expect(await harness.getLabel()).toBe('Loading…');
    expect(spinner.querySelector('ave-icon.ave-motion-spin[data-icon="loader-circle"]')).not.toBeNull();
  });

  it('stays its minimum time once shown, and never shows for a quick wait', async () => {
    const { fixture } = setup();
    const harness = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveSpinnerHarness);
    fixture.componentInstance.loading.set(true);
    fixture.detectChanges();
    vi.advanceTimersByTime(tokens['timing.spinner-delay'].value - 100);
    fixture.componentInstance.loading.set(false);
    fixture.detectChanges();
    vi.advanceTimersByTime(1000);
    fixture.detectChanges();
    expect(await harness.isShown()).toBe(false);

    fixture.componentInstance.loading.set(true);
    fixture.detectChanges();
    vi.advanceTimersByTime(tokens['timing.spinner-delay'].value);
    fixture.detectChanges();
    fixture.componentInstance.loading.set(false);
    fixture.detectChanges();
    vi.advanceTimersByTime(tokens['timing.spinner-min-visible'].value - 1);
    fixture.detectChanges();
    expect(await harness.isShown()).toBe(true);
    vi.advanceTimersByTime(1);
    fixture.detectChanges();
    expect(await harness.isShown()).toBe(false);
  });

  it('keeps its icon box whether or not it shows, at every size', async () => {
    const { fixture, spinner } = setup();
    const harness = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveSpinnerHarness);
    const sizes = { sm: 16, md: 20, lg: 24 } as const satisfies Record<AveSpinnerSize, number>;
    for (const [size, px] of Object.entries(sizes) as [AveSpinnerSize, number][]) {
      fixture.componentInstance.size.set(size);
      fixture.componentInstance.loading.set(false);
      fixture.detectChanges();
      const hidden = spinner.getBoundingClientRect();
      fixture.componentInstance.loading.set(true);
      fixture.detectChanges();
      vi.advanceTimersByTime(tokens['timing.spinner-delay'].value);
      fixture.detectChanges();
      const shown = spinner.getBoundingClientRect();
      expect(await harness.getSize()).toBe(size);
      expect([hidden.width, hidden.height]).toEqual([px, px]);
      expect([shown.width, shown.height]).toEqual([px, px]);
      expect(spinner.querySelector('ave-icon')?.getAttribute('data-size')).toBe(size);
      fixture.componentInstance.loading.set(false);
      vi.advanceTimersByTime(tokens['timing.spinner-min-visible'].value);
      fixture.detectChanges();
    }
  });

  it('is named by its label, or by the locale’s "Loading…"; loading is true by default', async () => {
    const { fixture } = setup('ru');
    vi.advanceTimersByTime(tokens['timing.spinner-delay'].value);
    fixture.detectChanges();
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const [bound, standalone] = await loader.getAllHarnesses(AveSpinnerHarness);
    expect(await standalone?.isShown()).toBe(true);
    expect(await standalone?.getLabel()).toBe('Загрузка…');
    expect(await bound?.getLabel()).toBe('');
    fixture.componentInstance.label.set('Загрузка договоров');
    fixture.componentInstance.loading.set(true);
    fixture.detectChanges();
    vi.advanceTimersByTime(tokens['timing.spinner-delay'].value);
    fixture.detectChanges();
    expect(await bound?.getLabel()).toBe('Загрузка договоров');
    expect(await loader.getAllHarnesses(AveSpinnerHarness.with({ shown: true }))).toHaveLength(2);
  });

  it('rejects a size it does not know', async () => {
    const { fixture, spinner } = setup();
    const harness = await TestbedHarnessEnvironment.loader(fixture).getHarness(
      AveSpinnerHarness.with({ shown: false }),
    );
    spinner.setAttribute('data-size', 'xl');
    await expect(harness.getSize()).rejects.toThrow('unexpected data-size "xl"');
  });
});
