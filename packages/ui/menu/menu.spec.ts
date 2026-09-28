import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { lucideCopy, lucideEllipsis, lucideTrash } from '@avelune/icons/lucide';
import { tokens, type TokenName } from '@avelune/tokens';
import { provideAveIcons } from '@avelune/ui/icon';
import { AveMenu, type AveMenuEntry } from '@avelune/ui/menu';
import { AveMenuHarness } from '@avelune/ui/menu/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';

type Action = 'open' | 'copy' | 'archive' | 'delete';

const actions: readonly AveMenuEntry<Action>[] = [
  { value: 'open', label: 'Открыть' },
  { value: 'copy', label: 'Дублировать', icon: 'copy' },
  { value: 'archive', label: 'В архив', disabled: true },
  { separator: true },
  { value: 'delete', label: 'Удалить', icon: 'trash', danger: true },
];

@Component({
  selector: 'ave-menu-host',
  imports: [AveMenu],
  providers: [provideAveIcons([lucideCopy, lucideEllipsis, lucideTrash])],
  template: `
    <div class="row">
      <ave-menu label="Действия" [items]="actions" [disabled]="disabled()" (itemSelected)="chosen.set($event)" />
      <button type="button" id="outside">Elsewhere</button>
      <ave-menu
        class="end"
        label="Ещё действия"
        icon="ellipsis"
        variant="ghost"
        size="sm"
        [items]="actions"
        (itemSelected)="chosen.set($event)"
      />
    </div>
  `,
})
class MenuHost {
  readonly actions = actions;
  readonly disabled = signal(false);
  readonly chosen = signal<Action | null>(null);
}

const used = [
  'space.1',
  'space.2',
  'space.16',
  'container.xs',
  'radius.md',
  'radius.lg',
  'border-width.default',
  'font.body-md',
  'font.label-md',
  'size.icon.sm',
  'control.height.sm',
  'control.height.md',
  'control.padding-inline.sm',
  'control.padding-inline.md',
  'color.bg.surface-raised',
  'color.border.subtle',
  'color.danger.fg',
  'elevation.popover',
] as const satisfies readonly TokenName[];

const root = document.documentElement;
const reset = document.createElement('style');
// The kit's reset (ADR 0030); the second menu at the end of a row as wide as the page.
reset.textContent =
  '*, ::before, ::after { box-sizing: border-box; } .row { display: flex; justify-content: space-between; padding: 16px; }';

beforeEach(() => {
  for (const name of used) root.style.setProperty(tokens[name].cssVar, tokens[name].css);
  root.style.setProperty('--ave-font-body-md-line-height', '20px');
  root.style.setProperty('--ave-timing-tooltip-delay', '0ms');
  document.head.append(reset);
});

afterEach(() => {
  for (const name of used) root.style.removeProperty(tokens[name].cssVar);
  root.style.removeProperty('--ave-font-body-md-line-height');
  root.style.removeProperty('--ave-timing-tooltip-delay');
  reset.remove();
});

function mount(): { fixture: ComponentFixture<MenuHost>; element: HTMLElement } {
  const fixture = TestBed.createComponent(MenuHost);
  const element = fixture.nativeElement as HTMLElement;
  document.body.prepend(element);
  fixture.detectChanges();
  return { fixture, element };
}

function trigger(element: HTMLElement, index = 0): HTMLButtonElement {
  const button = element.querySelectorAll<HTMLButtonElement>('ave-menu button')[index];
  if (button === undefined) throw new Error('No menu button');
  return button;
}

