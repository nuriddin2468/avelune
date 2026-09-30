import { Component, LOCALE_ID, PLATFORM_ID, signal, type Provider } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { tokens } from '@avelune/tokens';
import { AveListDetail, AveListDetailDetail, AveListDetailList } from '@avelune/ui/list-detail';
import { AveListDetailHarness } from '@avelune/ui/list-detail/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';

@Component({
  selector: 'ave-list-detail-host',
  imports: [AveListDetail, AveListDetailDetail, AveListDetailList],
  template: `
    <ave-list-detail
      heading="Подразделения"
      [description]="description()"
      [backLabel]="backLabel()"
      [(detail)]="reading"
    >
      <ul aveListDetailList class="records">
        @for (name of names; track name) {
          <li>
            <button type="button" (click)="choose(name)">{{ name }}</button>
          </li>
        }
      </ul>
      <section aveListDetailDetail class="record">
        <h2>{{ chosen() }}</h2>
      </section>
    </ave-list-detail>
  `,
})
class ListDetailHost {
  readonly names = ['Правление', 'Юридический департамент', 'Бухгалтерия'];
  readonly chosen = signal('Правление');
  readonly reading = signal(false);
  readonly description = signal('Структура организации и сотрудники подразделений.');
  readonly backLabel = signal<string | undefined>(undefined);

  choose(name: string): void {
    this.chosen.set(name);
    this.reading.set(true);
  }
}

const every = Object.values(tokens);
const root = document.documentElement;
const reset = document.createElement('style');
// The kit's layer order and reset (ADR 0030): without styles.css, layers would stack in the order they first appear.
reset.textContent =
  '@layer reset, tokens, base, components, patterns, utilities, app; @layer reset { *, ::before, ::after { box-sizing: border-box; } p, h1, h2, ul { margin: 0; } }';

beforeEach(() => {
  for (const token of every) root.style.setProperty(token.cssVar, token.css);
  document.head.append(reset);
});

afterEach(() => {
  for (const token of every) root.style.removeProperty(token.cssVar);
  reset.remove();
});

function mount(
  width: number,
  providers: Provider[] = [],
): { fixture: ComponentFixture<ListDetailHost>; element: HTMLElement } {
  TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: 'ru' }, ...providers] });
  const fixture = TestBed.createComponent(ListDetailHost);
  const element = fixture.nativeElement as HTMLElement;
  element.style.display = 'block';
  element.style.inlineSize = `${String(width)}px`;
  document.body.prepend(element);
  fixture.detectChanges();
  return { fixture, element };
}

function box(element: Element | null | undefined): DOMRect {
  if (element === null || element === undefined) throw new Error('No element');
  return element.getBoundingClientRect();
}

describe('AveListDetail', () => {
  it('stands the list and the record side by side, 2 : 3, under the heading, from container.md', async () => {
    const { fixture, element } = mount(900);
    const page = await TestbedHarnessEnvironment.loader(fixture).getHarness(
      AveListDetailHarness.with({ heading: 'Подразделения' }),
    );
    expect(await page.getDescription()).toBe('Структура организации и сотрудники подразделений.');
    expect(await page.isListShown()).toBe(true);
    expect(await page.isDetailShown()).toBe(true);
    expect(await page.hasBackButton()).toBe(false);
    const list = element.querySelector('.records');
    const record = element.querySelector('.record');
    expect(box(record).left - box(list).right).toBe(24);
    expect(box(list).width / box(record).width).toBeCloseTo(2 / 3, 2);
    expect(box(list).top).toBe(box(record).top);
    expect(box(list).top - box(element.querySelector('h1 + p')).bottom).toBe(24);

    const [second] = element.querySelectorAll<HTMLButtonElement>('.records li:nth-child(2) button');
    await userEvent.click(second ?? element);
    expect(await page.isListShown()).toBe(true);
    expect(document.activeElement).toBe(second);
    fixture.componentInstance.description.set('');
    expect(await page.getDescription()).toBe('');
    element.remove();
  });

  it('shows the list, then the chosen record under the way back, below container.md; focus follows', async () => {
    const { fixture, element } = mount(480);
    const page = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveListDetailHarness);
    expect(await page.isListShown()).toBe(true);
    expect(await page.isDetailShown()).toBe(false);

    const second = element.querySelector<HTMLButtonElement>('.records li:nth-child(2) button');
    await userEvent.click(second ?? element);
    await fixture.whenStable();
    expect(await page.isListShown()).toBe(false);
    expect(await page.isDetailShown()).toBe(true);
    expect(await page.hasBackButton()).toBe(true);
    expect(await page.getBackLabel()).toBe('Назад к списку');
    expect(document.activeElement?.textContent.trim()).toBe('Назад к списку');
    expect(element.querySelector('.record h2')?.textContent).toBe('Юридический департамент');

    await userEvent.click(document.activeElement ?? element);
    await fixture.whenStable();
    expect(fixture.componentInstance.reading()).toBe(false);
    expect(await page.isListShown()).toBe(true);
    expect(await page.isDetailShown()).toBe(false);
    expect(document.activeElement).toBe(second);
    element.remove();
  });

  it('moves focus only from the list, and back to the list itself when nothing there had it', async () => {
    const { fixture, element } = mount(480);
    const page = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveListDetailHarness);
    fixture.componentInstance.backLabel.set('Все подразделения');
    fixture.componentInstance.reading.set(true);
    await fixture.whenStable();
    expect(await page.isDetailShown()).toBe(true);
    expect(await page.getBackLabel()).toBe('Все подразделения');
    expect(document.activeElement).toBe(document.body);

    await page.goBack();
    await fixture.whenStable();
    expect(document.activeElement).toBe(element.querySelector('.list'));
    expect(element.querySelector('.list')?.getAttribute('data-focus-ring')).toBe('inset');
    element.remove();
  });

  it('moves no focus on the server', async () => {
    const { fixture, element } = mount(480, [{ provide: PLATFORM_ID, useValue: 'server' }]);
    fixture.componentInstance.reading.set(true);
    await fixture.whenStable();
    expect(document.activeElement).toBe(document.body);
    element.remove();
  });
});
