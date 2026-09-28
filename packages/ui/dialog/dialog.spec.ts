import { Component, LOCALE_ID, PLATFORM_ID, inject, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { tokens, type TokenName } from '@avelune/tokens';
import { AveButton } from '@avelune/ui/button';
import { AveButtonHarness } from '@avelune/ui/button/testing';
import {
  AveConfirmDialog,
  AveDialog,
  AveDialogActions,
  type AveConfirmVariant,
  type AveDialogSize,
} from '@avelune/ui/dialog';
import { AveConfirmDialogHarness, AveDialogHarness } from '@avelune/ui/dialog/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';

/** A control inside a dialog that announces, as a file upload does. */
@Component({ selector: 'ave-dialog-speaker', template: '' })
class Speaker {
  readonly announcer = inject(LiveAnnouncer);
}

@Component({
  selector: 'ave-dialog-host',
  imports: [AveButton, AveConfirmDialog, AveDialog, AveDialogActions, Speaker],
  template: `
    <button type="button" id="opener" (click)="editing.set(true)">Изменить</button>
    <button type="button" id="asker" (click)="asking.set(true)">Удалить</button>
    <dialog aveDialog heading="Изменить контрагента" [size]="size()" [(open)]="editing">
      <label>Название <input id="name" /></label>
      <ave-dialog-speaker />
      @if (tall()) {
        <div class="tall"></div>
      }
      <div aveDialogActions>
        <button aveButton type="button" (click)="editing.set(false)">Отмена</button>
        <button aveButton type="button" variant="primary">Сохранить</button>
      </div>
    </dialog>
    <dialog
      aveConfirmDialog
      heading="Удалить договор ДК-2026/114?"
      action="Удалить договор"
      [variant]="variant()"
      [cancel]="cancel()"
      [(open)]="asking"
      (confirm)="confirmed.set(confirmed() + 1)"
    >
      Договор и его приложения будут удалены без возможности восстановления.
    </dialog>
  `,
})
class DialogHost {
  readonly editing = signal(false);
  readonly asking = signal(false);
  readonly size = signal<AveDialogSize>('md');
  readonly variant = signal<AveConfirmVariant>('danger');
  readonly cancel = signal('');
  readonly confirmed = signal(0);
  readonly tall = signal(false);
}

const used = [
  'space.1',
  'space.2',
  'space.4',
  'space.6',
  'container.sm',
  'container.md',
  'container.lg',
  'radius.md',
  'radius.lg',
  'border-width.default',
  'font.body-md',
  'font.label-md',
  'font.heading-lg',
  'size.icon.sm',
  'control.height.sm',
  'control.height.md',
  'control.padding-inline.sm',
  'control.padding-inline.md',
  'color.bg.backdrop',
  'color.bg.surface-raised',
  'color.border.subtle',
  'elevation.dialog',
] as const satisfies readonly TokenName[];

const root = document.documentElement;
const reset = document.createElement('style');
reset.textContent =
  '*, ::before, ::after { box-sizing: border-box; } h2, p { margin: 0; } .tall { block-size: 2000px; flex: none; }';

beforeEach(() => {
  for (const name of used) root.style.setProperty(tokens[name].cssVar, tokens[name].css);
  root.style.setProperty('--ave-font-heading-lg-line-height', '28px');
  root.style.setProperty('--ave-timing-tooltip-delay', '0ms');
  document.head.append(reset);
});

afterEach(() => {
  for (const name of used) root.style.removeProperty(tokens[name].cssVar);
  root.style.removeProperty('--ave-font-heading-lg-line-height');
  root.style.removeProperty('--ave-timing-tooltip-delay');
  reset.remove();
});

function mount(locale = 'ru'): { fixture: ComponentFixture<DialogHost>; element: HTMLElement } {
  TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: locale }] });
  const fixture = TestBed.createComponent(DialogHost);
  const element = fixture.nativeElement as HTMLElement;
  document.body.prepend(element);
  fixture.detectChanges();
  return { fixture, element };
}

function byId(element: HTMLElement, id: string): HTMLElement {
  const found = element.querySelector<HTMLElement>(`#${id}`);
  if (found === null) throw new Error(`No #${id}`);
  return found;
}

