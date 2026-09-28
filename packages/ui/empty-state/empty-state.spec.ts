import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { lucideSearch } from '@avelune/icons/lucide';
import { tokens, type TokenName } from '@avelune/tokens';
import { AveButton } from '@avelune/ui/button';
import { AveEmptyState, AveEmptyStateActions } from '@avelune/ui/empty-state';
import { AveEmptyStateHarness } from '@avelune/ui/empty-state/testing';
import { provideAveIcons } from '@avelune/ui/icon';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

@Component({
  selector: 'ave-empty-state-host',
  imports: [AveButton, AveEmptyState, AveEmptyStateActions],
  providers: [provideAveIcons([lucideSearch])],
  template: `
    <ave-empty-state icon="search" [heading]="heading()">
      <p>Ни один договор не подходит под фильтры.</p>
      <div aveEmptyStateActions>
        <button aveButton type="button">Сбросить фильтры</button>
        <a aveButton variant="primary" href="#new">Создать договор</a>
      </div>
    </ave-empty-state>
    <ave-empty-state heading="Договоров пока нет" />
  `,
})
class EmptyStateHost {
  readonly heading = signal('Ничего не найдено');
}

const used = [
  'space.1',
  'space.2',
  'space.4',
  'space.8',
  'space.12',
  'size.icon.lg',
  'container.sm',
  'radius.full',
  'border-width.default',
  'font.body-md',
  'font.heading-md',
  'color.bg.surface-sunken',
  'color.border.subtle',
  'color.fg.muted',
] as const satisfies readonly TokenName[];

const root = document.documentElement;
const reset = document.createElement('style');
// The kit's reset (ADR 0030): border-box sizing, no margins on paragraphs.
reset.textContent = '*, ::before, ::after { box-sizing: border-box; } p { margin: 0; }';

beforeEach(() => {
  for (const name of used) root.style.setProperty(tokens[name].cssVar, tokens[name].css);
  document.head.append(reset);
});

afterEach(() => {
  for (const name of used) root.style.removeProperty(tokens[name].cssVar);
  reset.remove();
});

function mount(): { fixture: ComponentFixture<EmptyStateHost>; element: HTMLElement } {
  const fixture = TestBed.createComponent(EmptyStateHost);
  const element = fixture.nativeElement as HTMLElement;
  element.style.display = 'block';
  element.style.inlineSize = '800px';
  document.body.append(element);
  fixture.detectChanges();
  return { fixture, element };
}

describe('AveEmptyState', () => {
  it('says what is empty, why, and what to do next', async () => {
    const { fixture } = mount();
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const found = await loader.getHarness(AveEmptyStateHarness.with({ heading: 'Ничего не найдено' }));
    expect(await found.getIcon()).toBe('search');
    expect(await found.getMessage()).toBe('Ни один договор не подходит под фильтры.');
    expect(await found.getActions()).toEqual(['Сбросить фильтры', 'Создать договор']);
    fixture.componentInstance.heading.set('Нет подходящих договоров');
    fixture.detectChanges();
    expect(await found.getHeading()).toBe('Нет подходящих договоров');
    const bare = await loader.getHarness(AveEmptyStateHarness.with({ heading: /пока нет/ }));
    expect(await bare.getIcon()).toBeNull();
    expect(await bare.getActions()).toEqual([]);
  });

  it('centres a column of at most 480px, the icon in a 48px circle, the actions in a row', () => {
    const { element } = mount();
    const state = element.querySelector('ave-empty-state');
    if (state === null) throw new Error('No empty state');
    const box = state.getBoundingClientRect();
    expect(box.width).toBe(480);
    expect(box.left - element.getBoundingClientRect().left).toBe(160);
    const badge = state.querySelector('.badge')?.getBoundingClientRect();
    expect([badge?.width, badge?.height]).toEqual([48, 48]);
    expect((badge?.left ?? 0) + (badge?.width ?? 0) / 2).toBe(box.left + box.width / 2);
    expect(getComputedStyle(state.querySelector('.badge') ?? state).borderTopLeftRadius).toBe(
      tokens['radius.full'].css,
    );
    const [reset, create] = [...state.querySelectorAll('[aveEmptyStateActions] > *')].map((action) =>
      action.getBoundingClientRect(),
    );
    expect(reset?.top).toBe(create?.top);
    expect((create?.left ?? 0) - (reset?.right ?? 0)).toBe(8);
    expect(getComputedStyle(state).textAlign).toBe('center');
  });
});
