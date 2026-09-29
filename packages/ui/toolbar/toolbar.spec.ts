import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { lucideCopy, lucideEllipsis, lucidePencil, lucideTrash } from '@avelune/icons/lucide';
import { tokens, type TokenName } from '@avelune/tokens';
import { AveButton, AveIconButton } from '@avelune/ui/button';
import { provideAveIcons } from '@avelune/ui/icon';
import { AveMenu, type AveMenuEntry } from '@avelune/ui/menu';
import { AveMenuHarness } from '@avelune/ui/menu/testing';
import { AveToolbar, AveToolbarItem, AveToolbarSeparator } from '@avelune/ui/toolbar';
import { AveToolbarHarness } from '@avelune/ui/toolbar/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';

@Component({
  selector: 'ave-toolbar-host',
  imports: [AveButton, AveIconButton, AveMenu, AveToolbar, AveToolbarItem, AveToolbarSeparator],
  providers: [provideAveIcons([lucideCopy, lucideEllipsis, lucidePencil, lucideTrash])],
  template: `
    <button type="button" id="before">Before</button>
    <div aveToolbar label="Действия с договором" class="bar">
      <button aveButton aveToolbarItem variant="ghost" type="button" (click)="pressed.set('edit')">Изменить</button>
      <button aveButton aveToolbarItem variant="ghost" type="button" [disabled]="locked()" disabledInteractive>
        Отправить
      </button>
      <span aveToolbarSeparator></span>
      <button
        aveIconButton
        aveToolbarItem
        variant="ghost"
        type="button"
        icon="copy"
        label="Дублировать"
        (click)="pressed.set('copy')"
      ></button>
      <ave-menu label="Ещё" icon="ellipsis" variant="ghost" [items]="more" (itemSelected)="pressed.set($event)" />
    </div>
    <button type="button" id="after">After</button>
  `,
})
class ToolbarHost {
  readonly locked = signal(true);
  readonly pressed = signal('');
  readonly more: readonly AveMenuEntry<string>[] = [
    { value: 'rename', label: 'Переименовать', icon: 'pencil' },
    { value: 'delete', label: 'Удалить', icon: 'trash', danger: true },
  ];
}

/** A menu with words in a toolbar: its button with a chevron, one of the items. */
@Component({
  selector: 'ave-toolbar-words',
  imports: [AveButton, AveMenu, AveToolbar, AveToolbarItem],
  template: `
    <div aveToolbar label="Выгрузка">
      <button aveButton aveToolbarItem variant="ghost" type="button">Печать</button>
      <ave-menu label="Выгрузить" variant="ghost" [items]="formats" [disabled]="off()" />
    </div>
  `,
})
class ToolbarWords {
  readonly off = signal(false);
  readonly formats: readonly AveMenuEntry<string>[] = [
    { value: 'pdf', label: 'PDF' },
    { value: 'xlsx', label: 'Excel' },
  ];
}

const used = [
  'space.1',
  'space.2',
  'radius.md',
  'radius.lg',
  'border-width.default',
  'control.height.sm',
  'control.height.md',
  'control.padding-inline.md',
  'size.icon.sm',
  'font.label-md',
  'font.body-md',
  'color.border.subtle',
  'color.bg.surface-raised',
] as const satisfies readonly TokenName[];

const root = document.documentElement;

beforeEach(() => {
  for (const name of used) root.style.setProperty(tokens[name].cssVar, tokens[name].css);
  root.style.setProperty('--ave-timing-tooltip-delay', '0ms');
});

afterEach(() => {
  for (const name of used) root.style.removeProperty(tokens[name].cssVar);
  root.style.removeProperty('--ave-timing-tooltip-delay');
});

async function mount(): Promise<{
  fixture: ComponentFixture<ToolbarHost>;
  element: HTMLElement;
  bar: AveToolbarHarness;
}> {
  const fixture = TestBed.createComponent(ToolbarHost);
  const element = fixture.nativeElement as HTMLElement;
  document.body.prepend(element);
  fixture.detectChanges();
  await fixture.whenStable();
  const bar = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveToolbarHarness);
  return { fixture, element, bar };
}

function focused(): string {
  const active = document.activeElement;
  return active?.getAttribute('aria-label') ?? active?.textContent.trim() ?? '';
}

