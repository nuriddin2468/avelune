import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { lucideFileDown, lucideSave } from '@avelune/icons/lucide';
import { tokens, type TokenName } from '@avelune/tokens';
import { provideAveIcons } from '@avelune/ui/icon';
import { AveMenubar, type AveMenubarMenu } from '@avelune/ui/menu';
import { AveMenubarHarness } from '@avelune/ui/menu/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';

type Command = 'save' | 'export' | 'close' | 'undo' | 'redo' | 'field' | 'date';

const menus: readonly AveMenubarMenu<Command>[] = [
  {
    label: 'Файл',
    items: [
      { value: 'save', label: 'Сохранить', icon: 'save' },
      { value: 'export', label: 'Выгрузить в PDF', icon: 'file-down' },
      { separator: true },
      { value: 'close', label: 'Закрыть шаблон' },
    ],
  },
  {
    label: 'Правка',
    items: [
      { value: 'undo', label: 'Отменить' },
      { value: 'redo', label: 'Повторить', disabled: true },
    ],
  },
  {
    label: 'Вставка',
    items: [
      { value: 'field', label: 'Поле контрагента' },
      { value: 'date', label: 'Дата подписания' },
    ],
  },
];

@Component({
  selector: 'ave-menubar-host',
  imports: [AveMenubar],
  providers: [provideAveIcons([lucideFileDown, lucideSave])],
  template: `
    <button type="button" id="before">Before</button>
    <ave-menubar label="Шаблон договора" [menus]="menus()" (itemSelected)="chosen.set($event)" />
    <p id="outside">Текст шаблона</p>
  `,
})
class MenubarHost {
  readonly menus = signal(menus);
  readonly chosen = signal<Command | null>(null);
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
  'control.height.md',
  'control.padding-inline.sm',
  'control.padding-inline.md',
  'color.bg.surface-raised',
  'color.border.subtle',
  'color.bg.hover',
  'color.bg.active',
  'elevation.popover',
] as const satisfies readonly TokenName[];

const root = document.documentElement;

beforeEach(() => {
  for (const name of used) root.style.setProperty(tokens[name].cssVar, tokens[name].css);
  root.style.setProperty('--ave-font-body-md-line-height', '20px');
});

afterEach(() => {
  for (const name of used) root.style.removeProperty(tokens[name].cssVar);
  root.style.removeProperty('--ave-font-body-md-line-height');
});

async function mount(): Promise<{
  fixture: ComponentFixture<MenubarHost>;
  element: HTMLElement;
  bar: AveMenubarHarness;
}> {
  const fixture = TestBed.createComponent(MenubarHost);
  const element = fixture.nativeElement as HTMLElement;
  document.body.prepend(element);
  fixture.detectChanges();
  await fixture.whenStable();
  const bar = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveMenubarHarness);
  return { fixture, element, bar };
}

function top(element: HTMLElement, name: string): HTMLElement {
  const found = [...element.querySelectorAll<HTMLElement>('[role="menubar"] > [role="menuitem"]')].find(
    (item) => item.textContent.trim() === name,
  );
  if (found === undefined) throw new Error(`No menu ${name}`);
  return found;
}

/** The open menu, if any. */
function openMenu(): HTMLElement | null {
  return document.querySelector<HTMLElement>('[role="menu"]');
}

