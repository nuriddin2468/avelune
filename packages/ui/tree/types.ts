import type { AveIconName } from '@avelune/ui/icon';

/**
 * A node of a tree (ADR 0085): its value, its words, and the nodes under it.
 *
 * @alpha
 */
export interface AveTreeNode<V> {
  /** Names the node among all the tree's nodes; `selected` holds it while the node is chosen. */
  readonly value: V;
  /** The node's words: "Юридический отдел". */
  readonly label: string;
  /** An icon before the words, registered with `provideAveIcons`; decorative. */
  readonly icon?: AveIconName;
  /** Shows the node but keeps it from being chosen; focus still reaches it. */
  readonly disabled?: boolean;
  /** The nodes under it, in order. */
  readonly children?: readonly AveTreeNode<V>[];
  /** Whether it is open when the tree first shows it. */
  readonly expanded?: boolean;
}
