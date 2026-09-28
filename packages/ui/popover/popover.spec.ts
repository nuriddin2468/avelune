import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { lucideFunnel } from '@avelune/icons/lucide';
import { tokens, type TokenName } from '@avelune/tokens';
import { AveButton } from '@avelune/ui/button';
import { AveButtonHarness } from '@avelune/ui/button/testing';
import { provideAveIcons } from '@avelune/ui/icon';
import { AvePopover } from '@avelune/ui/popover';
import { AvePopoverHarness } from '@avelune/ui/popover/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';

@Component({
  selector: 'ave-popover-host',
  imports: [AveButton, AvePopover],
  providers: [provideAveIcons([lucideFunnel])],
  template: `
    <div class="row">
      <ave-popover label="Фильтры" heading="Статус договора" [(open)]="open" [disabled]="disabled()">
        <label><input type="checkbox" id="draft" /> Черновик</label>
        <label><input type="checkbox" id="signed" /> Подписан</label>
        <button aveButton type="button" variant="primary" (click)="open.set(false)">Применить</button>
      </ave-popover>
      <button type="button" id="after">After</button>
      <ave-popover label="Справка" icon="funnel" variant="ghost">
        <p>Фильтры сохраняются до конца сеанса.</p>
      </ave-popover>
    </div>
  `,
})
class PopoverHost {
  readonly open = signal(false);
  readonly disabled = signal(false);
}

const used = [
  'space.1',
  'space.2',
  'space.3',
  'space.4',
  'space.16',
  'container.sm',
  'radius.md',
  'radius.lg',
  'border-width.default',
  'font.body-md',
  'font.label-md',
  'font.heading-sm',
  'size.icon.sm',
  'control.height.md',
  'control.padding-inline.md',
  'color.bg.surface-raised',
  'color.border.subtle',
  'elevation.popover',
] as const satisfies readonly TokenName[];

const root = document.documentElement;
const reset = document.createElement('style');
reset.textContent =
  '*, ::before, ::after { box-sizing: border-box; } p { margin: 0; } .row { display: flex; justify-content: space-between; padding: 16px; }';

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

function mount(): { fixture: ComponentFixture<PopoverHost>; element: HTMLElement; button: HTMLButtonElement } {
  const fixture = TestBed.createComponent(PopoverHost);
  const element = fixture.nativeElement as HTMLElement;
  document.body.prepend(element);
  fixture.detectChanges();
  const button = element.querySelector<HTMLButtonElement>('ave-popover button');
  if (button === null) throw new Error('No popover button');
  return { fixture, element, button };
}

function panel(): HTMLElement {
  const found = document.querySelector<HTMLElement>('[role="dialog"].panel');
  if (found === null) throw new Error('No panel');
  return found;
}

describe('AvePopover', () => {
  it('opens a non-modal dialog named by its heading, moves focus to its first field, and closes on Escape', async () => {
    const { fixture, button } = mount();
    const popover = await TestbedHarnessEnvironment.loader(fixture).getHarness(
      AvePopoverHarness.with({ label: 'Фильтры' }),
    );
    expect(button.getAttribute('aria-haspopup')).toBe('dialog');
    expect(await popover.isOpen()).toBe(false);
    await popover.open();
    await fixture.whenStable();
    expect(fixture.componentInstance.open()).toBe(true);
    expect(button.getAttribute('aria-controls')).toBe(panel().id);
    expect(await popover.getHeading()).toBe('Статус договора');
    expect(document.getElementById(panel().getAttribute('aria-labelledby') ?? '')?.textContent).toBe('Статус договора');
    expect(panel().hasAttribute('aria-modal')).toBe(false);
    expect(document.activeElement?.id).toBe('draft');
    expect(panel().closest('[popover]')?.matches(':popover-open')).toBe(true);
    expect(panel().getBoundingClientRect().top - button.getBoundingClientRect().bottom).toBe(4);
    expect(getComputedStyle(panel()).borderTopLeftRadius).toBe(tokens['radius.lg'].css);
    expect(panel().getBoundingClientRect().width).toBeGreaterThanOrEqual(256);
    expect(await popover.getText()).toContain('Черновик');

    await userEvent.keyboard('{Escape}');
    await fixture.whenStable();
    expect(await popover.isOpen()).toBe(false);
    expect(document.activeElement).toBe(button);
  });

  it('closes from its content, on a press outside and when focus leaves it, returning focus only from inside', async () => {
    const { fixture, element, button } = mount();
    const popover = await TestbedHarnessEnvironment.loader(fixture).getHarness(
      AvePopoverHarness.with({ label: 'Фильтры' }),
    );
    await popover.open();
    await fixture.whenStable();
    const apply = await (await popover.getPanelLoader()).getHarness(AveButtonHarness.with({ text: 'Применить' }));
    await apply.click();
    await fixture.whenStable();
    expect(await popover.isOpen()).toBe(false);
    expect(document.activeElement).toBe(button);

    await popover.open();
    await fixture.whenStable();
    await userEvent.click(element.querySelector('#after') ?? element);
    await fixture.whenStable();
    expect(await popover.isOpen()).toBe(false);
    expect(document.activeElement?.id).toBe('after');

    await popover.open();
    await fixture.whenStable();
    element.querySelector<HTMLElement>('#after')?.focus();
    await fixture.whenStable();
    expect(await popover.isOpen()).toBe(false);

    await popover.open();
    await fixture.whenStable();
    await userEvent.click(button);
    await fixture.whenStable();
    expect(await popover.isOpen()).toBe(false);
    await popover.close();
  });

  it('focuses the panel itself without a field, ends at its icon button without room, and shows its tooltip', async () => {
    const { fixture, element } = mount();
    const help = await TestbedHarnessEnvironment.loader(fixture).getHarness(
      AvePopoverHarness.with({ label: 'Справка' }),
    );
    const button = element.querySelectorAll<HTMLButtonElement>('ave-popover button')[1];
    expect(button?.hasAttribute('aveIconButton')).toBe(true);
    expect(await help.getHeading()).toBe('');
    await fixture.whenStable();
    expect(document.activeElement).toBe(panel());
    expect(panel().getAttribute('aria-labelledby')).toBe(button?.id);
    expect(panel().getBoundingClientRect().right).toBe(button?.getBoundingClientRect().right);
    await help.close();
    await fixture.whenStable();
    button?.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }));
    await fixture.whenStable();
    expect(document.querySelector('ave-tooltip-panel')?.textContent.trim()).toBe('Справка');
  });

  it('keeps a dialog around it open on Escape, and cannot open while disabled', async () => {
    const { fixture, element } = mount();
    const popover = await TestbedHarnessEnvironment.loader(fixture).getHarness(
      AvePopoverHarness.with({ label: 'Фильтры' }),
    );
    let heard = 0;
    const listener = (): void => {
      heard++;
    };
    element.addEventListener('keydown', listener);
    await popover.open();
    await fixture.whenStable();
    const escape = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    panel().dispatchEvent(escape);
    expect(escape.defaultPrevented).toBe(true);
    element.removeEventListener('keydown', listener);
    expect(heard).toBe(0);

    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();
    expect(await popover.isDisabled()).toBe(true);
  });
});