describe('AveDialog', () => {
  it('shows modally, named by its heading, focus on its first field, the page inert, and closes back to the opener', async () => {
    const { fixture, element } = mount();
    const dialog = await TestbedHarnessEnvironment.loader(fixture).getHarness(
      AveDialogHarness.with({ heading: 'Изменить контрагента' }),
    );
    expect(await dialog.isOpen()).toBe(false);
    await userEvent.click(byId(element, 'opener'));
    await fixture.whenStable();
    expect(await dialog.isOpen()).toBe(true);
    expect(await dialog.isModal()).toBe(true);
    expect(await dialog.getHeading()).toBe('Изменить контрагента');
    const host = element.querySelector('dialog[aveDialog]');
    expect(document.getElementById(host?.getAttribute('aria-labelledby') ?? '')?.textContent).toBe(
      'Изменить контрагента',
    );
    expect(document.activeElement?.id).toBe('name');
    byId(element, 'asker').focus();
    expect(document.activeElement?.id).toBe('name');
    expect(await dialog.getText()).toContain('Название');

    await dialog.close();
    expect(fixture.componentInstance.editing()).toBe(false);
    expect(await dialog.isOpen()).toBe(false);
    expect(document.activeElement?.id).toBe('opener');
  });

  it('closes on Escape and on the backdrop, not on a click in its panel, and follows the browser closing it', async () => {
    const { fixture, element } = mount();
    const dialog = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveDialogHarness);
    await userEvent.click(byId(element, 'opener'));
    await fixture.whenStable();
    await userEvent.keyboard('{Escape}');
    await fixture.whenStable();
    expect(fixture.componentInstance.editing()).toBe(false);
    expect(document.activeElement?.id).toBe('opener');

    fixture.componentInstance.editing.set(true);
    await fixture.whenStable();
    await userEvent.click(byId(element, 'name'));
    await fixture.whenStable();
    expect(await dialog.isOpen()).toBe(true);
    await dialog.clickBackdrop();
    expect(fixture.componentInstance.editing()).toBe(false);

    fixture.componentInstance.editing.set(true);
    await fixture.whenStable();
    await dialog.pressEscape();
    expect(fixture.componentInstance.editing()).toBe(false);

    fixture.componentInstance.editing.set(true);
    await fixture.whenStable();
    const native = element.querySelector<HTMLDialogElement>('dialog[aveDialog]');
    const closed = new Promise((resolve) => native?.addEventListener('close', resolve, { once: true }));
    native?.close();
    // The browser fires close in a task of its own.
    await closed;
    await fixture.whenStable();
    expect(fixture.componentInstance.editing()).toBe(false);
  });

  it('draws the backdrop over the viewport and the panel within it, with the close button last in the focus order', async () => {
    const { fixture, element } = mount('en');
    const loader = TestbedHarnessEnvironment.loader(fixture);
    fixture.componentInstance.editing.set(true);
    await fixture.whenStable();
    const host = element.querySelector<HTMLDialogElement>('dialog[aveDialog]');
    const panel = host?.querySelector<HTMLElement>('.panel');
    if (host == null || panel == null) throw new Error('No dialog');
    expect(host.getBoundingClientRect().width).toBe(window.innerWidth);
    expect(host.getBoundingClientRect().height).toBe(window.innerHeight);
    expect(getComputedStyle(host).backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(panel.getBoundingClientRect().width).toBeLessThanOrEqual(window.innerWidth - 32);
    expect(getComputedStyle(panel).borderTopLeftRadius).toBe(tokens['radius.lg'].css);
    expect(host.getAttribute('data-size')).toBe('md');
    const focusable = [...panel.querySelectorAll('input, button')];
    expect(focusable.at(-1)?.classList.contains('close')).toBe(true);
    expect(focusable.at(-1)?.getAttribute('aria-label')).toBe('Close');
    const close = panel.querySelector('.close')?.getBoundingClientRect();
    const heading = panel.querySelector('.heading')?.getBoundingClientRect();
    expect(close?.top).toBeLessThan(heading?.bottom ?? 0);
    expect(
      await (await loader.getChildLoader('dialog[aveDialog]')).getHarness(AveButtonHarness.with({ text: 'Сохранить' })),
    ).toBeTruthy();
    fixture.componentInstance.size.set('lg');
    fixture.detectChanges();
    expect(host.getAttribute('data-size')).toBe('lg');
    expect(
      await (await (await loader.getHarness(AveDialogHarness)).getContentLoader()).getAllHarnesses(AveButtonHarness),
    ).toHaveLength(2);
  });

  it('keeps the page still while open, gives its content an announcer inside it, and plays its exit before closing', async () => {
    const exit = document.createElement('style');
    exit.textContent =
      '@keyframes ave-test-fade { to { opacity: 0; } } .ave-motion-dialog-exit { animation: ave-test-fade 60ms forwards; }';
    document.head.append(exit);
    const tall = document.createElement('div');
    tall.style.blockSize = '3000px';
    document.body.append(tall);
    const { fixture, element } = mount();
    const host = element.querySelector<HTMLDialogElement>('dialog[aveDialog]');
    fixture.componentInstance.editing.set(true);
    await fixture.whenStable();
    expect(host?.getAttribute('data-ave-scroll-lock')).toBe('gutter');
    const announcer = fixture.debugElement
      .query((node) => node.name === 'ave-dialog-speaker')
      .injector.get(Speaker).announcer;
    await announcer.announce('Файлы прикреплены: 2');
    const live = host?.querySelector('.cdk-live-announcer-element');
    expect(live?.textContent).toBe('Файлы прикреплены: 2');
    expect(live?.getBoundingClientRect().width).toBe(1);

    fixture.componentInstance.editing.set(false);
    fixture.detectChanges();
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(host?.open).toBe(true);
    expect(host?.classList.contains('ave-motion-backdrop-exit')).toBe(true);
    fixture.componentInstance.editing.set(true);
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(host?.open).toBe(true);
    fixture.componentInstance.editing.set(false);
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 150));
    await fixture.whenStable();
    expect(host?.open).toBe(false);
    expect(host?.hasAttribute('data-ave-scroll-lock')).toBe(false);
    exit.remove();
    tall.remove();
  });
});

