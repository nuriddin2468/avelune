import { Component, LOCALE_ID, PLATFORM_ID, inject } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { tokens, type TokenName } from '@avelune/tokens';
import { AveToaster } from '@avelune/ui/toast';
import { AveToastHarness } from '@avelune/ui/toast/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';

@Component({
  selector: 'ave-toast-host',
  template: `
    <button type="button" id="save">Сохранить</button>
    <dialog id="modal"><button type="button" id="inside">Внутри</button></dialog>
  `,
})
class ToastHost {
  readonly toaster = inject(AveToaster);
}

const used = [
  'space.1',
  'space.2',
  'space.4',
  'space.6',
  'container.xs',
  'container.sm',
  'radius.md',
  'radius.lg',
  'border-width.default',
  'font.body-md',
  'font.label-md',
  'size.icon.sm',
  'size.icon.md',
  'control.height.sm',
  'control.padding-inline.sm',
  'color.fg.default',
  'color.bg.surface-raised',
  'color.border.subtle',
  'color.info.fg',
  'color.success.fg',
  'color.warning.fg',
  'color.danger.fg',
  'elevation.popover',
] as const satisfies readonly TokenName[];

const root = document.documentElement;
const reset = document.createElement('style');
reset.textContent = '*, ::before, ::after { box-sizing: border-box; }';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

beforeEach(() => {
  for (const name of used) root.style.setProperty(tokens[name].cssVar, tokens[name].css);
  root.style.setProperty('--ave-font-body-md-line-height', '20px');
  root.style.setProperty('--ave-timing-toast', '60000ms');
  document.head.append(reset);
});

afterEach(() => {
  for (const name of used) root.style.removeProperty(tokens[name].cssVar);
  root.style.removeProperty('--ave-font-body-md-line-height');
  root.style.removeProperty('--ave-timing-toast');
  reset.remove();
});

function mount(): { fixture: ComponentFixture<ToastHost>; toaster: AveToaster; element: HTMLElement } {
  TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: 'ru' }] });
  const fixture = TestBed.createComponent(ToastHost);
  const element = fixture.nativeElement as HTMLElement;
  document.body.prepend(element);
  fixture.detectChanges();
  return { fixture, toaster: fixture.componentInstance.toaster, element };
}

function region(): HTMLElement {
  const found = document.querySelector<HTMLElement>('ave-toast-region');
  if (found === null) throw new Error('No toast region');
  return found;
}

/** The region's own live element, where the toasts are announced. */
function live(): HTMLElement {
  const found = region().querySelector<HTMLElement>('.cdk-live-announcer-element');
  if (found === null) throw new Error('No live element');
  return found;
}

