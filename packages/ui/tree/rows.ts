import { Directive, input } from '@angular/core';
import type { Tree, TreeItemGroup } from '@angular/aria/tree';
import type { AveTreeNode } from './types';

/** What a level of the tree draws: its nodes, and the tree or the group they belong to. */
export interface AveTreeRowsContext<V> {
  /** The level's nodes, as `let-level`. */
  readonly $implicit: readonly AveTreeNode<V>[];
  /** The tree, or the group of the node above them. */
  readonly parent: Tree<V> | TreeItemGroup<V>;
}

/** Types the tree's template of one level (ADR 0085). Internal to `<ave-tree>`. */
@Directive({ selector: 'ng-template[aveTreeRows]' })
export class AveTreeRows<V> {
  /** The tree's nodes, for the template's type only. */
  readonly aveTreeRowsOf = input<readonly AveTreeNode<V>[]>();

  /** Types the template's context; the compiler reads it. */
  static ngTemplateContextGuard<V>(_directive: AveTreeRows<V>, context: unknown): context is AveTreeRowsContext<V> {
    return typeof context === 'object' && context !== null && '$implicit' in context;
  }
}
