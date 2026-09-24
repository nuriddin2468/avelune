import { defineAveIcon } from '@avelune/ui/icon';
import { describe, expect, it } from 'vitest';

declare module '@avelune/icons' {
  interface IconNames {
    'spec-mark': true;
  }
}

const mark =
  '<svg viewBox="0 0 24 24" stroke="#1E1E1E"><defs><linearGradient id="g"><stop offset="0" stop-color="red"/>' +
  '</linearGradient></defs><path d="M0 0" fill="url(#g)"/><circle cx="1" cy="1" r="1" fill="none"/>' +
  '<rect width="2" height="2" fill="#0a0" stroke="transparent" stroke-width="1"/></svg>';

describe('defineAveIcon', () => {
  it('paints in the text colour and takes the kit strokes by default', () => {
    const icon = defineAveIcon('spec-mark', mark);
    expect(icon.name).toBe('spec-mark');
    expect(icon.viewBox).toBe('0 0 24 24');
    expect(icon.strokes).toBe('kit');
    // Unfilled shapes, black in SVG, follow the text colour too.
    expect(icon.paint).toEqual({ fill: 'currentColor', stroke: 'currentColor' });
    expect(icon.nodes).toEqual([
      {
        tag: 'defs',
        attrs: {},
        children: [
          {
            tag: 'linearGradient',
            attrs: { id: 'g' },
            children: [{ tag: 'stop', attrs: { offset: '0', 'stop-color': 'currentColor' } }],
          },
        ],
      },
      { tag: 'path', attrs: { d: 'M0 0', fill: 'url(#g)' } },
      { tag: 'circle', attrs: { cx: '1', cy: '1', r: '1', fill: 'none' } },
      {
        tag: 'rect',
        attrs: { width: '2', height: '2', fill: 'currentColor', stroke: 'transparent', 'stroke-width': '1' },
      },
    ]);
  });

  it('keeps the colours and strokes of the SVG when asked', () => {
    const icon = defineAveIcon('spec-mark', mark, { colors: 'original', strokes: 'original' });
    expect(icon.strokes).toBe('original');
    expect(icon.paint).toEqual({ stroke: '#1E1E1E' });
    expect(icon.nodes[3]).toEqual({
      tag: 'rect',
      attrs: { width: '2', height: '2', fill: '#0a0', stroke: 'transparent', 'stroke-width': '1' },
    });
  });

  it('keeps a fill the SVG sets on its root', () => {
    expect(defineAveIcon('spec-mark', '<svg viewBox="0 0 8 8" fill="none"><path d="M0 0"/></svg>').paint).toEqual({
      fill: 'none',
    });
  });

  it('throws with every problem of the SVG, named after the icon', () => {
    expect(() => defineAveIcon('spec-mark', '<svg viewBox="0 0 24 24"><script/><path class="a" d="M0 0"/></svg>'))
      .toThrow(`defineAveIcon("spec-mark"): the SVG cannot be used as an icon:
- <script> (element 2): scripts are not allowed
- <path> (element 3): class needs a stylesheet, which an icon cannot carry; export with presentation attributes`);
  });
});