describe('AveDialog content', () => {
  it('lets the body take keyboard focus only while its content overflows it', async () => {
    const { fixture, element } = mount();
    fixture.componentInstance.editing.set(true);
    await fixture.whenStable();
    const body = element.querySelector<HTMLElement>('dialog[aveDialog] .body');
    expect(body?.hasAttribute('tabindex')).toBe(false);
    fixture.componentInstance.tall.set(true);
    fixture.detectChanges();
    await new Promise((resolve) => requestAnimationFrame(resolve));
    await fixture.whenStable();
    expect(body?.getAttribute('tabindex')).toBe('0');
    fixture.componentInstance.tall.set(false);
    fixture.detectChanges();
    await new Promise((resolve) => requestAnimationFrame(resolve));
    await fixture.whenStable();
    expect(body?.hasAttribute('tabindex')).toBe(false);
  });
});

describe('AveConfirmDialog', () => {
  it('asks with a question it is named by, the message describing it, and Cancel focused', async () => {
    const { fixture, element } = mount();
    const confirm = await TestbedHarnessEnvironment.loader(fixture).getHarness(
      AveConfirmDialogHarness.with({ heading: /Удалить договор/ }),
    );
    await userEvent.click(byId(element, 'asker'));
    await fixture.whenStable();
    const host = element.querySelector('dialog[aveConfirmDialog]');
    expect(host?.getAttribute('role')).toBe('alertdialog');
    expect(document.getElementById(host?.getAttribute('aria-describedby') ?? '')?.textContent.trim()).toBe(
      'Договор и его приложения будут удалены без возможности восстановления.',
    );
    expect(await confirm.isOpen()).toBe(true);
    expect(await confirm.getMessage()).toBe('Договор и его приложения будут удалены без возможности восстановления.');
    expect(await confirm.getCancel()).toBe('Отмена');
    expect(await confirm.getAction()).toBe('Удалить договор');
    expect(document.activeElement?.textContent.trim()).toBe('Отмена');
    expect(host?.querySelectorAll('.actions button')[1]?.getAttribute('data-variant')).toBe('danger');

    await confirm.cancel();
    expect(fixture.componentInstance.confirmed()).toBe(0);
    expect(fixture.componentInstance.asking()).toBe(false);
    expect(document.activeElement?.id).toBe('asker');
  });

  it('emits confirm and closes on the action; Escape only closes; the words and variant are the application’s', async () => {
    const { fixture } = mount();
    const confirm = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveConfirmDialogHarness);
    fixture.componentInstance.asking.set(true);
    await fixture.whenStable();
    await confirm.confirm();
    expect(fixture.componentInstance.confirmed()).toBe(1);
    expect(fixture.componentInstance.asking()).toBe(false);

    fixture.componentInstance.asking.set(true);
    await fixture.whenStable();
    await confirm.pressEscape();
    expect(fixture.componentInstance.confirmed()).toBe(1);
    expect(fixture.componentInstance.asking()).toBe(false);

    fixture.componentInstance.cancel.set('Оставить');
    fixture.componentInstance.variant.set('primary');
    fixture.detectChanges();
    expect(await confirm.getCancel()).toBe('Оставить');
    expect(
      (fixture.nativeElement as HTMLElement)
        .querySelectorAll('dialog[aveConfirmDialog] .actions button')[1]
        ?.getAttribute('data-variant'),
    ).toBe('primary');
  });
});

describe('AveDialog on the server and in quick succession', () => {
  it('stays open when the close of its last exit arrives after it opened again', async () => {
    const { fixture, element } = mount();
    const host = element.querySelector<HTMLDialogElement>('dialog[aveDialog]');
    fixture.componentInstance.editing.set(true);
    await fixture.whenStable();
    const closed = new Promise((resolve) => host?.addEventListener('close', resolve, { once: true }));
    fixture.componentInstance.editing.set(false);
    await fixture.whenStable();
    fixture.componentInstance.editing.set(true);
    await fixture.whenStable();
    await closed;
    await fixture.whenStable();
    expect(host?.open).toBe(true);
    expect(fixture.componentInstance.editing()).toBe(true);
  });

  it('shows nothing and measures nothing on the server', async () => {
    TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'server' }] });
    const { fixture, element } = mount();
    fixture.componentInstance.editing.set(true);
    await fixture.whenStable();
    expect(element.querySelector<HTMLDialogElement>('dialog[aveDialog]')?.open).toBe(false);
    expect(element.querySelector('dialog[aveDialog] .body')?.hasAttribute('tabindex')).toBe(false);
  });
});