describe('AveToaster', () => {
  it('shows a toast in a named region at the bottom, 48px tall, announces it, and goes after timing.toast', async () => {
    const { fixture, toaster } = mount();
    root.style.setProperty('--ave-timing-toast', '1000ms');
    toaster.show({ message: 'Документ сохранён', variant: 'success' });
    await fixture.whenStable();
    const loader = TestbedHarnessEnvironment.documentRootLoader(fixture);
    const toast = await loader.getHarness(AveToastHarness);
    expect(await toast.getMessage()).toBe('Документ сохранён');
    expect(await toast.getVariant()).toBe('success');
    expect(await toast.getActionLabel()).toBeNull();

    const host = region();
    expect(host.parentElement).toBe(document.body);
    expect(host.matches(':popover-open')).toBe(true);
    expect(host.getAttribute('role')).toBe('region');
    expect(host.getAttribute('aria-label')).toBe('Уведомления (F8)');
    const box = host.querySelector('[data-ave-toast]')?.getBoundingClientRect();
    expect(box?.height).toBe(48);
    expect(box?.bottom).toBe(window.innerHeight - 16);
    expect(host.querySelector('.icon')?.getAttribute('aria-label')).toBe('Успешно');
    await wait(150);
    expect(live().textContent).toBe('Документ сохранён');
    expect(live().getAttribute('aria-live')).toBe('polite');

    await vi.waitFor(
      async () => {
        expect(await loader.getAllHarnesses(AveToastHarness)).toHaveLength(0);
      },
      { timeout: 3000, interval: 50 },
    );
    await fixture.whenStable();
    expect(host.matches(':popover-open')).toBe(false);
  });

  it('stands 24px from the bottom and the inline end from breakpoint.sm, as wide as its widest toast', async () => {
    await page.viewport(1024, 768);
    try {
      const { fixture, toaster } = mount();
      toaster.show('Документ сохранён');
      toaster.show('Договор ДК-2026/114 с ООО «Альфа Технологии» передан на согласование юристам');
      await fixture.whenStable();
      const host = region();
      const toasts = [...host.querySelectorAll('[data-ave-toast]')].map((toast) => toast.getBoundingClientRect());
      expect(host.getBoundingClientRect().right).toBe(window.innerWidth - 24);
      expect(host.getBoundingClientRect().bottom).toBe(window.innerHeight - 24);
      expect(toasts[0]?.width).toBe(toasts[1]?.width);
      expect(toasts[1]?.width).toBe(480);
      expect(toasts[0]?.bottom).toBe((toasts[1]?.top ?? 0) - 8);
    } finally {
      await page.viewport(414, 896);
    }
  });

  it('shows three at a time, the next as one goes; dismiss() takes a toast off the screen or out of the queue', async () => {
    const { fixture, toaster } = mount();
    const refs = ['Первый', 'Второй', 'Третий', 'Четвёртый', 'Пятый'].map((message) => toaster.show(message));
    await fixture.whenStable();
    const loader = TestbedHarnessEnvironment.documentRootLoader(fixture);
    const messages = async () =>
      Promise.all((await loader.getAllHarnesses(AveToastHarness)).map((toast) => toast.getMessage()));
    expect(await messages()).toEqual(['Первый', 'Второй', 'Третий']);

    refs[3]?.dismiss();
    await (await loader.getHarness(AveToastHarness.with({ message: 'Второй' }))).dismiss();
    await fixture.whenStable();
    expect(await messages()).toEqual(['Первый', 'Третий', 'Пятый']);

    refs[0]?.dismiss();
    refs[0]?.dismiss();
    await fixture.whenStable();
    expect(await messages()).toEqual(['Третий', 'Пятый']);
  });

  it('stops its clock while the pointer is on it, and runs what was left once it leaves', async () => {
    const { fixture, toaster } = mount();
    root.style.setProperty('--ave-timing-toast', '2000ms');
    toaster.show('Документ сохранён');
    await fixture.whenStable();
    const loader = TestbedHarnessEnvironment.documentRootLoader(fixture);
    const message = region().querySelector('.message') ?? region();
    await wait(500);
    await userEvent.hover(message);
    await wait(2000);
    expect(await loader.getAllHarnesses(AveToastHarness)).toHaveLength(1);
    await userEvent.unhover(message);
    const left = performance.now();
    await vi.waitFor(
      async () => {
        expect(await loader.getAllHarnesses(AveToastHarness)).toHaveLength(0);
      },
      { timeout: 3000, interval: 50 },
    );
    // What was left of the 2 seconds, at most 1.5, not the whole time again.
    expect(performance.now() - left).toBeLessThan(1800);
  });

  it('runs its action and closes; announces a warning or an error at once, with the words of its action', async () => {
    const { fixture, toaster } = mount();
    let retried = 0;
    toaster.show({
      message: 'Не удалось сохранить',
      variant: 'danger',
      action: { label: 'Повторить', run: () => (retried += 1) },
    });
    await fixture.whenStable();
    const loader = TestbedHarnessEnvironment.documentRootLoader(fixture);
    const toast = await loader.getHarness(AveToastHarness.with({ variant: 'danger' }));
    expect(await toast.getActionLabel()).toBe('Повторить');
    await wait(150);
    expect(live().textContent).toBe('Не удалось сохранить. Повторить');
    expect(live().getAttribute('aria-live')).toBe('assertive');
    await toast.runAction();
    await fixture.whenStable();
    expect(retried).toBe(1);
    expect(await loader.getAllHarnesses(AveToastHarness)).toHaveLength(0);

    toaster.show({
      message: 'Срок согласования истёк.',
      variant: 'warning',
      action: { label: 'Продлить', run: () => 0 },
    });
    await wait(150);
    expect(live().textContent).toBe('Срок согласования истёк. Продлить');
  });

  it('takes focus on F8 and gives it back on Escape; closing the focused toast keeps focus in the region', async () => {
    const { fixture, toaster, element } = mount();
    const save = element.querySelector<HTMLButtonElement>('#save');
    await userEvent.keyboard('{F8}');
    expect(document.activeElement).toBe(document.body);
    toaster.show('Первый');
    toaster.show('Второй');
    await fixture.whenStable();
    save?.focus();
    await userEvent.keyboard('{F8}');
    expect(document.activeElement).toBe(region());
    await userEvent.keyboard('{Escape}');
    expect(document.activeElement).toBe(save);

    await userEvent.keyboard('{F8}');
    await userEvent.tab();
    await userEvent.keyboard('{Enter}');
    await fixture.whenStable();
    expect(document.activeElement).toBe(region());
    await userEvent.tab();
    expect(document.activeElement?.closest('[data-ave-toast]')?.textContent).toContain('Второй');
    await userEvent.keyboard('{Enter}');
    await fixture.whenStable();
    expect(document.activeElement).toBe(save);

    // With nowhere to go back to, or only somewhere inert, focus leaves the notifications.
    const third = toaster.show('Третий');
    await fixture.whenStable();
    save?.blur();
    region().focus();
    await userEvent.keyboard('{Escape}');
    expect(document.activeElement).toBe(document.body);
    save?.focus();
    await userEvent.keyboard('{F8}');
    element.setAttribute('inert', '');
    await userEvent.keyboard('{Escape}');
    expect(document.activeElement).toBe(document.body);
    element.removeAttribute('inert');

    // F8 does nothing once no toast shows.
    third.dismiss();
    await fixture.whenStable();
    save?.focus();
    await userEvent.keyboard('{F8}');
    expect(document.activeElement).toBe(save);
  });

  it('moves into an open modal dialog, where it is not inert, and back when the dialog closes', async () => {
    const { fixture, toaster, element } = mount();
    const modal = element.querySelector<HTMLDialogElement>('#modal');
    const first = toaster.show('Первый');
    await fixture.whenStable();
    modal?.showModal();
    await fixture.whenStable();
    expect(region().parentElement).toBe(modal);
    expect(region().matches(':popover-open')).toBe(true);
    const close = region().querySelector<HTMLButtonElement>('button.close');
    close?.focus();
    expect(document.activeElement).toBe(close);

    modal?.close();
    await fixture.whenStable();
    expect(region().parentElement).toBe(document.body);
    expect(region().matches(':popover-open')).toBe(true);

    // The last toast goes while the dialog is open: the region leaves the top layer and goes back to <body>.
    modal?.showModal();
    await fixture.whenStable();
    first.dismiss();
    await fixture.whenStable();
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(region().parentElement).toBe(document.body);
    expect(region().matches(':popover-open')).toBe(false);
    modal?.close();
    toaster.show('Второй');
    await fixture.whenStable();

    modal?.showModal();
    region().remove();
    await fixture.whenStable();
    expect(region().parentElement).toBe(modal);
    modal?.remove();
    await fixture.whenStable();
    expect(region().parentElement).toBe(document.body);
  });

  it('starts inside a modal dialog that was open before the first toast, and pauses while the page is hidden', async () => {
    const { fixture, toaster, element } = mount();
    const modal = element.querySelector<HTMLDialogElement>('#modal');
    modal?.showModal();
    toaster.show('Первый');
    await fixture.whenStable();
    expect(region().parentElement).toBe(modal);
    document.dispatchEvent(new Event('visibilitychange'));
    await fixture.whenStable();
    expect(document.querySelectorAll('[data-ave-toast]')).toHaveLength(1);
    modal?.close();
  });

  it('keeps the region when a toast shows as the last one leaves, and a clock that is not running stays stopped', async () => {
    const { fixture, toaster } = mount();
    const first = toaster.show('Первый');
    await fixture.whenStable();
    first.dismiss();
    toaster.show('Второй');
    await fixture.whenStable();
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(region().matches(':popover-open')).toBe(true);

    // A toast shown while the pointer rests on the notifications waits; the pointer leaving and coming back at once
    // stops a clock that never ran.
    const host = region();
    host.dispatchEvent(new PointerEvent('pointerenter'));
    toaster.show('Третий');
    host.dispatchEvent(new PointerEvent('pointerleave'));
    host.dispatchEvent(new PointerEvent('pointerenter'));
    await fixture.whenStable();
    expect(document.querySelectorAll('[data-ave-toast]')).toHaveLength(2);
    host.dispatchEvent(new PointerEvent('pointerleave'));
  });

  it('removes the region with the application', async () => {
    const { fixture, toaster } = mount();
    toaster.show('Первый');
    await fixture.whenStable();
    expect(document.querySelector('ave-toast-region')).not.toBeNull();
    TestBed.resetTestingModule();
    expect(document.querySelector('ave-toast-region')).toBeNull();
  });

  it('does nothing on the server', () => {
    TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'server' }] });
    const ref = TestBed.inject(AveToaster).show('Документ сохранён');
    ref.dismiss();
    expect(document.querySelector('ave-toast-region')).toBeNull();
  });

  it('rejects a toast of an unknown variant', async () => {
    const { fixture, toaster } = mount();
    toaster.show('Первый');
    await fixture.whenStable();
    region().querySelector('[data-ave-toast]')?.setAttribute('data-variant', 'neutral');
    const toast = await TestbedHarnessEnvironment.documentRootLoader(fixture).getHarness(AveToastHarness);
    await expect(toast.getVariant()).rejects.toThrow('unexpected data-variant "neutral"');
  });
});
