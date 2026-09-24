import { Component, PLATFORM_ID, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { tokens, type TokenName } from '@avelune/tokens';
import { AveButton, type AveButtonSize, type AveButtonVariant } from '@avelune/ui/button';
import { AveButtonHarness } from '@avelune/ui/button/testing';
import { AveIcon, provideAveIcons } from '@avelune/ui/icon';
import { lucideDownload } from '@avelune/icons/lucide';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { durationToken } from './delayed-spinner';

const variants = ['primary', 'secondary', 'ghost', 'danger'] as const satisfies readonly AveButtonVariant[];
const sizes = ['sm', 'md', 'lg'] as const satisfies readonly AveButtonSize[];

@Component({
  selector: 'ave-button-host',
  imports: [AveButton, AveIcon],
  providers: [provideAveIcons([lucideDownload])],
  template: `
    <form (submit)="submitted.set(submitted() + 1); $event.preventDefault()">
      <input aria-label="Name" />
      <button
        aveButton
        type="submit"
        [variant]="variant()"
        [size]="size()"
        [disabled]="disabled()"
        [disabledInteractive]="interactive()"
        [loading]="loading()"
        (click)="clicks.set(clicks() + 1)"
      >
        <ave-icon name="download" decorative />
        {{ label() }}
      </button>
    </form>
  `,
})
class ButtonHost {
  readonly variant = signal<AveButtonVariant>('secondary');
  readonly size = signal<AveButtonSize>('md');
  readonly disabled = signal(false);
  readonly interactive = signal(false);
  readonly loading = signal(false);
  readonly label = signal('Save changes');
  readonly clicks = signal(0);
  readonly submitted = signal(0);
}

@Component({
  selector: 'ave-button-defaults',
  imports: [AveButton],
  template: `
    <button aveButton type="button">Cancel</button>
    <button aveButton type="button" disabled disabledInteractive>Send</button>
    <a aveButton href="#target" [disabled]="linkDisabled()" [disabledInteractive]="linkInteractive()">Open</a>
  `,
})
class Defaults {
  readonly linkDisabled = signal(false);
  readonly linkInteractive = signal(false);
}

@Component({
  selector: 'ave-button-row',
  imports: [AveButton],
  template: `
    @for (variant of variants; track variant) {
      <button aveButton type="button" [variant]="variant" [size]="size()">Action</button>
    }
  `,
})
class Row {
  readonly variants = variants;
  readonly size = signal<AveButtonSize>('md');
}

/** The tokens the button reads; the test page has no tokens.css, so the specs set them from the tokens. */
const used = [
  'control.height.sm',
  'control.height.md',
  'control.height.lg',
  'control.padding-inline.sm',
  'control.padding-inline.md',
  'control.padding-inline.lg',
  'border-width.default',
  'radius.md',
  'space.1',
  'space.2',
  'font.label-md',
  'size.icon.sm',
  'color.border.default',
  'color.bg.surface',
  'color.accent.bg',
  'timing.spinner-delay',
  'timing.spinner-min-visible',
] as const satisfies readonly TokenName[];

const root = document.documentElement;

beforeEach(() => {
  for (const name of used) root.style.setProperty(tokens[name].cssVar, tokens[name].css);
});

afterEach(() => {
  for (const name of used) root.style.removeProperty(tokens[name].cssVar);
  vi.useRealTimers();
});

function mount<T>(type: new () => T): { fixture: ComponentFixture<T>; element: HTMLElement } {
  const fixture = TestBed.createComponent(type);
  const element = fixture.nativeElement as HTMLElement;
  document.body.append(element);
  fixture.detectChanges();
  return { fixture, element };
}

function setup() {
  const { fixture, element } = mount(ButtonHost);
  const button = element.querySelector('button');
  if (button === null) throw new Error('No button');
  return { fixture, element, button, loader: TestbedHarnessEnvironment.loader(fixture) };
}

describe('AveButton', () => {
  it('is a secondary medium button by default, with its label and projected icon', async () => {
    const { loader, button } = setup();
    const harness = await loader.getHarness(AveButtonHarness.with({ text: 'Save changes' }));
    expect(await harness.getVariant()).toBe('secondary');
    expect(await harness.getSize()).toBe('md');
    expect(await harness.isDisabled()).toBe(false);
    expect(await harness.isBusy()).toBe(false);
    expect(button.getAttribute('data-state')).toBe('enabled');
    expect(button.querySelector('.content ave-icon[data-icon="download"]')).not.toBeNull();
  });

  it.each(sizes)('draws every variant of size %s in the same box, on the control tokens', async (size) => {
    const { fixture, element } = mount(Row);
    fixture.componentInstance.size.set(size);
    fixture.detectChanges();
    await fixture.whenStable();
    const boxes = [...element.querySelectorAll('button')].map((button) => {
      const style = getComputedStyle(button);
      return {
        height: button.getBoundingClientRect().height,
        border: style.borderTopWidth,
        radius: style.borderTopLeftRadius,
        padding: style.paddingInlineStart,
        font: `${style.fontSize}/${style.lineHeight} ${style.fontWeight}`,
      };
    });
    const [first] = boxes;
    expect(first).toEqual({
      height: tokens[`control.height.${size}`].value,
      border: tokens['border-width.default'].css,
      radius: tokens['radius.md'].css,
      padding: tokens[`control.padding-inline.${size}`].css,
      font: '14px/20px 500',
    });
    for (const box of boxes) expect(box).toEqual(first);
  });

  it.each(sizes)('keeps size %s on its compact height in compact density', async (size) => {
    const { fixture, element } = mount(Row);
    const height = tokens[`control.height.${size}`];
    const padding = tokens[`control.padding-inline.${size}`];
    element.style.setProperty(height.cssVar, height.compact.css);
    element.style.setProperty(padding.cssVar, padding.compact.css);
    fixture.componentInstance.size.set(size);
    fixture.detectChanges();
    await fixture.whenStable();
    for (const button of element.querySelectorAll('button')) {
      expect(button.getBoundingClientRect().height).toBe(height.compact.value);
      expect(getComputedStyle(button).paddingInlineStart).toBe(padding.compact.css);
    }
  });

  it('draws the secondary border and fills primary with the accent', async () => {
    const { fixture, element } = mount(Row);
    await fixture.whenStable();
    const [primary, secondary] = [...element.querySelectorAll('button')];
    if (primary === undefined || secondary === undefined) throw new Error('No buttons');
    expect(getComputedStyle(secondary).borderTopColor).toBe(hexToRgb(tokens['color.border.default'].css));
    expect(getComputedStyle(secondary).backgroundColor).toBe(hexToRgb(tokens['color.bg.surface'].css));
    expect(getComputedStyle(primary).backgroundColor).toBe(hexToRgb(tokens['color.accent.bg'].css));
    expect(getComputedStyle(primary).borderTopColor).toBe('rgba(0, 0, 0, 0)');
  });

  it('wraps a long label and grows, instead of truncating or overflowing', async () => {
    const { fixture, element, button } = setup();
    // The fixture's host is an inline element, which takes no width; a block does.
    element.style.display = 'block';
    element.style.inlineSize = '160px';
    fixture.componentInstance.label.set('Отправить документ на согласование руководителю отдела');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(button.getBoundingClientRect().height).toBeGreaterThan(tokens['control.height.md'].value);
    expect(button.scrollWidth).toBeLessThanOrEqual(button.clientWidth);
    expect(getComputedStyle(button).textOverflow).toBe('clip');
  });

  it('disables a button natively, out of the tab order, and runs no click', async () => {
    const { fixture, loader, button } = setup();
    fixture.componentInstance.disabled.set(true);
    const harness = await loader.getHarness(AveButtonHarness);
    expect(await harness.isDisabled()).toBe(true);
    expect(await harness.isFocusable()).toBe(false);
    expect(button.hasAttribute('disabled')).toBe(true);
    expect(button.getAttribute('aria-disabled')).toBeNull();
    expect(button.getAttribute('data-state')).toBe('disabled');
    button.click();
    expect(fixture.componentInstance.clicks()).toBe(0);
  });

  it('keeps a disabled button focusable with disabledInteractive, and blocks its click, Enter, Space and submit', async () => {
    const { fixture, loader, button, element } = setup();
    fixture.componentInstance.disabled.set(true);
    fixture.componentInstance.interactive.set(true);
    const harness = await loader.getHarness(AveButtonHarness);
    expect(await harness.isDisabled()).toBe(true);
    expect(await harness.isFocusable()).toBe(true);
    expect(button.hasAttribute('disabled')).toBe(false);
    expect(button.getAttribute('aria-disabled')).toBe('true');

    await harness.click();
    await harness.focus();
    expect(await harness.isFocused()).toBe(true);
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    // Enter in a field submits its form through the default button, which is disabled here.
    element.querySelector('input')?.focus();
    await userEvent.keyboard('{Enter}');
    expect(fixture.componentInstance.clicks()).toBe(0);
    expect(fixture.componentInstance.submitted()).toBe(0);
  });

  it('activates an enabled button with the keyboard and submits its form', async () => {
    const { fixture, button, element } = setup();
    button.focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    element.querySelector('input')?.focus();
    await userEvent.keyboard('{Enter}');
    expect(fixture.componentInstance.clicks()).toBe(3);
    expect(fixture.componentInstance.submitted()).toBe(3);
  });

  it('removes a static disabled attribute when disabledInteractive keeps the button focusable', () => {
    const { element } = mount(Defaults);
    const send = element.querySelectorAll('button')[1];
    expect(send?.hasAttribute('disabled')).toBe(false);
    expect(send?.getAttribute('aria-disabled')).toBe('true');
  });

  it('disables a link with aria-disabled, out of the tab order unless interactive, and blocks navigation', async () => {
    const { fixture, element } = mount(Defaults);
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const link = element.querySelector('a');
    if (link === null) throw new Error('No link');
    const open = await loader.getHarness(AveButtonHarness.with({ text: 'Open' }));
    const follow = () => link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

    expect(await open.isDisabled()).toBe(false);
    expect(follow()).toBe(true);

    fixture.componentInstance.linkDisabled.set(true);
    expect(await open.isDisabled()).toBe(true);
    expect(await open.isFocusable()).toBe(false);
    expect(link.hasAttribute('disabled')).toBe(false);
    expect(link.getAttribute('tabindex')).toBe('-1');
    expect(follow()).toBe(false);

    fixture.componentInstance.linkInteractive.set(true);
    expect(await open.isFocusable()).toBe(true);
    expect(link.getAttribute('tabindex')).toBeNull();
    expect(follow()).toBe(false);
  });

  it('is busy at once while loading, blocks activation, and shows the spinner only after its delay', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    const { fixture, loader, button } = setup();
    const harness = await loader.getHarness(AveButtonHarness);
    fixture.componentInstance.loading.set(true);
    fixture.detectChanges();
    expect(await harness.isBusy()).toBe(true);
    expect(await harness.isSpinnerShown()).toBe(false);
    button.click();
    expect(fixture.componentInstance.clicks()).toBe(0);

    vi.advanceTimersByTime(tokens['timing.spinner-delay'].value - 1);
    fixture.detectChanges();
    expect(await harness.isSpinnerShown()).toBe(false);
    vi.advanceTimersByTime(1);
    fixture.detectChanges();
    expect(await harness.isSpinnerShown()).toBe(true);
    expect(button.querySelector('.spinner[data-icon="loader-circle"]')).not.toBeNull();
    expect(button.querySelector('.content')?.textContent.trim()).toBe('Save changes');
    expect(getComputedStyle(button.querySelector('.content') ?? button).opacity).toBe('0');
  });

  it('keeps the spinner for its minimum time after loading ends, and stays busy until then', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    const { fixture, loader } = setup();
    const harness = await loader.getHarness(AveButtonHarness);
    fixture.componentInstance.loading.set(true);
    fixture.detectChanges();
    vi.advanceTimersByTime(tokens['timing.spinner-delay'].value + 100);
    fixture.detectChanges();
    fixture.componentInstance.loading.set(false);
    fixture.detectChanges();
    expect(await harness.isSpinnerShown()).toBe(true);
    expect(await harness.isBusy()).toBe(true);

    vi.advanceTimersByTime(tokens['timing.spinner-min-visible'].value - 101);
    fixture.detectChanges();
    expect(await harness.isSpinnerShown()).toBe(true);
    vi.advanceTimersByTime(1);
    fixture.detectChanges();
    expect(await harness.isSpinnerShown()).toBe(false);
    expect(await harness.isBusy()).toBe(false);
  });

  it('never shows the spinner for a quick action, and hides a spinner shown long enough at once', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    const { fixture, loader } = setup();
    const harness = await loader.getHarness(AveButtonHarness);
    fixture.componentInstance.loading.set(true);
    fixture.detectChanges();
    vi.advanceTimersByTime(tokens['timing.spinner-delay'].value - 50);
    fixture.componentInstance.loading.set(false);
    fixture.detectChanges();
    vi.advanceTimersByTime(1000);
    fixture.detectChanges();
    expect(await harness.isSpinnerShown()).toBe(false);

    fixture.componentInstance.loading.set(true);
    fixture.detectChanges();
    vi.advanceTimersByTime(tokens['timing.spinner-delay'].value + tokens['timing.spinner-min-visible'].value);
    fixture.detectChanges();
    fixture.componentInstance.loading.set(false);
    fixture.detectChanges();
    expect(await harness.isSpinnerShown()).toBe(false);
  });

  it('keeps the spinner when loading resumes during its minimum time', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    const { fixture, loader } = setup();
    const harness = await loader.getHarness(AveButtonHarness);
    fixture.componentInstance.loading.set(true);
    fixture.detectChanges();
    vi.advanceTimersByTime(tokens['timing.spinner-delay'].value);
    fixture.detectChanges();
    fixture.componentInstance.loading.set(false);
    fixture.detectChanges();
    fixture.componentInstance.loading.set(true);
    fixture.detectChanges();
    vi.advanceTimersByTime(5000);
    fixture.detectChanges();
    expect(await harness.isSpinnerShown()).toBe(true);
  });

  it('shows no spinner on a disabled button, and prefers disabled to busy', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    const { fixture, loader, button } = setup();
    const harness = await loader.getHarness(AveButtonHarness);
    fixture.componentInstance.disabled.set(true);
    fixture.componentInstance.loading.set(true);
    fixture.detectChanges();
    vi.advanceTimersByTime(5000);
    fixture.detectChanges();
    expect(await harness.isSpinnerShown()).toBe(false);
    expect(await harness.isBusy()).toBe(false);
    expect(button.getAttribute('data-state')).toBe('disabled');
  });

  it('schedules nothing on the server', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'server' }] });
    const { fixture, loader } = setup();
    const harness = await loader.getHarness(AveButtonHarness);
    fixture.componentInstance.loading.set(true);
    fixture.detectChanges();
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(5000);
    expect(await harness.isSpinnerShown()).toBe(false);
    expect(await harness.isBusy()).toBe(true);
  });

  it('reads duration tokens in ms and s, and 0 when a token is missing', () => {
    root.style.setProperty('--ave-spec-seconds', '0.25s');
    expect(durationToken(root, '--ave-spec-seconds')).toBe(250);
    expect(durationToken(root, '--ave-timing-spinner-delay')).toBe(tokens['timing.spinner-delay'].value);
    expect(durationToken(root, '--ave-spec-missing')).toBe(0);
    root.style.removeProperty('--ave-spec-seconds');
  });
});

describe('AveButtonHarness', () => {
  it('filters by text and variant', async () => {
    const { loader } = setup();
    expect(await loader.getAllHarnesses(AveButtonHarness.with({ text: /save/i }))).toHaveLength(1);
    expect(await loader.getAllHarnesses(AveButtonHarness.with({ variant: 'primary' }))).toHaveLength(0);
    expect(await loader.getAllHarnesses(AveButtonHarness.with({ variant: 'secondary' }))).toHaveLength(1);
  });

  it('rejects a variant or size it does not know', async () => {
    const { loader, button } = setup();
    const harness = await loader.getHarness(AveButtonHarness);
    button.setAttribute('data-variant', 'fancy');
    await expect(harness.getVariant()).rejects.toThrow('unexpected data-variant "fancy"');
    button.setAttribute('data-size', 'xl');
    await expect(harness.getSize()).rejects.toThrow('unexpected data-size "xl"');
  });
});

/** `#rrggbb` → `rgb(r, g, b)`, as computed styles report colours. */
function hexToRgb(hex: string): string {
  const [r, g, b] = [1, 3, 5].map((start) => Number.parseInt(hex.slice(start, start + 2), 16));
  return `rgb(${String(r)}, ${String(g)}, ${String(b)})`;
}
