import { Component, input, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { lucideTrash, lucideX } from '@avelune/icons/lucide';
import { tokens, type TokenName } from '@avelune/tokens';
import { AveIconButton, type AveButtonSize, type AveButtonVariant } from '@avelune/ui/button';
import { AveIconButtonHarness } from '@avelune/ui/button/testing';
import { provideAveIcons } from '@avelune/ui/icon';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const variants = ['primary', 'secondary', 'ghost', 'danger'] as const satisfies readonly AveButtonVariant[];

@Component({
  selector: 'ave-icon-button-host',
  imports: [AveIconButton],
  providers: [provideAveIcons([lucideTrash, lucideX])],
  template: `
    @for (variant of variants; track variant) {
      <button aveIconButton type="button" icon="x" label="Close" [variant]="variant" [size]="size()"></button>
    }
    <button
      aveIconButton
      type="button"
      icon="trash"
      label="Delete row"
      [disabled]="disabled()"
      disabledInteractive
      [loading]="loading()"
      (click)="clicks.set(clicks() + 1)"
    ></button>
    <a aveIconButton href="#top" icon="x" label="Close panel"></a>
  `,
})
class Host {
  readonly variants = variants;
  readonly size = signal<AveButtonSize>('md');
  readonly disabled = signal(false);
  readonly loading = signal(false);
  readonly clicks = signal(0);
}

@Component({
  selector: 'ave-icon-button-unlabelled',
  imports: [AveIconButton],
  providers: [provideAveIcons([lucideX])],
  template: `<button aveIconButton type="button" icon="x" [label]="label()"></button>`,
})
class Unlabelled {
  readonly label = input('');
}

const used = [
  'control.height.sm',
  'control.height.md',
  'control.height.lg',
  'border-width.default',
  'radius.md',
  'size.icon.sm',
  'size.icon.md',
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

function setup() {
  const fixture = TestBed.createComponent(Host);
  const element = fixture.nativeElement as HTMLElement;
  document.body.append(element);
  fixture.detectChanges();
  return { fixture, element, loader: TestbedHarnessEnvironment.loader(fixture) };
}

describe('AveIconButton', () => {
  it('is named by its label, and draws its icon decorative', async () => {
    const { loader } = setup();
    const [close] = await loader.getAllHarnesses(AveIconButtonHarness.with({ label: 'Close' }));
    expect(await close?.getLabel()).toBe('Close');
    expect(await close?.getIcon()).toBe('x');
    const link = await loader.getHarness(AveIconButtonHarness.with({ label: /panel/ }));
    expect(await (await link.host()).getAttribute('href')).toBe('#top');
    expect(await loader.getAllHarnesses(AveIconButtonHarness.with({ variant: 'danger' }))).toHaveLength(1);
  });

  it.each([
    ['sm', 'control.height.sm', 'size.icon.sm'],
    ['md', 'control.height.md', 'size.icon.sm'],
    ['lg', 'control.height.lg', 'size.icon.md'],
  ] as const)(
    'is a square of the control height at %s, in every variant, with its icon size',
    async (size, height, icon) => {
      const { fixture, element } = setup();
      fixture.componentInstance.size.set(size);
      fixture.detectChanges();
      await fixture.whenStable();
      for (const button of [...element.querySelectorAll('button')].slice(0, variants.length)) {
        const box = button.getBoundingClientRect();
        expect([box.width, box.height]).toEqual([tokens[height].value, tokens[height].value]);
        expect(getComputedStyle(button).borderTopLeftRadius).toBe(tokens['radius.md'].css);
        const drawn = button.querySelector('ave-icon')?.getBoundingClientRect();
        expect(drawn?.width).toBe(tokens[icon].value);
        // The icon sits in the middle of the square.
        expect((drawn?.left ?? 0) - box.left).toBe((box.width - (drawn?.width ?? 0)) / 2);
      }
    },
  );

  it('keeps the button states: disabled but focusable, and loading with a spinner of the icon size', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
    const { fixture, loader, element } = setup();
    const remove = await loader.getHarness(AveIconButtonHarness.with({ label: 'Delete row' }));
    const button = await remove.host();
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();
    expect(await remove.isDisabled()).toBe(true);
    expect(await remove.isFocusable()).toBe(true);
    await button.click();
    expect(fixture.componentInstance.clicks()).toBe(0);

    fixture.componentInstance.disabled.set(false);
    fixture.componentInstance.loading.set(true);
    fixture.detectChanges();
    vi.advanceTimersByTime(tokens['timing.spinner-delay'].value);
    fixture.detectChanges();
    expect(await remove.isSpinnerShown()).toBe(true);
    expect(await remove.getLabel()).toBe('Delete row');
    const spinner = element.querySelector('[aria-label="Delete row"] .spinner');
    expect(spinner?.getAttribute('data-size')).toBe('sm');
  });

  it('throws in development without a label', () => {
    const fixture = TestBed.createComponent(Unlabelled);
    expect(() => {
      fixture.detectChanges();
    }).toThrow('<button aveIconButton icon="x">: set a label that says what the button does.');
  });

  it('fails a harness whose icon lost its name', async () => {
    const { loader, element } = setup();
    const [close] = await loader.getAllHarnesses(AveIconButtonHarness.with({ label: 'Close' }));
    element.querySelector('[aria-label="Close"] .content ave-icon')?.removeAttribute('data-icon');
    await expect(close?.getIcon()).rejects.toThrow('the icon has no data-icon');
    element.querySelector('[aria-label="Close"]')?.removeAttribute('aria-label');
    expect(await close?.getLabel()).toBe('');
  });
});
