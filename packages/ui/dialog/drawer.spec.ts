import { Component, LOCALE_ID, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { tokens, type TokenName } from '@avelune/tokens';
import { AveButton } from '@avelune/ui/button';
import { AveDialogActions, AveDrawer, type AveDrawerSide, type AveDrawerSize } from '@avelune/ui/dialog';
import { AveDrawerHarness } from '@avelune/ui/dialog/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';

@Component({
  selector: 'ave-drawer-host',
  imports: [AveButton, AveDialogActions, AveDrawer],
  template: `
    <button type="button" id="opener" (click)="viewing.set(true)">Открыть</button>
    <dialog aveDrawer heading="Договор ДК-2026/114" [side]="side()" [size]="size()" [(open)]="viewing">
      <p>Поставка серверного оборудования для центра обработки данных.</p>
      @if (tall()) {
        <div class="tall"></div>
      }
      <div aveDialogActions>
        <button aveButton type="button" variant="primary" (click)="viewing.set(false)">Готово</button>
      </div>
    </dialog>
  `,
})
class DrawerHost {
  readonly viewing = signal(false);
  readonly side = signal<AveDrawerSide>('end');
  readonly size = signal<AveDrawerSize>('md');
  readonly tall = signal(false);
}

const used = [
  'space.1',
  'space.2',
  'space.4',
  'space.6',
  'container.xs',
  'container.sm',
  'container.md',
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
  '*, ::before, ::after { box-sizing: border-box; } h2, p { margin: 0; } .tall { block-size: 3000px; flex: none; }';

beforeEach(() => {
  for (const name of used) root.style.setProperty(tokens[name].cssVar, tokens[name].css);
  root.style.setProperty('--ave-font-heading-lg-line-height', '28px');
  document.head.append(reset);
});

afterEach(() => {
  for (const name of used) root.style.removeProperty(tokens[name].cssVar);
  root.style.removeProperty('--ave-font-heading-lg-line-height');
  reset.remove();
});

function mount(): { fixture: ComponentFixture<DrawerHost>; element: HTMLElement } {
  TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: 'ru' }] });
  const fixture = TestBed.createComponent(DrawerHost);
  const element = fixture.nativeElement as HTMLElement;
  document.body.prepend(element);
  fixture.detectChanges();
  return { fixture, element };
}

describe('AveDrawer', () => {
  it('shows modally against the inline end, the full height, and closes back to its opener', async () => {
    const { fixture, element } = mount();
    const drawer = await TestbedHarnessEnvironment.loader(fixture).getHarness(
      AveDrawerHarness.with({ heading: 'Договор ДК-2026/114' }),
    );
    await userEvent.click(element.querySelector('#opener') ?? element);
    await fixture.whenStable();
    expect(await drawer.isOpen()).toBe(true);
    expect(await drawer.isModal()).toBe(true);
    expect(await drawer.getSide()).toBe('end');
    const panel = element.querySelector<HTMLElement>('dialog[aveDrawer] .panel');
    const box = panel?.getBoundingClientRect();
    expect(box?.right).toBe(window.innerWidth);
    expect(box?.top).toBe(0);
    expect(box?.height).toBe(window.innerHeight);
    expect(panel?.classList.contains('ave-motion-drawer-enter')).toBe(true);
    expect(panel?.getAttribute('data-side')).toBe('end');
    expect(getComputedStyle(panel ?? element).borderStartStartRadius).toBe(tokens['radius.lg'].css);
    expect(getComputedStyle(panel ?? element).borderStartEndRadius).toBe('0px');
    expect(document.activeElement?.textContent.trim()).toBe('Готово');

    await drawer.close();
    expect(fixture.componentInstance.viewing()).toBe(false);
    expect(document.activeElement?.id).toBe('opener');
  });

  it('slides in from the start on request, keeps its actions in view while long content scrolls', async () => {
    const { fixture, element } = mount();
    const drawer = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveDrawerHarness);
    fixture.componentInstance.side.set('start');
    fixture.componentInstance.size.set('sm');
    fixture.componentInstance.tall.set(true);
    fixture.componentInstance.viewing.set(true);
    await fixture.whenStable();
    expect(await drawer.getSide()).toBe('start');
    const panel = element.querySelector<HTMLElement>('dialog[aveDrawer] .panel');
    expect(panel?.getBoundingClientRect().left).toBe(0);
    expect(panel?.getBoundingClientRect().width).toBeLessThanOrEqual(320);
    expect(getComputedStyle(panel ?? element).borderStartEndRadius).toBe(tokens['radius.lg'].css);
    const actions = element.querySelector('dialog[aveDrawer] [aveDialogActions]')?.getBoundingClientRect();
    expect(actions?.bottom).toBe(window.innerHeight);
    await new Promise((resolve) => requestAnimationFrame(resolve));
    await fixture.whenStable();
    expect(element.querySelector('dialog[aveDrawer] .body')?.getAttribute('tabindex')).toBe('0');
    await drawer.clickBackdrop();
    expect(fixture.componentInstance.viewing()).toBe(false);
    fixture.componentInstance.viewing.set(true);
    await fixture.whenStable();
    await userEvent.keyboard('{Escape}');
    await fixture.whenStable();
    expect(fixture.componentInstance.viewing()).toBe(false);
  });
});
