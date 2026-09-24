import { RendererFactory2 } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { drawIcon, kitStrokeWidth } from './draw';

describe('kitStrokeWidth', () => {
  it("keeps the frozen widths on Lucide's 24-unit grid", () => {
    expect(kitStrokeWidth('0 0 24 24', 'sm')).toBe('2.25');
    expect(kitStrokeWidth('0 0 24 24', 'md')).toBe('1.8');
    expect(kitStrokeWidth('0 0 24 24', 'lg')).toBe('1.75');
  });

  it('scales with the largest side of another drawing, so the rendered width stays the same', () => {
    expect(kitStrokeWidth('0 0 48 48', 'sm')).toBe('4.5');
    expect(kitStrokeWidth('0 0 32 16', 'md')).toBe('2.4');
    expect(kitStrokeWidth('-4 -4 16 18', 'lg')).toBe('1.3125');
  });
});

describe('drawIcon', () => {
  it('draws an empty, hidden svg in the box when there is no icon', () => {
    const renderer = TestBed.inject(RendererFactory2).createRenderer(null, null);
    const host = document.createElement('span');
    host.append(document.createElement('b'));
    drawIcon(renderer, host, null, 'sm', 'p-');
    expect(host.children).toHaveLength(1);
    const svg = host.firstElementChild;
    expect(svg?.namespaceURI).toBe('http://www.w3.org/2000/svg');
    expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
    expect(svg?.getAttribute('focusable')).toBe('false');
    expect(svg?.childElementCount).toBe(0);
  });
});