describe('AveMenu', () => {
  it('is a menu button that opens its items in the top layer, labelled by the button', async () => {
    const { fixture, element } = mount();
    const menu = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveMenuHarness.with({ label: 'Действия' }));
    const button = trigger(element);
    // Aria writes `true`, which ARIA reads as a menu.
    expect(button.getAttribute('aria-haspopup')).toBe('true');
    expect(await menu.isOpen()).toBe(false);
    expect(button.querySelector('ave-icon')?.getAttribute('data-icon')).toBe('chevron-down');
    expect(await menu.getItems()).toEqual(['Открыть', 'Дублировать', 'В архив', 'Удалить']);
    expect(await menu.isOpen()).toBe(true);
    expect(await menu.getDisabledItems()).toEqual(['В архив']);
    const panel = document.querySelector<HTMLElement>('.menu[role="menu"]');
    if (panel === null) throw new Error('No menu');
    expect(panel.getAttribute('aria-labelledby')).toBe(button.id);
    expect(panel.closest('[popover]')?.matches(':popover-open')).toBe(true);
    expect(getComputedStyle(panel).borderTopLeftRadius).toBe(tokens['radius.lg'].css);
    expect(panel.getBoundingClientRect().top - button.getBoundingClientRect().bottom).toBe(4);
    expect(panel.getBoundingClientRect().left).toBe(button.getBoundingClientRect().left);
    expect(panel.getBoundingClientRect().width).toBeGreaterThanOrEqual(192);
    expect(panel.querySelector('[role="separator"]')).not.toBeNull();
    const danger = panel.querySelector('[data-danger]');
    expect(danger?.textContent.trim()).toBe('Удалить');
    expect(getComputedStyle(danger ?? panel).color).not.toBe(getComputedStyle(panel).color);
    const item = panel.querySelector('[role="menuitem"]')?.getBoundingClientRect();
    expect(item?.height).toBe(36);
  });

  it('opens from the keyboard on its first item, moves with the arrows, and chooses with Enter', async () => {
    const { fixture, element } = mount();
    const menu = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveMenuHarness.with({ label: 'Действия' }));
    const button = trigger(element);
    button.focus();
    await userEvent.keyboard('{ArrowDown}');
    await fixture.whenStable();
    expect(await menu.isOpen()).toBe(true);
    expect(document.activeElement?.textContent.trim()).toBe('Открыть');
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement?.textContent.trim()).toBe('Дублировать');
    await userEvent.keyboard('{Enter}');
    await fixture.whenStable();
    expect(fixture.componentInstance.chosen()).toBe('copy');
    expect(await menu.isOpen()).toBe(false);
    expect(document.activeElement).toBe(button);

    await userEvent.keyboard('{ArrowDown}');
    await fixture.whenStable();
    await userEvent.keyboard('{Escape}');
    await fixture.whenStable();
    expect(await menu.isOpen()).toBe(false);
    expect(document.activeElement).toBe(button);
  });

  it('chooses an item with a click, never a disabled one, and closes on a press outside', async () => {
    const { fixture, element } = mount();
    const menu = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveMenuHarness.with({ label: 'Действия' }));
    await menu.selectItem('В архив');
    expect(fixture.componentInstance.chosen()).toBeNull();
    await menu.selectItem(/Удал/);
    await fixture.whenStable();
    expect(fixture.componentInstance.chosen()).toBe('delete');
    expect(await menu.isOpen()).toBe(false);
    await expect(menu.selectItem('Нет такого')).rejects.toThrow('no item matches Нет такого');

    await menu.open();
    await userEvent.click(element.querySelector('#outside') ?? element);
    await fixture.whenStable();
    expect(await menu.isOpen()).toBe(false);
    await menu.open();
    await menu.close();
    expect(await menu.isOpen()).toBe(false);
    await menu.close();
  });

  it('draws an icon alone as a ghost IconButton named and titled by its label, its menu ending at its end', async () => {
    const { fixture, element } = mount();
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const more = await loader.getHarness(AveMenuHarness.with({ label: 'Ещё действия' }));
    const button = trigger(element, 1);
    expect(button.hasAttribute('aveIconButton')).toBe(true);
    expect(button.getAttribute('data-variant')).toBe('ghost');
    expect(button.getBoundingClientRect().height).toBe(32);
    await more.open();
    await fixture.whenStable();
    const panel = document.querySelector<HTMLElement>('.menu[role="menu"]');
    expect(panel?.getBoundingClientRect().right).toBe(button.getBoundingClientRect().right);
    await more.close();
    button.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }));
    await fixture.whenStable();
    expect(document.querySelector('ave-tooltip-panel')?.textContent.trim()).toBe('Ещё действия');
  });

  it('cannot open while disabled', async () => {
    const { fixture } = mount();
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();
    const menu = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveMenuHarness.with({ label: 'Действия' }));
    expect(await menu.isDisabled()).toBe(true);
  });
});
