import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { FormField, disabled, form } from '@angular/forms/signals';
import { tokens, type TokenName } from '@avelune/tokens';
import { AveChoice } from '@avelune/ui/checkbox';
import { AveSwitch } from '@avelune/ui/switch';
import { AveSwitchHarness } from '@avelune/ui/switch/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

@Component({
  selector: 'ave-switch-signal',
  imports: [AveChoice, AveSwitch, FormField],
  template: `<label aveChoice><input type="checkbox" aveSwitch [formField]="settings.notices" /> Email notices</label>`,
})
class SignalHost {
  readonly model = signal({ notices: false, locked: false });
  // `context.valueOf`: see the angular-eslint note in the input specs.
  readonly settings = form(this.model, (path) => {
    disabled(path.notices, { when: (context) => context.valueOf(path.locked) });
  });
}

@Component({
  selector: 'ave-switch-reactive',
  imports: [AveChoice, AveSwitch, ReactiveFormsModule],
  template: `
    <label aveChoice><input type="checkbox" aveSwitch [formControl]="compact" /> Compact tables</label>
    <input type="checkbox" aveSwitch aria-label="Invalid" aria-invalid="true" />
    <input type="checkbox" aveSwitch />
  `,
})
class ReactiveHost {
  readonly compact = new FormControl(true, { nonNullable: true });
}

const used = [
  'size.icon.sm',
  'size.target.min',
  'space.1',
  'border-width.default',
  'radius.full',
  'color.border.strong',
  'color.accent.bg',
  'color.fg.on-accent',
  'color.danger.border',
  'color.bg.surface',
] as const satisfies readonly TokenName[];

const root = document.documentElement;
const reset = document.createElement('style');
// The kit's reset (ADR 0030): a native checkbox is content-box without it.
reset.textContent = '*, ::before, ::after { box-sizing: border-box; }';

beforeEach(() => {
  for (const name of used) root.style.setProperty(tokens[name].cssVar, tokens[name].css);
  // The slide as it is under reduced motion, so the thumb is where it ends at once.
  root.style.setProperty('--ave-timing-slide', '0ms');
  document.head.append(reset);
});

afterEach(() => {
  for (const name of used) root.style.removeProperty(tokens[name].cssVar);
  root.style.removeProperty('--ave-timing-slide');
  reset.remove();
});

function mount<T>(type: new () => T): { fixture: ComponentFixture<T>; element: HTMLElement } {
  const fixture = TestBed.createComponent(type);
  const element = fixture.nativeElement as HTMLElement;
  document.body.append(element);
  fixture.detectChanges();
  return { fixture, element };
}

/** `#rrggbb` → `rgb(r, g, b)`, as computed styles report colours. */
function rgb(hex: string): string {
  const [r, g, b] = [1, 3, 5].map((start) => Number.parseInt(hex.slice(start, start + 2), 16));
  return `rgb(${String(r)}, ${String(g)}, ${String(b)})`;
}

describe('AveSwitch', () => {
  it('is a switch: a 40 × 24 track whose 16px thumb sits 4px from the edge and moves 16px when on', async () => {
    const { fixture, element } = mount(ReactiveHost);
    const [on, invalid] = [...element.querySelectorAll('input')];
    if (on === undefined || invalid === undefined) throw new Error('No switches');
    expect(on.getAttribute('role')).toBe('switch');
    const track = invalid.getBoundingClientRect();
    expect([track.width, track.height]).toEqual([40, 24]);
    expect(getComputedStyle(invalid).borderTopColor).toBe(rgb(tokens['color.danger.border'].css));
    expect(getComputedStyle(on).backgroundColor).toBe(rgb(tokens['color.accent.bg'].css));
    expect(getComputedStyle(on, '::before').backgroundColor).toBe(rgb(tokens['color.fg.on-accent'].css));
    expect(getComputedStyle(invalid, '::before').translate).toBe('none');
    expect(getComputedStyle(on, '::before').translate).toBe('16px');
    expect(getComputedStyle(on, '::before').marginInlineStart).toBe('3px');
    const label = element.querySelector('label')?.getBoundingClientRect();
    expect(label?.height).toBe(24);
    await fixture.whenStable();
  });

  it('slides its thumb only once the person has toggled it', async () => {
    root.style.setProperty('--ave-timing-slide', tokens['timing.slide'].css);
    const { fixture, element } = mount(ReactiveHost);
    const input = element.querySelector('input');
    if (input === null) throw new Error('No switch');
    expect(getComputedStyle(input, '::before').transitionDuration).toBe('0s');
    await (await TestbedHarnessEnvironment.loader(fixture).getHarness(AveSwitchHarness.with({ on: true }))).toggle();
    expect(input.hasAttribute('data-toggled')).toBe(true);
    expect(getComputedStyle(input, '::before').transitionDuration).toBe('0.12s');
    expect(getComputedStyle(input, '::before').transitionProperty).toBe('translate');
  });

  it('binds a Signal Forms boolean, and is disabled from the schema', async () => {
    const { fixture } = mount(SignalHost);
    const notices = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveSwitchHarness);
    expect(await notices.getLabel()).toBe('Email notices');
    expect(await notices.isOn()).toBe(false);
    await notices.turnOn();
    expect(fixture.componentInstance.model().notices).toBe(true);
    await notices.turnOn();
    expect(await notices.isOn()).toBe(true);
    await notices.turnOff();
    await notices.turnOff();
    expect(fixture.componentInstance.model().notices).toBe(false);
    fixture.componentInstance.model.update((model) => ({ ...model, locked: true }));
    expect(await notices.isDisabled()).toBe(true);
  });

  it('binds a Reactive Forms control, and filters by label and state', async () => {
    const { fixture } = mount(ReactiveHost);
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const compact = await loader.getHarness(AveSwitchHarness.with({ on: true }));
    expect(await compact.getLabel()).toBe('Compact tables');
    await compact.toggle();
    expect(fixture.componentInstance.compact.value).toBe(false);
    await compact.blur();
    expect(await compact.isInvalid()).toBe(false);
    expect(await (await loader.getHarness(AveSwitchHarness.with({ label: 'Invalid' }))).isInvalid()).toBe(true);
    const [, , unnamed] = await loader.getAllHarnesses(AveSwitchHarness);
    expect(await unnamed?.getLabel()).toBe('');
  });
});
