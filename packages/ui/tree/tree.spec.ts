import { Component, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { lucideBuilding, lucideUsers } from '@avelune/icons/lucide';
import { tokens, type TokenName } from '@avelune/tokens';
import { provideAveIcons } from '@avelune/ui/icon';
import { AveTree, type AveTreeNode } from '@avelune/ui/tree';
import { AveTreeHarness } from '@avelune/ui/tree/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { AveTreeRows } from './rows';

const departments: readonly AveTreeNode<string>[] = [
  {
    value: 'board',
    label: 'Правление',
    icon: 'building',
    expanded: true,
    children: [
      {
        value: 'legal',
        label: 'Юридический департамент',
        children: [
          { value: 'contracts', label: 'Отдел договоров' },
          { value: 'claims', label: 'Отдел претензионной работы' },
        ],
      },
      {
        value: 'finance',
        label: 'Финансовый департамент',
        children: [{ value: 'accounting', label: 'Бухгалтерия', icon: 'users' }],
      },
      { value: 'archive', label: 'Архив', disabled: true },
    ],
  },
];

@Component({
  selector: 'ave-tree-host',
  imports: [AveTree],
  providers: [provideAveIcons([lucideBuilding, lucideUsers])],
  template: `<ave-tree label="Подразделения" [nodes]="nodes()" [(selected)]="selected" />`,
})
class TreeHost {
  readonly nodes = signal(departments);
  readonly selected = signal<string | undefined>(undefined);
}

const used = [
  'space.1',
  'space.2',
  'space.6',
  'radius.md',
  'radius.full',
  'border-width.selected',
  'control.height.md',
  'size.icon.sm',
  'font.body-md',
  'color.fg.default',
  'color.fg.muted',
  'color.fg.disabled',
  'color.bg.hover',
  'color.bg.active',
  'color.accent.bg',
  'easing.standard',
] as const satisfies readonly TokenName[];

const root = document.documentElement;
const reset = document.createElement('style');
reset.textContent = '*, ::before, ::after { box-sizing: border-box; }';

beforeEach(() => {
  for (const name of used) root.style.setProperty(tokens[name].cssVar, tokens[name].css);
  root.style.setProperty('--ave-font-body-md-line-height', '20px');
  root.style.setProperty('--ave-duration-instant', '0ms');
  root.style.setProperty('--ave-timing-slide', '0ms');
  document.head.append(reset);
});

afterEach(() => {
  for (const name of used) root.style.removeProperty(tokens[name].cssVar);
  for (const name of ['--ave-font-body-md-line-height', '--ave-duration-instant', '--ave-timing-slide'])
    root.style.removeProperty(name);
  reset.remove();
});

async function mount(): Promise<{ fixture: ComponentFixture<TreeHost>; element: HTMLElement; tree: AveTreeHarness }> {
  const fixture = TestBed.createComponent(TreeHost);
  const element = fixture.nativeElement as HTMLElement;
  element.style.display = 'block';
  element.style.inlineSize = '320px';
  document.body.append(element);
  fixture.detectChanges();
  await fixture.whenStable();
  const tree = await TestbedHarnessEnvironment.loader(fixture).getHarness(
    AveTreeHarness.with({ label: 'Подразделения' }),
  );
  return { fixture, element, tree };
}

function row(element: HTMLElement, words: string): HTMLElement {
  const found = [...element.querySelectorAll<HTMLElement>('[role="treeitem"]')].find(
    (item) => item.textContent.trim() === words,
  );
  if (found === undefined) throw new Error(`No row ${words}`);
  return found;
}

describe('AveTree', () => {
  it('draws the open nodes’ rows, each with its level, in a named tree', async () => {
    const { element, tree } = await mount();
    expect(await tree.getLabel()).toBe('Подразделения');
    expect(await tree.getRows()).toEqual([
      { label: 'Правление', level: 1 },
      { label: 'Юридический департамент', level: 2 },
      { label: 'Финансовый департамент', level: 2 },
      { label: 'Архив', level: 2 },
    ]);
    expect(await tree.getSelected()).toBeNull();
    expect(row(element, 'Правление').getAttribute('aria-expanded')).toBe('true');
    expect(row(element, 'Архив').hasAttribute('aria-expanded')).toBe(false);
    expect(row(element, 'Архив').getAttribute('aria-disabled')).toBe('true');
    element.remove();
  });

  it('chooses a node with a click, which opens it too, and with Enter; the arrows move, Right opens, Left closes', async () => {
    const { fixture, element, tree } = await mount();
    await tree.select('Юридический департамент');
    fixture.detectChanges();
    expect(fixture.componentInstance.selected()).toBe('legal');
    expect(await tree.getSelected()).toBe('Юридический департамент');
    expect(await tree.isExpanded('Юридический департамент')).toBe(true);
    expect((await tree.getRows()).map((one) => one.label)).toContain('Отдел договоров');
    row(element, 'Юридический департамент').focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(row(element, 'Отдел договоров'));
    await userEvent.keyboard('{Enter}');
    expect(fixture.componentInstance.selected()).toBe('contracts');
    await userEvent.keyboard('{ArrowLeft}');
    expect(document.activeElement).toBe(row(element, 'Юридический департамент'));
    await tree.collapse('Юридический департамент');
    expect(await tree.isExpanded('Юридический департамент')).toBe(false);
    // Opening from the keyboard chooses nothing.
    await tree.expand('Финансовый департамент');
    expect((await tree.getRows()).map((one) => one.label)).toContain('Бухгалтерия');
    expect(fixture.componentInstance.selected()).toBe('contracts');
    await tree.expand('Юридический департамент');
    expect(await tree.isExpanded('Юридический департамент')).toBe(true);
    // Already as asked: nothing changes.
    await tree.expand('Финансовый департамент');
    await tree.collapse('Архив');
    await expect(tree.select('Отдел кадров')).rejects.toThrow('no row matches');
    element.remove();
  });

  it('opens the nodes above a node chosen from outside, and keeps what the person closed', async () => {
    const { fixture, tree } = await mount();
    fixture.componentInstance.selected.set('accounting');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(await tree.isExpanded('Финансовый департамент')).toBe(true);
    expect(await tree.getSelected()).toBe('Бухгалтерия');
    await tree.collapse('Правление');
    fixture.componentInstance.nodes.set([...departments]);
    fixture.detectChanges();
    expect(await tree.isExpanded('Правление')).toBe(false);
    // A choice the tree does not hold opens nothing.
    fixture.componentInstance.selected.set('nowhere');
    fixture.detectChanges();
    expect(await tree.isExpanded('Правление')).toBe(false);
  });

  it('opens the nodes the data opens once they come from a server', async () => {
    const { fixture, tree } = await mount();
    fixture.componentInstance.nodes.set([]);
    fixture.detectChanges();
    expect(await tree.getRows()).toEqual([]);
    fixture.componentInstance.nodes.set(departments);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(await tree.isExpanded('Правление')).toBe(true);
  });

  it('indents a row 24px a level, keeps a leaf’s room for the chevron, and marks the chosen row with a bar', async () => {
    const { fixture, element, tree } = await mount();
    await tree.select('Финансовый департамент');
    fixture.detectChanges();
    const top = row(element, 'Правление');
    const child = row(element, 'Финансовый департамент');
    const words = (item: HTMLElement) => item.querySelector('.words')?.getBoundingClientRect().left ?? 0;
    const padding = (item: HTMLElement) => Number.parseFloat(getComputedStyle(item).paddingInlineStart);
    expect(padding(top)).toBe(8);
    expect(padding(child) - padding(top)).toBe(24);
    expect(top.getBoundingClientRect().height).toBe(36);
    // The leaf's words line up with a sibling's that has children.
    expect(words(row(element, 'Архив'))).toBe(words(child));
    const bar = getComputedStyle(child, '::before');
    expect(bar.width).toBe('2px');
    expect(getComputedStyle(top, '::before').content).toBe('none');
    expect(getComputedStyle(child.querySelector('.chevron') ?? child).rotate).toBe('90deg');
    expect(await tree.getSelected()).toBe('Финансовый департамент');
    element.remove();
  });

  it('types its template of a level for the compiler', () => {
    const rows = TestBed.runInInjectionContext(() => new AveTreeRows<string>());
    expect(AveTreeRows.ngTemplateContextGuard(rows, { $implicit: [] })).toBe(true);
    expect(AveTreeRows.ngTemplateContextGuard(rows, null)).toBe(false);
  });
});