describe('AveMenubar', () => {
  it('is a named menubar whose items open their menus, which are out of the page while closed', async () => {
    const { element, bar } = await mount();
    expect(await bar.getLabel()).toBe('Шаблон договора');
    expect(await bar.getMenus()).toEqual(['Файл', 'Правка', 'Вставка']);
    const file = top(element, 'Файл');
    expect(file.getAttribute('aria-haspopup')).toBe('true');
    expect(file.getAttribute('aria-expanded')).toBe('false');
    expect(openMenu()).toBeNull();
    expect(await bar.getItems('Файл')).toEqual(['Сохранить', 'Выгрузить в PDF', 'Закрыть шаблон']);
    const menu = openMenu();
    if (menu === null) throw new Error('No menu');
    expect(file.getAttribute('aria-expanded')).toBe('true');
    expect(file.getAttribute('aria-controls')).toBe(menu.id);
    expect(menu.getAttribute('aria-labelledby')).toBe(file.id);
    // The menu's popover is inside the bar, right after its item, in the top layer.
    expect(menu.closest('[popover]')?.matches(':popover-open')).toBe(true);
    expect(element.querySelector('[role="menubar"]')?.contains(menu)).toBe(true);
    expect(getComputedStyle(menu).borderTopLeftRadius).toBe(tokens['radius.lg'].css);
    expect(Math.round(menu.getBoundingClientRect().top - file.getBoundingClientRect().bottom)).toBe(4);
    await bar.close('Файл');
    await vi.waitFor(() => {
      expect(menu.isConnected).toBe(false);
    });
    expect(file).toBe(document.activeElement);
    element.remove();
  });

  it('moves along the bar with the arrows, and an open menu follows them', async () => {
    const { element } = await mount();
    element.querySelector<HTMLElement>('#before')?.focus();
    await userEvent.tab();
    expect(document.activeElement).toBe(top(element, 'Файл'));
    await userEvent.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(top(element, 'Правка'));
    await userEvent.keyboard('{ArrowDown}');
    await vi.waitFor(() => {
      expect(openMenu()?.getAttribute('aria-labelledby')).toBe(top(element, 'Правка').id);
    });
    expect(document.activeElement?.textContent.trim()).toBe('Отменить');
    await userEvent.keyboard('{ArrowRight}');
    await vi.waitFor(() => {
      expect(openMenu()?.getAttribute('aria-labelledby')).toBe(top(element, 'Вставка').id);
    });
    expect(document.activeElement?.textContent.trim()).toBe('Поле контрагента');
    await userEvent.keyboard('{Escape}');
    await vi.waitFor(() => {
      expect(openMenu()).toBeNull();
    });
    expect(document.activeElement).toBe(top(element, 'Вставка'));
    element.remove();
  });

  it('emits the chosen item and closes its menu; a disabled item is not chosen', async () => {
    const { fixture, element, bar } = await mount();
    await bar.selectItem('Вставка', 'Дата подписания');
    expect(fixture.componentInstance.chosen()).toBe('date');
    await vi.waitFor(() => {
      expect(openMenu()).toBeNull();
    });
    await bar.selectItem('Правка', 'Повторить');
    expect(fixture.componentInstance.chosen()).toBe('date');
    await expect(bar.selectItem('Файл', 'Печать')).rejects.toThrow('no item of Файл matches Печать');
    await expect(bar.open('Вид')).rejects.toThrow('no menu matches Вид');
    element.remove();
  });

  it('closes its menu on a press outside, and a click on the open item closes it too', async () => {
    const { element, bar } = await mount();
    await bar.open('Файл');
    await userEvent.click(element.querySelector('#outside') ?? element);
    await vi.waitFor(() => {
      expect(openMenu()).toBeNull();
    });
    await bar.open('Правка');
    expect(await bar.isOpen('Правка')).toBe(true);
    await userEvent.click(top(element, 'Правка'));
    await vi.waitFor(() => {
      expect(openMenu()).toBeNull();
    });
    // Opened again, it comes back from out of the page.
    await bar.open('Правка');
    await vi.waitFor(() => {
      expect(openMenu()?.isConnected).toBe(true);
    });
    await bar.close('Правка');
    element.remove();
  });

  it('keeps a menu that opens again while it plays its exit', async () => {
    const motion = document.createElement('style');
    motion.textContent =
      '@keyframes ave-test-out { to { opacity: 0; } } .ave-motion-popover-exit { animation: ave-test-out 300ms; }';
    document.head.append(motion);
    const { element, bar } = await mount();
    await bar.open('Файл');
    const menu = openMenu();
    await bar.close('Файл');
    await vi.waitFor(() => {
      expect(menu?.classList.contains('ave-motion-popover-exit')).toBe(true);
    });
    await userEvent.click(top(element, 'Файл'));
    await new Promise((resolve) => setTimeout(resolve, 400));
    expect(menu?.isConnected).toBe(true);
    expect(menu?.classList.contains('ave-motion-popover-exit')).toBe(false);
    await bar.close('Файл');
    await vi.waitFor(() => {
      expect(menu?.isConnected).toBe(false);
    });
    motion.remove();
    element.remove();
  });

  it('closes its menu when focus leaves the bar, and switches menus under the pointer', async () => {
    const { element, bar } = await mount();
    await bar.open('Файл');
    await userEvent.hover(top(element, 'Правка'));
    await vi.waitFor(() => {
      expect(openMenu()?.getAttribute('aria-labelledby')).toBe(top(element, 'Правка').id);
    });
    await userEvent.tab();
    await vi.waitFor(() => {
      expect(openMenu()).toBeNull();
    });
    expect(element.querySelector('[role="menubar"]')?.contains(document.activeElement)).toBe(false);
    element.remove();
  });

  it('lets the overlay of a menu the bar no longer has go', async () => {
    const { fixture, element, bar } = await mount();
    await bar.open('Вставка');
    fixture.componentInstance.menus.set(menus.slice(0, 2));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(await bar.getMenus()).toEqual(['Файл', 'Правка']);
    await vi.waitFor(() => {
      expect(document.querySelectorAll('.cdk-overlay-popover:popover-open')).toHaveLength(0);
    });
    element.remove();
  });

  it('draws its items as ghost buttons of the control height, the open one on the pressed fill', async () => {
    const { element, bar } = await mount();
    const file = top(element, 'Файл');
    const edit = top(element, 'Правка');
    expect(file.getBoundingClientRect().height).toBe(36);
    expect(Math.round(edit.getBoundingClientRect().left - file.getBoundingClientRect().right)).toBe(4);
    const rest = getComputedStyle(file).backgroundColor;
    await bar.open('Файл');
    expect(getComputedStyle(file).backgroundColor).not.toBe(rest);
    await bar.close('Файл');
    element.remove();
  });

  it('finds a menubar by its name', async () => {
    const { fixture, element } = await mount();
    const loader = TestbedHarnessEnvironment.loader(fixture);
    expect(await loader.getAllHarnesses(AveMenubarHarness.with({ label: /договора$/ }))).toHaveLength(1);
    expect(await loader.getAllHarnesses(AveMenubarHarness.with({ label: 'Отчёт' }))).toHaveLength(0);
    element.remove();
  });
});
