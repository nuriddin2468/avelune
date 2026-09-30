import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { tokens } from '@avelune/tokens';
import { AveFormPage, AveFormPageActions, AveFormPageActionsStart } from '@avelune/ui/form-page';
import { AveFormPageHarness } from '@avelune/ui/form-page/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

@Component({
  selector: 'ave-form-page-host',
  imports: [AveFormPage, AveFormPageActions, AveFormPageActionsStart],
  template: `
    <form aveFormPage heading="Новый договор" [description]="description()" novalidate>
      <div class="fields" [class.tall]="tall()">
        <label>Номер договора <input type="text" /></label>
      </div>
      @if (withActions()) {
        <div aveFormPageActions>
          @if (withStart()) {
            <button type="button" aveFormPageActionsStart class="draft">Сохранить черновик</button>
          }
          <button type="button" class="cancel">Отмена</button>
          <button type="submit" class="send">Отправить на согласование</button>
        </div>
      }
    </form>
  `,
})
class FormPageHost {
  readonly description = signal('* — обязательные поля');
  readonly tall = signal(true);
  readonly withActions = signal(true);
  readonly withStart = signal(true);
}

const every = Object.values(tokens);
const root = document.documentElement;
const reset = document.createElement('style');
// The kit's layer order and reset (ADR 0030): without styles.css, layers would stack in the order they first appear.
reset.textContent =
  '@layer reset, tokens, base, components, patterns, utilities, app; @layer reset { *, ::before, ::after { box-sizing: border-box; } body, p, h1 { margin: 0; } button { block-size: 36px; } } .tall { block-size: 3000px; }';

beforeEach(() => {
  for (const token of every) root.style.setProperty(token.cssVar, token.css);
  document.head.append(reset);
});

afterEach(() => {
  for (const token of every) root.style.removeProperty(token.cssVar);
  reset.remove();
  window.scrollTo(0, 0);
});

function mount(width: number): { fixture: ComponentFixture<FormPageHost>; element: HTMLElement } {
  const fixture = TestBed.createComponent(FormPageHost);
  const element = fixture.nativeElement as HTMLElement;
  element.style.display = 'block';
  element.style.inlineSize = `${String(width)}px`;
  element.style.paddingInline = '16px';
  document.body.prepend(element);
  fixture.detectChanges();
  return { fixture, element };
}

function box(element: Element | null | undefined): DOMRect {
  if (element === null || element === undefined) throw new Error('No element');
  return element.getBoundingClientRect();
}

describe('AveFormPage', () => {
  it('heads the form, which its heading names, and stands at most container.lg wide', async () => {
    const { fixture, element } = mount(1200);
    const page = await TestbedHarnessEnvironment.loader(fixture).getHarness(
      AveFormPageHarness.with({ heading: 'Новый договор' }),
    );
    expect(await page.getDescription()).toBe('* — обязательные поля');
    const form = element.querySelector('form');
    const heading = element.querySelector('h1');
    expect(form?.getAttribute('aria-labelledby')).toBe(heading?.id);
    expect(getComputedStyle(heading ?? element).fontSize).toBe(`${String(tokens['font.heading-xl'].value.fontSize)}px`);
    expect(box(form).width).toBe(960);
    expect(box(element.querySelector('.fields')).top - box(element.querySelector('.header')).bottom).toBe(24);
    fixture.componentInstance.description.set('');
    expect(await page.getDescription()).toBe('');
    element.remove();
  });

  it('sticks the actions to the window’s bottom while the form reaches past it, then rests them after it', async () => {
    const { fixture, element } = mount(900);
    const page = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveFormPageHarness);
    expect(await page.getStartActions()).toEqual(['Сохранить черновик']);
    expect(await page.getActions()).toEqual(['Отмена', 'Отправить на согласование']);
    const bar = element.querySelector('[aveFormPageActions]');
    expect(bar?.getAttribute('data-ave-form-actions')).toBe('');
    expect(Math.round(box(bar).bottom)).toBe(window.innerHeight);
    const style = getComputedStyle(bar ?? element);
    expect(style.position).toBe('sticky');
    expect(style.zIndex).toBe(tokens['z-index.sticky'].css);
    expect(style.borderTopWidth).toBe('1px');
    expect(box(bar).height).toBe(36 + 12 * 2 + 1);

    const form = element.querySelector('form');
    expect(box(bar).left).toBe(box(form).left - 16);
    expect(box(bar).right).toBe(box(form).right + 16);
    expect(box(element.querySelector('.draft')).left).toBe(box(form).left);
    expect(box(element.querySelector('.send')).right).toBe(box(form).right);
    expect(box(element.querySelector('.send')).left - box(element.querySelector('.cancel')).right).toBe(8);

    window.scrollTo(0, document.documentElement.scrollHeight);
    expect(box(bar).top).toBe(box(element.querySelector('.fields')).bottom + 24);
    element.remove();
  });

  it('puts its actions at the end alone, and wraps them on a narrow page', async () => {
    const { fixture, element } = mount(260);
    const page = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveFormPageHarness);
    fixture.componentInstance.withStart.set(false);
    fixture.detectChanges();
    expect(await page.getStartActions()).toEqual([]);
    expect(getComputedStyle(element.querySelector('.start') ?? element).display).toBe('none');
    const cancel = element.querySelector('.cancel');
    const send = element.querySelector('.send');
    expect(box(send).top).toBeGreaterThan(box(cancel).top);
    expect(box(send).right).toBe(box(element.querySelector('form')).right);
    expect(element.scrollWidth).toBe(element.clientWidth);

    fixture.componentInstance.withActions.set(false);
    expect(await page.hasActions()).toBe(false);
    element.remove();
  });
});
