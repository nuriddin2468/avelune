import { Component, DestroyRef, inject, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { tokens, type TokenName } from '@avelune/tokens';
import { AveTooltip, type AveTooltipSide } from '@avelune/ui/tooltip';
import { AveTooltipHarness } from '@avelune/ui/tooltip/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';

@Component({
  selector: 'ave-tooltip-host',
  imports: [AveTooltip],
  template: `
    <div class="frame">
      @if (shown()) {
        <button type="button" id="export" [aveTooltip]="text()" [aveTooltipSide]="side()">Export</button>
      }
      <button type="button" id="named" aria-label="Delete" aveTooltip="Delete">×</button>
    </div>
  `,
})
class TooltipHost {
  readonly text = signal('Выгрузить реестр в Excel');
  readonly side = signal<AveTooltipSide>('top');
  readonly shown = signal(true);
  readonly heard = signal(0);

  constructor() {
    // Whether a key reaches the page after the tooltip had its turn.
    const heard = (): void => {
      this.heard.set(this.heard() + 1);
    };
    document.addEventListener('keydown', heard);
    inject(DestroyRef).onDestroy(() => {
      document.removeEventListener('keydown', heard);
    });
  }
}

const used = [
  'space.1',
  'space.2',
  'radius.md',
  'border-width.default',
  'font.body-sm',
  'container.xs',
  'color.bg.tooltip',
  'color.fg.on-tooltip',
  'elevation.popover',
] as const satisfies readonly TokenName[];

const root = document.documentElement;
const reset = document.createElement('style');
// The kit's reset (ADR 0030), and room above the buttons for a tooltip on top.
reset.textContent = '*, ::before, ::after { box-sizing: border-box; } .frame { padding: 80px; }';

beforeEach(() => {
  for (const name of used) root.style.setProperty(tokens[name].cssVar, tokens[name].css);
  root.style.setProperty('--ave-timing-tooltip-delay', '0ms');
  document.head.append(reset);
});

afterEach(() => {
  for (const name of used) root.style.removeProperty(tokens[name].cssVar);
  root.style.removeProperty('--ave-timing-tooltip-delay');
  reset.remove();
});

function mount(): { fixture: ComponentFixture<TooltipHost>; element: HTMLElement; button: HTMLButtonElement } {
  const fixture = TestBed.createComponent(TooltipHost);
  const element = fixture.nativeElement as HTMLElement;
  document.body.prepend(element);
  fixture.detectChanges();
  const button = element.querySelector<HTMLButtonElement>('#export');
  if (button === null) throw new Error('No button');
  return { fixture, element, button };
}

/** `#rrggbb` → `rgb(r, g, b)`, as computed styles report colours. */
function rgb(hex: string): string {
  const [r, g, b] = [1, 3, 5].map((start) => Number.parseInt(hex.slice(start, start + 2), 16));
  return `rgb(${String(r)}, ${String(g)}, ${String(b)})`;
}

describe('AveTooltip', () => {
  it('describes its element with its text, unless the text is already its name', () => {
    const { element, button } = mount();
    const described = document.getElementById(button.getAttribute('aria-describedby') ?? '');
    expect(described?.textContent).toBe('Выгрузить реестр в Excel');
    expect(element.querySelector('#named')?.hasAttribute('aria-describedby')).toBe(false);
  });

  it('shows above its element after the pointer rests on it, 8px away, in the tooltip colours', async () => {
    const { fixture, button } = mount();
    const tooltip = await TestbedHarnessEnvironment.loader(fixture).getHarness(
      AveTooltipHarness.with({ selector: '#export' }),
    );
    expect(await tooltip.isOpen()).toBe(false);
    await tooltip.show();
    expect(await tooltip.isOpen()).toBe(true);
    expect(await tooltip.getText()).toBe('Выгрузить реестр в Excel');
    expect(await tooltip.getSide()).toBe('top');
    const panel = document.querySelector('ave-tooltip-panel');
    const bubble = panel?.querySelector('.bubble');
    if (!(panel instanceof HTMLElement) || !(bubble instanceof HTMLElement)) throw new Error('No tooltip');
    expect(panel.getAttribute('aria-hidden')).toBe('true');
    expect(panel.classList.contains('ave-motion-tooltip-enter')).toBe(true);
    expect(button.getBoundingClientRect().top - bubble.getBoundingClientRect().bottom).toBe(8);
    const middle = (rect: DOMRect) => rect.left + rect.width / 2;
    expect(Math.abs(middle(bubble.getBoundingClientRect()) - middle(button.getBoundingClientRect()))).toBeLessThan(1);
    expect(getComputedStyle(bubble).backgroundColor).toBe(rgb(tokens['color.bg.tooltip'].css));
    expect(getComputedStyle(bubble).color).toBe(rgb(tokens['color.fg.on-tooltip'].css));

    await tooltip.hide();
    expect(await tooltip.isOpen()).toBe(false);
    expect(document.querySelector('ave-tooltip-panel')).toBeNull();
  });

  it('shows at once on keyboard focus, hides on blur, on a press and on Escape before anyone else hears it', async () => {
    const { fixture, button } = mount();
    const tooltip = await TestbedHarnessEnvironment.loader(fixture).getHarness(
      AveTooltipHarness.with({ selector: '#export' }),
    );
    await userEvent.keyboard('{Tab}');
    expect(document.activeElement).toBe(button);
    await fixture.whenStable();
    expect(await tooltip.isOpen()).toBe(true);
    await userEvent.keyboard('{Escape}');
    await fixture.whenStable();
    expect(await tooltip.isOpen()).toBe(false);
    // The page heard the Tab, not the Escape that hid the tooltip; the next Escape is its own.
    expect(fixture.componentInstance.heard()).toBe(1);
    await userEvent.keyboard('{Escape}');
    expect(fixture.componentInstance.heard()).toBe(2);

    await tooltip.show();
    button.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    await fixture.whenStable();
    expect(await tooltip.isOpen()).toBe(false);
    await tooltip.show();
    button.blur();
    await fixture.whenStable();
    expect(await tooltip.isOpen()).toBe(false);
  });

  it('stays while the pointer moves onto its text, and hides when it leaves the text', async () => {
    const { fixture, button } = mount();
    const tooltip = await TestbedHarnessEnvironment.loader(fixture).getHarness(
      AveTooltipHarness.with({ selector: '#export' }),
    );
    await tooltip.show();
    const panel = document.querySelector('ave-tooltip-panel');
    if (panel === null) throw new Error('No tooltip');
    button.dispatchEvent(new PointerEvent('pointerleave', { relatedTarget: panel }));
    await fixture.whenStable();
    expect(await tooltip.isOpen()).toBe(true);
    panel.dispatchEvent(new PointerEvent('pointerleave', { relatedTarget: button }));
    await fixture.whenStable();
    expect(await tooltip.isOpen()).toBe(true);
    panel.dispatchEvent(new PointerEvent('pointerleave', { relatedTarget: document.body }));
    await fixture.whenStable();
    expect(await tooltip.isOpen()).toBe(false);
  });

  it('shows on the opposite side without room, never for a touch or an empty text, and goes with its element', async () => {
    const { fixture, button } = mount();
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const tooltip = await loader.getHarness(AveTooltipHarness.with({ selector: '#export' }));
    button.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'touch' }));
    await fixture.whenStable();
    expect(await tooltip.isOpen()).toBe(false);

    reset.textContent = '*, ::before, ::after { box-sizing: border-box; }';
    await tooltip.show();
    expect(await tooltip.getSide()).toBe('bottom');
    expect(await loader.getAllHarnesses(AveTooltipHarness.with({ open: true }))).toHaveLength(1);

    fixture.componentInstance.text.set('');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(await tooltip.isOpen()).toBe(false);
    await tooltip.show();
    expect(await tooltip.isOpen()).toBe(false);

    fixture.componentInstance.text.set('Выгрузить');
    fixture.detectChanges();
    await tooltip.show();
    expect(await tooltip.getText()).toBe('Выгрузить');
    fixture.componentInstance.shown.set(false);
    fixture.detectChanges();
    expect(document.querySelector('ave-tooltip-panel')).toBeNull();
  });

  it('waits for the delay the first time, and shows at once right after another tooltip hid', async () => {
    root.style.setProperty('--ave-timing-tooltip-delay', '150ms');
    const { fixture } = mount();
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const exporting = await loader.getHarness(AveTooltipHarness.with({ selector: '#export' }));
    const named = await loader.getHarness(AveTooltipHarness.with({ selector: '#named' }));
    // Longer than the delay since the tooltips of the tests before.
    await new Promise((resolve) => setTimeout(resolve, 200));
    const start = performance.now();
    await exporting.show();
    expect(performance.now() - start).toBeGreaterThanOrEqual(140);
    await exporting.hide();
    const warm = performance.now();
    await named.show();
    expect(await named.isOpen()).toBe(true);
    expect(performance.now() - warm).toBeLessThan(140);
  });

  it('shows at the start or the end on request, and a second hide while it leaves changes nothing', async () => {
    const { fixture } = mount();
    const tooltip = await TestbedHarnessEnvironment.loader(fixture).getHarness(
      AveTooltipHarness.with({ selector: '#export' }),
    );
    fixture.componentInstance.side.set('end');
    fixture.detectChanges();
    await tooltip.show();
    expect(await tooltip.getSide()).toBe('end');
    const directive = fixture.debugElement.query(By.directive(AveTooltip)).injector.get(AveTooltip);
    directive.hide();
    directive.hide();
    await fixture.whenStable();
    expect(await tooltip.isOpen()).toBe(false);
    expect(await tooltip.getText()).toBe('');
    expect(await tooltip.getSide()).toBeNull();

    fixture.componentInstance.shown.set(false);
    fixture.detectChanges();
    // Room at the start for the whole text.
    reset.textContent = '*, ::before, ::after { box-sizing: border-box; } .frame { padding: 80px 80px 80px 400px; }';
    fixture.componentInstance.side.set('start');
    fixture.componentInstance.shown.set(true);
    fixture.detectChanges();
    const again = await TestbedHarnessEnvironment.loader(fixture).getHarness(
      AveTooltipHarness.with({ selector: '#export' }),
    );
    await again.show();
    expect(await again.getSide()).toBe('start');
  });

  it('comes back while it plays its exit, without leaving, and ignores other keys', async () => {
    // An exit that takes a moment, as the motion catalog's does; the test page has no motion.css.
    const exit = document.createElement('style');
    exit.textContent =
      '@keyframes ave-test-fade { to { opacity: 0; } } .ave-motion-tooltip-exit { animation: ave-test-fade 80ms forwards; }';
    document.head.append(exit);
    const { fixture, button } = mount();
    const tooltip = await TestbedHarnessEnvironment.loader(fixture).getHarness(
      AveTooltipHarness.with({ selector: '#export' }),
    );
    await tooltip.show();
    await userEvent.keyboard('a');
    expect(await tooltip.isOpen()).toBe(true);
    const panel = document.querySelector('ave-tooltip-panel');
    button.dispatchEvent(new PointerEvent('pointerleave', { relatedTarget: document.body }));
    expect(panel?.getAttribute('data-state')).toBe('closing');
    button.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }));
    await fixture.whenStable();
    expect(await tooltip.isOpen()).toBe(true);
    expect(document.querySelector('ave-tooltip-panel')).toBe(panel);
    exit.remove();
  });
});
