import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, input, linkedSignal, model, untracked } from '@angular/core';
import { Tree, TreeItem, TreeItemGroup } from '@angular/aria/tree';
import { lucideChevronRight } from '@avelune/icons/lucide';
import { AveIcon, provideAveIcons } from '@avelune/ui/icon';
import { AveTreeRows } from './rows';
import type { AveTreeNode } from './types';

/** The values of the nodes above the one with this value, outermost first; `undefined` when no node has it. */
function ancestors<V>(nodes: readonly AveTreeNode<V>[], value: V): V[] | undefined {
  for (const node of nodes) {
    if (Object.is(node.value, value)) return [];
    const below = ancestors(node.children ?? [], value);
    if (below !== undefined) return [node.value, ...below];
  }
  return undefined;
}

/** The values of the nodes the data opens. */
function openedByData<V>(nodes: readonly AveTreeNode<V>[]): V[] {
  return nodes.flatMap((node) => [
    ...(node.expanded === true ? [node.value] : []),
    ...openedByData(node.children ?? []),
  ]);
}

/**
 * The kit's tree (brief §9.4, ADR 0085): nodes under nodes, such as an organisation's departments or a register's
 * folders, on Angular Aria's tree (the WAI-ARIA tree view pattern), drawn from data. One node is chosen, with a click,
 * Enter or Space; the arrows move, Right opens and Left closes. A node opens when the chosen node is under it.
 *
 * ```html
 * <ave-tree label="Подразделения" [nodes]="departments" [(selected)]="department" />
 * ```
 *
 * @alpha
 */
@Component({
  selector: 'ave-tree',
  imports: [AveIcon, AveTreeRows, NgTemplateOutlet, Tree, TreeItem, TreeItemGroup],
  providers: [provideAveIcons([lucideChevronRight])],
  template: `
    <ul
      ngTree
      #tree="ngTree"
      class="tree"
      selectionMode="explicit"
      [attr.aria-label]="label()"
      [value]="chosen()"
      (valueChange)="choose($event)"
    >
      <ng-container [ngTemplateOutlet]="rows" [ngTemplateOutletContext]="{ $implicit: nodes(), parent: tree }" />
    </ul>
    <!-- One level: each node's row, and right after it the rows of its group, which Aria draws while it is open. -->
    <ng-template #rows aveTreeRows [aveTreeRowsOf]="nodes()" let-level let-parent="parent">
      @for (node of level; track node.value) {
        <li
          ngTreeItem
          #item="ngTreeItem"
          class="node"
          [parent]="parent"
          [value]="node.value"
          [label]="node.label"
          [disabled]="node.disabled ?? false"
          [expanded]="isOpen(node.value)"
          (expandedChange)="setOpen(node.value, $event)"
        >
          @if (node.children?.length) {
            <ave-icon class="chevron" name="chevron-right" decorative />
          } @else {
            <span class="leaf"></span>
          }
          @if (node.icon; as icon) {
            <ave-icon class="icon" [name]="icon" decorative />
          }
          <span class="words">{{ node.label }}</span>
        </li>
        @if (node.children?.length) {
          <ng-template ngTreeItemGroup #group="ngTreeItemGroup" [ownedBy]="item">
            <ng-container
              [ngTemplateOutlet]="rows"
              [ngTemplateOutletContext]="{ $implicit: node.children, parent: group }"
            />
          </ng-template>
        }
      }
    </ng-template>
  `,
  styleUrl: './tree.css',
})
export class AveTree<V> {
  /** Names the tree for assistive technology: what its nodes are ("Подразделения"). */
  readonly label = input.required<string>();

  /** The top nodes, with the nodes under them. */
  readonly nodes = input.required<readonly AveTreeNode<V>[]>();

  /** The chosen node's value; none while no node is chosen. */
  readonly selected = model<V>();

  /** The chosen value as Aria's selection. */
  protected readonly chosen = computed(() => {
    const value = this.selected();
    return value === undefined ? [] : [value];
  });

  /** The values of the nodes above the chosen one; it changes only when the choice or its place does. */
  private readonly above = computed(
    () => {
      const selected = this.selected();
      return selected === undefined ? [] : (ancestors(this.nodes(), selected) ?? []);
    },
    { equal: (a, b) => a.length === b.length && a.every((value, index) => Object.is(value, b[index])) },
  );

  /** Whether the tree has nodes: the data's open nodes count once they have come. */
  private readonly ready = computed(() => this.nodes().length > 0);

  /**
   * The open nodes: those the data opens once the tree first has nodes, those above the chosen node when the choice
   * comes, and what the person opened and closed, which new nodes leave as it is.
   */
  private readonly open = linkedSignal<{ above: readonly V[]; ready: boolean }, readonly V[]>({
    source: () => ({ above: this.above(), ready: this.ready() }),
    computation: ({ above, ready }, previous) => {
      const arrived = ready && previous?.source.ready !== true;
      const before = [...(previous?.value ?? []), ...(arrived ? openedByData(untracked(this.nodes)) : [])];
      return [...before, ...above.filter((value) => !before.some((open) => Object.is(open, value)))];
    },
  });

  protected isOpen(value: V): boolean {
    return this.open().some((open) => Object.is(open, value));
  }

  protected setOpen(value: V, open: boolean): void {
    if (open === this.isOpen(value)) return;
    this.open.update((values) => (open ? [...values, value] : values.filter((one) => !Object.is(one, value))));
  }

  /** The person chose a node, or Aria's selection emptied, which leaves the choice as it was. */
  protected choose(values: V[]): void {
    const [value] = values;
    if (value !== undefined) this.selected.set(value);
  }
}
