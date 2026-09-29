import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { lucidePaperclip } from '@avelune/icons/lucide';
import { tokens, type TokenName } from '@avelune/tokens';
import { provideAveIcons } from '@avelune/ui/icon';
import { AveTab, AveTabs } from '@avelune/ui/tabs';
import { AveTabsHarness } from '@avelune/ui/tabs/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';

@Component({
  selector: 'ave-tabs-host',
  imports: [AveTab, AveTabs],
  providers: [provideAveIcons([lucidePaperclip])],
  template: `
    <div class="frame">
      <ave-tabs label="Разделы договора" [(selected)]="selected">
        <ave-tab value="facts" label="Сведения"><p>Контрагент и сумма</p></ave-tab>
        <ave-tab value="files" label="Файлы" icon="paperclip"><p>Договор.pdf</p></ave-tab>
        <ave-tab value="history" label="История" [disabled]="historyDisabled()"><p>Создан черновик</p></ave-tab>
        @if (more()) {
          <ave-tab value="links" label="Связанные документы министерств и ведомств"><p>Нет связей</p></ave-tab>
        }
      </ave-tabs>
    </div>
  `,
})
class TabsHost {
  readonly selected = signal<string | undefined>(undefined);
  readonly historyDisabled = signal(true);
  readonly more = signal(false);
}

const used = [
  'space.1',
  'space.2',
  'space.4',
  'border-width.default',
  'border-width.selected',
  'control.height.lg',
  'control.padding-inline.sm',
  'font.label-md',
  'size.icon.sm',
  'color.fg.default',
  'color.fg.muted',
  'color.fg.disabled',
  'color.border.subtle',
  'color.border.default',
  'color.accent.bg',
  'easing.standard',
] as const satisfies readonly TokenName[];

const root = document.documentElement;
const reset = document.createElement('style');
// The kit's reset (ADR 0030); a frame as wide as a phone's content.
reset.textContent = '*, ::before, ::after { box-sizing: border-box; } .frame { inline-size: 640px; }';

beforeEach(() => {
  for (const name of used) root.style.setProperty(tokens[name].cssVar, tokens[name].css);
  // The slide and the hover colour at once, so a test reads where things end.
  root.style.setProperty('--ave-timing-slide', '0ms');
  root.style.setProperty('--ave-duration-instant', '0ms');
  document.head.append(reset);
});

afterEach(() => {
  for (const name of used) root.style.removeProperty(tokens[name].cssVar);
  root.style.removeProperty('--ave-timing-slide');
  root.style.removeProperty('--ave-duration-instant');
  reset.remove();
});

async function mount(): Promise<{ fixture: ComponentFixture<TabsHost>; element: HTMLElement; tabs: AveTabsHarness }> {
  const fixture = TestBed.createComponent(TabsHost);
  const element = fixture.nativeElement as HTMLElement;
  document.body.prepend(element);
  fixture.detectChanges();
  await fixture.whenStable();
  const tabs = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveTabsHarness);
  return { fixture, element, tabs };
}

function tab(element: HTMLElement, index: number): HTMLElement {
  const found = element.querySelectorAll<HTMLElement>('[role="tab"]')[index];
  if (found === undefined) throw new Error(`No tab ${String(index)}`);
  return found;
}

/** The indicator's box, once the browser has placed it. */
async function indicatorBox(element: HTMLElement): Promise<DOMRect> {
  await new Promise((resolve) => requestAnimationFrame(resolve));
  const indicator = element.querySelector('.indicator');
  if (indicator === null) throw new Error('No indicator');
  return indicator.getBoundingClientRect();
}

