import type { Renderer2 } from '@angular/core';
import type { IconAttributes, IconNode } from '@avelune/icons';
import type { AveIconDefinition, AveIconSize } from './types';

/**
 * The kit's stroke widths in units of a 24-unit drawing, frozen with the kit (ADR 0033): 1.5px at 16 and 20px, 1.75px
 * at 24px, so strokes stay as heavy as the text they stand next to.
 */
const strokeUnits = { sm: 2.25, md: 1.8, lg: 1.75 } as const satisfies Record<AveIconSize, number>;

/** The side of Lucide's grid, which the frozen stroke units are measured on. */
const lucideGrid = 24;

/**
 * The kit's stroke width for a size, in units of the drawing's viewBox. The SVG scales its largest side to the icon
 * box, so a drawing twice as large as Lucide's grid needs strokes twice as wide. Rounded to four decimals.
 */
export function kitStrokeWidth(viewBox: string, size: AveIconSize): string {
  const [, , width = 0, height = 0] = viewBox.split(' ').map(Number);
  const units = (strokeUnits[size] * Math.max(width, height)) / lucideGrid;
  return String(Math.round(units * 10_000) / 10_000);
}

/** One attribute value with the icon's ids made unique to this `<ave-icon>`, so two icons on a page never share one. */
function scoped(attribute: string, value: string, prefix: string): string {
  if (attribute === 'id') return `${prefix}${value}`;
  if (attribute === 'href') return `#${prefix}${value.slice(1)}`;
  return value.replace(/url\(\s*(['"]?)#/g, `url($1#${prefix}`);
}

function setAttributes(
  renderer: Renderer2,
  element: Element,
  attributes: IconAttributes,
  stroke: string | null,
  prefix: string,
): void {
  for (const [attribute, value] of Object.entries(attributes)) {
    renderer.setAttribute(
      element,
      attribute,
      attribute === 'stroke-width' && stroke !== null ? stroke : scoped(attribute, value, prefix),
    );
  }
}

function drawNode(renderer: Renderer2, node: IconNode, stroke: string | null, prefix: string): Element {
  const element = renderer.createElement(node.tag, 'svg') as Element;
  setAttributes(renderer, element, node.attrs, stroke, prefix);
  for (const child of node.children ?? []) renderer.appendChild(element, drawNode(renderer, child, stroke, prefix));
  return element;
}

/**
 * Replaces the content of `host` with the icon's `<svg>`, hidden from assistive technology and never focusable.
 * Elements are created through the component's renderer, never as markup, so nothing is parsed or sanitised here, and
 * the component's styles reach them. Without an icon, the `<svg>` is empty and keeps the box.
 */
export function drawIcon(
  renderer: Renderer2,
  host: Element,
  icon: AveIconDefinition | null,
  size: AveIconSize,
  prefix: string,
): void {
  for (const child of Array.from(host.childNodes)) renderer.removeChild(host, child);
  const svg = renderer.createElement('svg', 'svg') as Element;
  renderer.setAttribute(svg, 'viewBox', icon?.viewBox ?? '0 0 24 24');
  renderer.setAttribute(svg, 'aria-hidden', 'true');
  renderer.setAttribute(svg, 'focusable', 'false');
  if (icon !== null) {
    const stroke = icon.strokes === 'kit' ? kitStrokeWidth(icon.viewBox, size) : null;
    setAttributes(renderer, svg, icon.paint, stroke, prefix);
    if (stroke !== null) renderer.setAttribute(svg, 'stroke-width', stroke);
    for (const node of icon.nodes) renderer.appendChild(svg, drawNode(renderer, node, stroke, prefix));
  }
  renderer.appendChild(host, svg);
}
