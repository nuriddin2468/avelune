import { describe, expect, it } from 'vitest';
import { readSvg } from './svg';

/** The problems of an SVG the kit refuses; fails the test when it is accepted. */
function problemsOf(svg: string): readonly string[] {
  const result = readSvg(svg);
  if (result.problems === undefined) throw new Error('expected the SVG to be refused');
  return result.problems;
}

/** The drawing of an SVG the kit accepts; fails the test with the problems when it is refused. */
function drawingOf(svg: string) {
  const result = readSvg(svg);
  if (result.drawing === undefined) throw new Error(result.problems.join('\n'));
  return result.drawing;
}

const svg = (content: string, root = 'viewBox="0 0 24 24"') =>
  `<svg xmlns="http://www.w3.org/2000/svg" ${root}>${content}</svg>`;

describe('readSvg', () => {
  it('reads a Figma export: root paint, strokes and geometry', () => {
    const drawing = drawingOf(
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">\n' +
        '  <path d="M3 12h18" stroke="#1E1E1E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>\n' +
        '</svg>\n',
    );
    expect(drawing).toEqual({
      viewBox: '0 0 24 24',
      paint: { fill: 'none' },
      nodes: [
        {
          tag: 'path',
          attrs: {
            d: 'M3 12h18',
            stroke: '#1E1E1E',
            'stroke-width': '2',
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round',
          },
        },
      ],
    });
  });

  it('reads an Inkscape export: styles become attributes, editor data and hidden layers are dropped', () => {
    const drawing = drawingOf(`<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!-- Created with Inkscape (http://www.inkscape.org/) -->
<svg width="24" height="24" viewBox="0 0 24 24" version="1.1" id="svg1" sodipodi:docname="mark.svg"
   xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
   xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd"
   xmlns="http://www.w3.org/2000/svg">
  <sodipodi:namedview id="namedview1" pagecolor="#ffffff"><inkscape:page x="0" y="0" /></sodipodi:namedview>
  <title>Mark</title>
  <defs id="defs1" />
  <g inkscape:label="Layer 1" inkscape:groupmode="layer" id="layer1" data-name="Layer 1">
    <path style="fill:none;stroke:#000000;stroke-width:2 !important;stroke-linecap:round;-inkscape-stroke:none;font-variation-settings:normal"
       stroke="red" d="M 4,12 H 20" id="path1" />
  </g>
  <g style="display:none" id="hidden"><circle cx="1" cy="1" r="1" /></g>
  <rect display="none" width="1" height="1" />
  <rect display="inline" width="2" height="2" />
</svg>`);
    expect(drawing.viewBox).toBe('0 0 24 24');
    expect(drawing.paint).toEqual({});
    expect(drawing.nodes).toEqual([
      { tag: 'defs', attrs: { id: 'defs1' }, children: [] },
      {
        tag: 'g',
        attrs: { id: 'layer1' },
        children: [
          {
            tag: 'path',
            attrs: {
              stroke: '#000000',
              d: 'M 4,12 H 20',
              id: 'path1',
              fill: 'none',
              'stroke-width': '2',
              'stroke-linecap': 'round',
            },
          },
        ],
      },
      { tag: 'rect', attrs: { width: '2', height: '2' } },
    ]);
  });

  it('reads a multicolour drawing with gradients, clip paths and references inside the icon', () => {
    const drawing = drawingOf(
      svg(
        '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f00"/>' +
          '<stop offset="1" stop-color="#00f"/></linearGradient><clipPath id="c"><rect width="32" height="32" rx="4"/>' +
          '</clipPath></defs><g clip-path="url(#c)"><rect width="32" height="32" fill="url(\'#g\') #000"/>' +
          '<use xlink:href="#dot" x="4"/><circle id="dot" cx="8" cy="8" r="2" fill="#fff"/></g>',
        'viewBox="0,0,32,32" xmlns:xlink="http://www.w3.org/1999/xlink"',
      ),
    );
    expect(drawing.viewBox).toBe('0 0 32 32');
    expect(drawing.nodes[1]).toEqual({
      tag: 'g',
      attrs: { 'clip-path': 'url(#c)' },
      children: [
        { tag: 'rect', attrs: { width: '32', height: '32', fill: "url('#g') #000" } },
        { tag: 'use', attrs: { href: '#dot', x: '4' } },
        { tag: 'circle', attrs: { id: 'dot', cx: '8', cy: '8', r: '2', fill: '#fff' } },
      ],
    });
  });

  it('takes the size in pixels when there is no viewBox, and decodes XML entities', () => {
    const drawing = drawingOf(
      '<?xml version="1.0"?><svg width="48px" height="40" xmlns="http://www.w3.org/2000/svg">' +
        '<!-- a comment --><path d="M0 0&#32;L1 1&#x20;z" stroke-dasharray="1 &amp; 2 &lt;&gt;&quot;&apos;"/></svg>',
    );
    expect(drawing.viewBox).toBe('0 0 48 40');
    expect(drawing.nodes).toEqual([{ tag: 'path', attrs: { d: 'M0 0 L1 1 z', 'stroke-dasharray': '1 & 2 <>"\'' } }]);
  });

  it('keeps a byte order mark and single quotes out of the way', () => {
    expect(drawingOf(`\uFEFF<svg viewBox='0 0 24 24'><circle cx='12' cy='12' r='4' /></svg>`).nodes).toEqual([
      { tag: 'circle', attrs: { cx: '12', cy: '12', r: '4' } },
    ]);
  });

  it('refuses scripts, style sheets, embedded content, text and animation, saying what to do instead', () => {
    expect(
      problemsOf(
        svg(
          '<script>alert(1)</script><style>.a{}</style><foreignObject/><image href="#x"/><text>Hi</text>' +
            '<animate/><filter/><blink/>',
        ),
      ),
    ).toEqual([
      '<script> (element 2): scripts are not allowed',
      '<style> (element 3): a <style> sheet is not supported; export with presentation attributes',
      '<foreignObject> (element 4): embedded HTML is not allowed',
      '<image> (element 5): embedded images are not allowed; use <img> for pictures',
      '<text> (element 6): text is not supported; convert it to outlines',
      '<animate> (element 7): icons do not animate; the kit animates components, not their icons',
      '<filter> (element 8): filters are not supported; draw the effect with shapes',
      '<blink> (element 9): not an element an icon may contain',
      '<svg>: draws nothing',
    ]);
  });

  it('refuses classes, event handlers, unknown attributes and style properties, and references outside', () => {
    expect(
      problemsOf(
        svg(
          '<path class="st0" d="M0 0"/><path onclick="x()" d="M0 0"/><path d="M0 0" filter="blur(1)"/>' +
            '<path d="M0 0" style="filter: blur(1px)"/><use href="https://example.com/a.svg#x"/>' +
            '<path d="M0 0" fill="url(https://example.com/p.svg#g)"/><path d="M0 0" transform="url(#g)"/>' +
            '<use href="javascript:alert(1)"/><use href="#missing"/><path d="M0 0" fill="url(#nowhere)"/>',
        ),
      ),
    ).toEqual([
      '<path> (element 2): class needs a stylesheet, which an icon cannot carry; export with presentation attributes',
      '<path> (element 3): event handler "onclick" is not allowed',
      '<path> (element 4): attribute "filter" is not supported',
      '<path> (element 5): style property "filter" is not supported',
      '<use> (element 6): href "https://example.com/a.svg#x" points outside the icon; only #id references are allowed',
      '<path> (element 7): "fill" refers outside the icon; only url(#id) paint and clipping are allowed',
      '<path> (element 8): "transform" refers outside the icon; only url(#id) paint and clipping are allowed',
      '<use> (element 9): "href" contains a script URL',
      '<use> (element 10): refers to #missing, which the icon does not define',
      '<path> (element 11): refers to #nowhere, which the icon does not define',
    ]);
  });

  it('refuses ids used twice or not valid, children of a shape, and text among the shapes', () => {
    expect(
      problemsOf(
        svg(
          '<circle id="a" cx="1" cy="1" r="1"/><circle id="a" cx="1" cy="1" r="1"/><path id="1x" d="M0 0"/>' +
            '<path d="M0 0"><circle r="1"/></path>stray<g>words<path d="M0 0"/></g>',
        ),
      ),
    ).toEqual([
      '<svg>: text is not supported; convert it to outlines',
      '<circle> (element 3): id "a" is used twice',
      '<path> (element 4): id "1x" is not a valid name',
      '<circle> (element 6): a <path> has no children',
      '<g> (element 7): text is not supported; convert it to outlines',
    ]);
  });

  it('refuses root attributes that would change the drawing without a place to keep them', () => {
    expect(problemsOf(svg('<path d="M0 0"/>', 'viewBox="0 0 24 24" transform="rotate(45)"'))).toEqual([
      '<svg>: attribute "transform" is not supported',
    ]);
  });

  it('refuses a missing or invalid coordinate system', () => {
    expect(problemsOf('<svg><path d="M0 0"/></svg>')).toEqual([
      '<svg>: needs a viewBox, or a width and height in pixels',
    ]);
    expect(problemsOf('<svg viewBox="0 0 0 24"><path d="M0 0"/></svg>')).toEqual([
      '<svg>: viewBox "0 0 0 24" is not four numbers with a positive width and height',
    ]);
    expect(problemsOf('<svg viewBox="0 0 24"><path d="M0 0"/></svg>')).toEqual([
      '<svg>: viewBox "0 0 24" is not four numbers with a positive width and height',
    ]);
  });

  it('refuses markup that is not SVG, not well formed, or carries a DTD', () => {
    expect(problemsOf('hello')).toEqual(['the text is not SVG markup']);
    expect(problemsOf('<path d="M0 0"/>')).toEqual(['the root element is <path>, not <svg>']);
    expect(problemsOf('<!DOCTYPE svg [<!ENTITY x "y">]><svg/>')).toEqual([
      '<!DOCTYPE>, entity declarations and CDATA are not allowed',
    ]);
    expect(problemsOf(svg('<![CDATA[x]]>'))).toEqual(['<!DOCTYPE>, entity declarations and CDATA are not allowed']);
    expect(problemsOf('<?xml-stylesheet href="a.css"?><svg/>')).toEqual([
      'processing instructions other than <?xml …?> are not allowed',
    ]);
    expect(problemsOf('<!-- open <svg/>')).toEqual(['a comment is not closed']);
    expect(problemsOf(svg('<path d="M0 0">'))).toEqual(['<path> (element 2): closed by </svg>']);
    expect(problemsOf('<svg viewBox="0 0 24 24"><path d="M0 0"/>')).toEqual(['<svg> (element 1): not closed']);
    expect(problemsOf(`${svg('<path d="M0 0"/>')}<svg/>`)).toEqual(['there is content after the closing </svg>']);
    expect(problemsOf('< svg/>')).toEqual(['element 1: not a valid element name']);
    expect(problemsOf('<svg viewBox>')).toEqual(['<svg> (element 1): an attribute is not written as name="value"']);
    expect(problemsOf('<svg viewBox=24>')).toEqual(['<svg> (element 1): attribute "viewBox" is not quoted']);
    expect(problemsOf('<svg viewBox="0 0 24 24>')).toEqual(['<svg> (element 1): attribute "viewBox" is not closed']);
    expect(problemsOf(svg('<path d="M0 0 <z"/>'))).toEqual(['<path> (element 2): attribute "d" contains "<"']);
    expect(problemsOf(svg('<path d="M0&nbsp;0"/>'))).toEqual([
      "<path> (element 2): an unknown entity (only XML's five and &#…;)",
    ]);
  });

  it('skips comments and a declaration between elements', () => {
    expect(drawingOf(svg('<!-- one --><path d="M0 0"/><!-- two --><?xml version="1.0"?>')).nodes).toHaveLength(1);
  });
});