describe('AveTabs', () => {
  it('is a named tab list whose tabs control their panels, the first enabled one chosen', async () => {
    const { fixture, element, tabs } = await mount();
    expect(await tabs.getLabel()).toBe('Разделы договора');
    expect(await tabs.getTabs()).toEqual(['Сведения', 'Файлы', 'История']);
    expect(await tabs.getSelected()).toBe('Сведения');
    expect(fixture.componentInstance.selected()).toBe('facts');
    expect(await tabs.getPanelText()).toBe('Контрагент и сумма');
    expect(await tabs.getDisabled()).toEqual(['История']);
    const first = tab(element, 0);
    const panel = document.getElementById(first.getAttribute('aria-controls') ?? '');
    expect(panel?.getAttribute('role')).toBe('tabpanel');
    expect(panel?.getAttribute('aria-labelledby')).toBe(first.id);
    // Hidden panels are out of the page and of the accessibility tree.
    const hidden = element.querySelectorAll<HTMLElement>('[role="tabpanel"][inert]');
    expect(hidden).toHaveLength(2);
    expect([...hidden].every((one) => getComputedStyle(one).display === 'none')).toBe(true);
    expect(tab(element, 1).querySelector('ave-icon')?.getAttribute('data-icon')).toBe('paperclip');
    element.remove();
  });

  it('chooses a tab with a click and with the arrows, and skips none', async () => {
    const { fixture, element, tabs } = await mount();
    await tabs.select('Файлы');
    expect(fixture.componentInstance.selected()).toBe('files');
    expect(await tabs.getPanelText()).toBe('Договор.pdf');
    expect(tab(element, 1)).toBe(document.activeElement);
    // The disabled tab takes focus but is not chosen; the arrows wrap.
    await userEvent.keyboard('{ArrowRight}');
    expect(tab(element, 2)).toBe(document.activeElement);
    expect(await tabs.getSelected()).toBe('Файлы');
    await userEvent.keyboard('{ArrowRight}');
    expect(await tabs.getSelected()).toBe('Сведения');
    await userEvent.keyboard('{End}');
    expect(tab(element, 2)).toBe(document.activeElement);
    await userEvent.keyboard('{Home}');
    expect(fixture.componentInstance.selected()).toBe('facts');
    // One Tab stop: the chosen tab; the next is the panel.
    expect(tab(element, 0).tabIndex).toBe(0);
    expect(tab(element, 1).tabIndex).toBe(-1);
    await expect(tabs.select('Отчёты')).rejects.toThrow('no tab matches Отчёты');
    element.remove();
  });

  it('follows the page choosing a tab, and falls back to the first when the choice is gone', async () => {
    const { fixture, element, tabs } = await mount();
    fixture.componentInstance.historyDisabled.set(false);
    fixture.componentInstance.selected.set('history');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(await tabs.getSelected()).toBe('История');
    expect(await tabs.getPanelText()).toBe('Создан черновик');
    fixture.componentInstance.selected.set('reports');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.selected()).toBe('facts');
    element.remove();
  });

  it('draws the chosen tab over an accent bar that covers the list’s line, and slides it to the next', async () => {
    const { element, tabs } = await mount();
    const line = element.querySelector<HTMLElement>('.bar');
    if (line === null) throw new Error('No tabs');
    const first = tab(element, 0).getBoundingClientRect();
    expect(first.height).toBe(40);
    let bar = await indicatorBox(element);
    expect(bar.left).toBeCloseTo(first.left, 1);
    expect(bar.width).toBeCloseTo(first.width, 1);
    expect(bar.height).toBe(2);
    // The bar's bottom is the line's: it covers the 1px line under the tabs.
    expect(bar.bottom).toBeCloseTo(line.getBoundingClientRect().bottom, 1);
    expect(getComputedStyle(line).borderBottomWidth).toBe('1px');
    expect(element.querySelector('[role="tablist"]')?.hasAttribute('data-slide')).toBe(false);

    await tabs.select('Файлы');
    const second = tab(element, 1).getBoundingClientRect();
    await vi.waitFor(async () => {
      bar = await indicatorBox(element);
      expect(bar.left).toBeCloseTo(second.left, 1);
      expect(bar.width).toBeCloseTo(second.width, 1);
    });
    const list = element.querySelector<HTMLElement>('[role="tablist"]');
    expect(list?.hasAttribute('data-slide')).toBe(true);
    expect(getComputedStyle(element.querySelector('.indicator') ?? line).transitionProperty).toBe('translate, scale');
    // The chosen tab's words in the text colour, the others muted; the bars 4px apart.
    expect(getComputedStyle(tab(element, 1)).color).not.toBe(getComputedStyle(tab(element, 0)).color);
    expect(second.left - first.right).toBe(4);
    element.remove();
  });

  it('scrolls a list wider than its container sideways, without wrapping a label or the page', async () => {
    const { fixture, element, tabs } = await mount();
    element.querySelector<HTMLElement>('.frame')?.style.setProperty('inline-size', '280px');
    fixture.componentInstance.more.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    const list = element.querySelector<HTMLElement>('[role="tablist"]');
    if (list === null) throw new Error('No list');
    expect(list.scrollWidth).toBeGreaterThan(list.clientWidth);
    expect(new Set([...list.querySelectorAll('[role="tab"]')].map((one) => one.getBoundingClientRect().top)).size).toBe(
      1,
    );
    await tabs.select(/^Связанные/);
    const last = tab(element, 3);
    // The list scrolls to show the chosen tab, from its start when it is wider than the list, and the bar follows.
    await vi.waitFor(async () => {
      expect(Math.abs(last.getBoundingClientRect().left - list.getBoundingClientRect().left)).toBeLessThanOrEqual(1);
      const bar = await indicatorBox(element);
      expect(bar.left).toBeCloseTo(last.getBoundingClientRect().left, 1);
    });
    expect(list.scrollLeft).toBeGreaterThan(0);
    // A tab that fits is shown whole: back to the second one, which the scroll had hidden.
    await tabs.select('Файлы');
    const second = tab(element, 1);
    await vi.waitFor(() => {
      expect(second.getBoundingClientRect().left).toBeGreaterThanOrEqual(list.getBoundingClientRect().left - 1);
      expect(second.getBoundingClientRect().right).toBeLessThanOrEqual(list.getBoundingClientRect().right + 1);
    });
    element.remove();
  });

  it('measures the bar again once hidden tabs are shown, and slides it after a press', async () => {
    const frame = document.createElement('style');
    frame.textContent = '.frame { display: none; }';
    document.head.append(frame);
    const { element } = await mount();
    const host = element.querySelector<HTMLElement>('ave-tabs');
    expect(host?.style.getPropertyValue('--ave-tabs-indicator-scale')).toBe('0');
    frame.remove();
    const first = tab(element, 0);
    await vi.waitFor(async () => {
      const bar = await indicatorBox(element);
      expect(bar.width).toBeCloseTo(first.getBoundingClientRect().width, 1);
    });
    const list = element.querySelector('[role="tablist"]');
    expect(list?.hasAttribute('data-slide')).toBe(false);
    await userEvent.click(tab(element, 1));
    await vi.waitFor(() => {
      expect(list?.hasAttribute('data-slide')).toBe(true);
    });
    element.remove();
  });

  it('finds tabs by the name of their list', async () => {
    const { fixture, element } = await mount();
    const loader = TestbedHarnessEnvironment.loader(fixture);
    expect(await loader.getAllHarnesses(AveTabsHarness.with({ label: /договора$/ }))).toHaveLength(1);
    expect(await loader.getAllHarnesses(AveTabsHarness.with({ label: 'Отчёты' }))).toHaveLength(0);
    element.remove();
  });
});