describe('AveToolbar', () => {
  it('is a named toolbar of its items, a separator between groups, the menu one of them', async () => {
    const { element, bar } = await mount();
    expect(await bar.getLabel()).toBe('Действия с договором');
    expect(element.querySelector('[aveToolbar]')?.getAttribute('role')).toBe('toolbar');
    expect(await bar.getItems()).toEqual(['Изменить', 'Отправить', 'Дублировать', 'Ещё']);
    expect(await bar.getDisabledItems()).toEqual(['Отправить']);
    const separator = element.querySelector('[aveToolbarSeparator]');
    expect(separator?.getAttribute('role')).toBe('separator');
    expect(separator?.getAttribute('aria-orientation')).toBe('vertical');
    element.remove();
  });

  it('is one Tab stop whose arrows, Home and End move between the items, the disabled one too', async () => {
    const { element, bar } = await mount();
    element.querySelector<HTMLElement>('#before')?.focus();
    await userEvent.tab();
    expect(focused()).toBe('Изменить');
    await userEvent.keyboard('{ArrowRight}');
    expect(focused()).toBe('Отправить');
    await userEvent.keyboard('{ArrowRight}');
    expect(focused()).toBe('Дублировать');
    await userEvent.keyboard('{ArrowRight}');
    expect(focused()).toBe('Ещё');
    expect(await bar.getActiveItem()).toBe('Ещё');
    await userEvent.keyboard('{ArrowRight}');
    expect(focused()).toBe('Изменить');
    await userEvent.keyboard('{End}');
    expect(focused()).toBe('Ещё');
    await userEvent.keyboard('{Home}');
    expect(focused()).toBe('Изменить');
    // Tab leaves the toolbar at once, and comes back to the item it left.
    await userEvent.keyboard('{ArrowRight}');
    await userEvent.tab();
    expect(focused()).toBe('After');
    await userEvent.tab({ shift: true });
    expect(focused()).toBe('Отправить');
    element.remove();
  });

  it('presses its items, but not a disabled one, and opens the menu from the arrows', async () => {
    const { fixture, element, bar } = await mount();
    await bar.press('Изменить');
    expect(fixture.componentInstance.pressed()).toBe('edit');
    await bar.press('Дублировать');
    expect(fixture.componentInstance.pressed()).toBe('copy');
    await bar.press('Отправить');
    expect(fixture.componentInstance.pressed()).toBe('copy');
    await expect(bar.press('Печать')).rejects.toThrow('no item matches Печать');
    const menu = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveMenuHarness);
    element.querySelector<HTMLElement>('#before')?.focus();
    await userEvent.tab();
    await userEvent.keyboard('{End}');
    await userEvent.keyboard('{ArrowDown}');
    expect(await menu.isOpen()).toBe(true);
    await menu.selectItem('Переименовать');
    expect(fixture.componentInstance.pressed()).toBe('rename');
    expect(focused()).toBe('Ещё');
    element.remove();
  });

  it('lays its items in a row 4px apart that wraps, groups 8px apart around the separator', async () => {
    const { element } = await mount();
    const [edit, send, copy] = [...element.querySelectorAll('[aveToolbarItem]')].map((item) =>
      item.getBoundingClientRect(),
    );
    const separator = element.querySelector('[aveToolbarSeparator]')?.getBoundingClientRect();
    expect((send?.left ?? 0) - (edit?.right ?? 0)).toBe(4);
    expect((separator?.left ?? 0) - (send?.right ?? 0)).toBe(8);
    expect((copy?.left ?? 0) - (separator?.right ?? 0)).toBe(8);
    expect(separator?.width).toBe(1);
    expect(separator?.height).toBe(32);
    const toolbar = element.querySelector<HTMLElement>('[aveToolbar]');
    toolbar?.style.setProperty('inline-size', '160px');
    const tops = new Set(
      [...element.querySelectorAll('[aveToolbarItem]')].map((item) => item.getBoundingClientRect().top),
    );
    expect(tops.size).toBeGreaterThan(1);
    element.remove();
  });

  it('takes a menu with words as an item, and keeps it focusable while disabled', async () => {
    const fixture = TestBed.createComponent(ToolbarWords);
    const element = fixture.nativeElement as HTMLElement;
    document.body.prepend(element);
    fixture.detectChanges();
    await fixture.whenStable();
    const bar = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveToolbarHarness);
    expect(await bar.getItems()).toEqual(['Печать', 'Выгрузить']);
    expect(element.querySelector('ave-menu button ave-icon')?.getAttribute('data-icon')).toBe('chevron-down');
    fixture.componentInstance.off.set(true);
    fixture.detectChanges();
    expect(await bar.getDisabledItems()).toEqual(['Выгрузить']);
    element.querySelector<HTMLElement>('ave-menu button')?.focus();
    expect(focused()).toBe('Выгрузить');
    element.remove();
  });

  it('finds a toolbar by its name', async () => {
    const { fixture, element } = await mount();
    const loader = TestbedHarnessEnvironment.loader(fixture);
    expect(await loader.getAllHarnesses(AveToolbarHarness.with({ label: /договором$/ }))).toHaveLength(1);
    expect(await loader.getAllHarnesses(AveToolbarHarness.with({ label: 'Формат' }))).toHaveLength(0);
    element.remove();
  });
});
