import type { IconAttributes, IconNode } from '@avelune/icons';
import { readSvg } from './svg';
import type { AveIconDefinition, AveIconName } from './types';

/**
 * How `<ave-icon>` paints an application's own icon (ADR 0036).
 *
 * @beta
 */
export interface AveCustomIconOptions {
  /**
   * `current` (default): every colour of the SVG becomes the colour of the text around the icon, so it follows the
   * theme and the states of its component. `original`: the SVG keeps its own colours, for a multicolour icon; check
   * it in both themes, since those colours do not follow the theme.
   */
  readonly colors?: 'current' | 'original';
  /**
   * `kit` (default): strokes take the kit's width for each size, as Lucide's icons do. `original`: strokes keep the
   * width they were drawn with, scaled with the icon.
   */
  readonly strokes?: 'kit' | 'original';
}

const paintProperties = ['fill', 'stroke', 'stop-color'] as const;

/** A colour to replace: anything painted that is not already the current colour or a gradient reference. */
function isColour(value: string): boolean {
  return !/^(?:none|transparent|currentColor|inherit)$/i.test(value) && !value.startsWith('url(');
}

function inCurrentColour(attributes: IconAttributes): IconAttributes {
  const painted: Record<string, string | undefined> = { ...attributes };
  for (const property of paintProperties) {
    const value = attributes[property];
    if (value !== undefined && isColour(value)) painted[property] = 'currentColor';
  }
  return painted;
}

function nodeInCurrentColour(node: IconNode): IconNode {
  const attrs = inCurrentColour(node.attrs);
  return node.children === undefined
    ? { tag: node.tag, attrs }
    : { tag: node.tag, attrs, children: node.children.map(nodeInCurrentColour) };
}

/**
 * Turns an application's SVG into an icon for `provideAveIcons` (ADR 0036). Any static SVG works; by default it
 * is fitted to the kit: drawn in the text colour, with the kit's stroke widths, in the square of the icon size. Draw
 * new icons as Lucide's are drawn (24 × 24 canvas, 2px round strokes); the Storybook page "Guides / Custom icons /
 * Check your icon" compares one with Lucide's.
 *
 * Declare the name first, so templates accept it:
 *
 * ```ts
 * declare module '@avelune/icons' {
 *   interface IconNames {
 *     'company-mark': true;
 *   }
 * }
 *
 * export const companyMark = defineAveIcon('company-mark', companyMarkSvg);
 * ```
 *
 * Throws, listing every problem, on markup that is not SVG or that an icon may not contain: scripts, style sheets,
 * classes, event handlers, embedded content, text, animation, or references outside the icon.
 *
 * @beta
 */
export function defineAveIcon<const TName extends AveIconName>(
  name: TName,
  svg: string,
  options: AveCustomIconOptions = {},
): AveIconDefinition<TName> {
  const result = readSvg(svg);
  if (result.drawing === undefined) {
    throw new Error(
      `defineAveIcon("${name}"): the SVG cannot be used as an icon:\n${result.problems.map((problem) => `- ${problem}`).join('\n')}`,
    );
  }
  const { viewBox, paint, nodes } = result.drawing;
  const strokes = options.strokes ?? 'kit';
  if (options.colors === 'original') return { name, viewBox, paint, strokes, nodes };
  // An SVG paints unfilled shapes black; in the current colour, that black is the text colour too.
  return {
    name,
    viewBox,
    paint: inCurrentColour({ fill: 'currentColor', ...paint }),
    strokes,
    nodes: nodes.map(nodeInCurrentColour),
  };
}
