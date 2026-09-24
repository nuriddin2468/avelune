import { Component, input, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import type { IconNode } from '@avelune/icons';
import { lucideCircleAlert, lucideDownload, lucideX } from '@avelune/icons/lucide';
import { lucideIcons } from '@avelune/icons/lucide/all';
import { tokens } from '@avelune/tokens';
import { AveIcon, defineAveIcon, provideAveIcons, type AveIconName, type AveIconSize } from '@avelune/ui/icon';
import { AveIconHarness } from '@avelune/ui/icon/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

declare module '@avelune/icons' {
  interface IconNames {
    'spec-badge': true;
    'spec-wide': true;
    'spec-fine': true;
  }
}

const badge = defineAveIcon(
  'spec-badge',
  '<svg viewBox="0 0 24 24"><defs><linearGradient id="g"><stop offset="0" stop-color="#f00"/></linearGradient>' +
    '<clipPath id="c"><rect width="24" height="24" rx="4"/></clipPath></defs><g clip-path="url(#c)">' +
    '<rect width="24" height="24" fill="url(#g)"/><use href="#dot"/><circle id="dot" cx="12" cy="12" r="3"/></g></svg>',
  { colors: 'original' },
);
const wideSvg = '<svg viewBox="0 0 48 48" fill="none" stroke="#000"><path d="M4 24h40" stroke-width="4"/></svg>';
const wide = defineAveIcon('spec-wide', wideSvg);
const fine = defineAveIcon('spec-fine', wideSvg, { strokes: 'original' });

@Component({
  selector: 'ave-icon-host',
  imports: [AveIcon],
  providers: [provideAveIcons([lucideCircleAlert, lucideDownload])],
  template: `
    <p>
      <ave-icon name="circle-alert" label="Error" [size]="size()" />
      <ave-icon [name]="name()" decorative /> Download
    </p>
  `,
})
class IconHost {
  readonly size = signal<AveIconSize>('sm');
  readonly name = signal<AveIconName>('download');
}

@Component({
  selector: 'ave-icon-gallery',
  imports: [AveIcon],
  providers: [provideAveIcons(lucideIcons)],
  template: `
    @for (icon of icons; track icon.name) {
      <ave-icon [name]="icon.name" decorative />
    }
  `,
})
class Gallery {
  readonly icons = lucideIcons;
}

@Component({
  selector: 'ave-icon-custom',
  imports: [AveIcon],
  providers: [provideAveIcons([badge, wide, fine])],
  template: `
    <ave-icon name="spec-badge" label="First" />
    <ave-icon name="spec-badge" label="Second" />
    <ave-icon name="spec-wide" decorative [size]="size()" />
    <ave-icon name="spec-fine" decorative />
  `,
})
class Custom {
  readonly size = signal<AveIconSize>('sm');
}

@Component({
  selector: 'ave-icon-inner',
  imports: [AveIcon],
  providers: [provideAveIcons([lucideDownload])],
  template: `<ave-icon name="download" decorative /><ave-icon name="x" decorative />`,
})
class Inner {}

@Component({
  selector: 'ave-icon-outer',
  imports: [AveIcon, Inner],
  template: `<ave-icon-inner /><ave-icon name="x" label="Close" />`,
})
class Outer {}

@Component({
  selector: 'ave-icon-unregistered',
  imports: [AveIcon],
  template: `<ave-icon name="calendar-days" decorative />`,
})
class Unregistered {}

@Component({
  selector: 'ave-icon-misused',
  imports: [AveIcon],
  providers: [provideAveIcons([lucideX])],
  template: `<ave-icon name="x" [label]="label()" [decorative]="decorative()" />`,
})
class Misused {
  readonly label = input<string>();
  readonly decorative = input(false);
}

const root = document.documentElement;
const sizeTokens = ['size.icon.sm', 'size.icon.md', 'size.icon.lg'] as const;

// The test page has no tokens.css; the icon sizes come from the tokens themselves.
beforeEach(() => {
  for (const name of sizeTokens) root.style.setProperty(tokens[name].cssVar, tokens[name].css);
});

afterEach(() => {
  for (const name of sizeTokens) root.style.removeProperty(tokens[name].cssVar);
});

function setup() {
  const fixture = TestBed.createComponent(IconHost);
  document.body.append(fixture.nativeElement as HTMLElement);
  return { fixture, loader: TestbedHarnessEnvironment.loader(fixture) };
}

/** Checks that a drawn element is the node it was drawn from, attribute for attribute and child for child. */
function expectDrawn(element: Element | undefined, node: IconNode, where: string): void {
  expect(element?.localName, where).toBe(node.tag);
  expect(element?.namespaceURI, where).toBe('http://www.w3.org/2000/svg');
  for (const [attribute, value] of Object.entries(node.attrs)) {
    expect(element?.getAttribute(attribute), `${where} ${attribute}`).toBe(value);
  }
  const children = [...(element?.children ?? [])];
  expect(children, where).toHaveLength(node.children?.length ?? 0);
  for (const [index, child] of (node.children ?? []).entries()) expectDrawn(children[index], child, where);
}

describe('AveIcon', () => {
  it('names an icon that carries meaning and hides a decorative one', async () => {
    const { loader } = setup();
    const error = await loader.getHarness(AveIconHarness.with({ name: 'circle-alert' }));
    expect(await error.getLabel()).toBe('Error');
    expect(await error.isDecorative()).toBe(false);
    expect(await (await error.host()).getAttribute('role')).toBe('img');

    const download = await loader.getHarness(AveIconHarness.with({ name: 'download' }));
    expect(await download.getLabel()).toBeNull();
    expect(await download.isDecorative()).toBe(true);
    expect(await (await download.host()).getAttribute('role')).toBeNull();
    expect(await loader.getAllHarnesses(AveIconHarness.with({ label: 'Error' }))).toHaveLength(1);
  });

  it.each([
    ['sm', 'size.icon.sm', 1.5],
    ['md', 'size.icon.md', 1.5],
    ['lg', 'size.icon.lg', 1.75],
  ] as const)('draws %s at its token size with a frozen stroke width', async (size, token, stroke) => {
    const { fixture, loader } = setup();
    fixture.componentInstance.size.set(size);
    const icon = await loader.getHarness(AveIconHarness.with({ name: 'circle-alert' }));
    expect(await icon.getSize()).toBe(size);
    const rendered = await icon.getRenderedSize();
    expect(rendered.size).toBe(tokens[token].value);
    expect(rendered.stroke).toBeCloseTo(stroke, 5);
  });

  it('defaults to the small size', async () => {
    const { loader } = setup();
    const download = await loader.getHarness(AveIconHarness.with({ name: 'download' }));
    expect(await download.getSize()).toBe('sm');
  });

  it('redraws when the name changes, keeping one svg', () => {
    const { fixture } = setup();
    fixture.detectChanges();
    fixture.componentInstance.name.set('circle-alert');
    fixture.detectChanges();
    const host = (fixture.nativeElement as HTMLElement).querySelectorAll('ave-icon')[1];
    expect(host?.getAttribute('data-icon')).toBe('circle-alert');
    expect(host?.children).toHaveLength(1);
    const [node] = lucideCircleAlert.nodes;
    if (node === undefined) throw new Error('circle-alert has elements');
    expectDrawn(host?.querySelector('svg')?.firstElementChild ?? undefined, node, 'renamed');
  });

  it("draws every Lucide icon, element for element, in Lucide's paint", () => {
    const fixture = TestBed.createComponent(Gallery);
    fixture.detectChanges();
    const hosts = [...(fixture.nativeElement as HTMLElement).querySelectorAll('ave-icon')];
    expect(hosts).toHaveLength(lucideIcons.length);
    for (const [index, icon] of lucideIcons.entries()) {
      const svg = hosts[index]?.querySelector('svg');
      expect(svg?.getAttribute('viewBox'), icon.name).toBe('0 0 24 24');
      expect(svg?.getAttribute('fill'), icon.name).toBe('none');
      expect(svg?.getAttribute('stroke'), icon.name).toBe('currentColor');
      expect(svg?.getAttribute('stroke-linecap'), icon.name).toBe('round');
      expect(svg?.getAttribute('stroke-linejoin'), icon.name).toBe('round');
      expect(svg?.getAttribute('stroke-width'), icon.name).toBe('2.25');
      const drawn = [...(svg?.children ?? [])];
      expect(drawn, icon.name).toHaveLength(icon.nodes.length);
      for (const [position, node] of icon.nodes.entries()) expectDrawn(drawn[position], node, icon.name);
    }
  });

  it('keeps the svg itself out of the accessibility tree and styles it as a block', () => {
    const { fixture } = setup();
    fixture.detectChanges();
    const svg = (fixture.nativeElement as HTMLElement).querySelector('svg');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
    expect(svg?.getAttribute('focusable')).toBe('false');
    expect(svg === null ? '' : getComputedStyle(svg).display).toBe('block');
  });

  it("draws an application's icon with ids unique to each icon on the page", () => {
    const fixture = TestBed.createComponent(Custom);
    fixture.detectChanges();
    const [first, second] = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll('ave-icon[data-icon="spec-badge"] svg'),
    ];
    const ids = (svg: Element | undefined) => [...(svg?.querySelectorAll('[id]') ?? [])].map((element) => element.id);
    expect(ids(first)).toHaveLength(3);
    expect(ids(first).some((id) => ids(second).includes(id))).toBe(false);
    const prefix = ids(first)[0]?.replace(/g$/, '') ?? '';
    expect(prefix).toMatch(/^ave-icon-\d+-$/);
    expect(first?.querySelector('g')?.getAttribute('clip-path')).toBe(`url(#${prefix}c)`);
    expect(first?.querySelector('g > rect')?.getAttribute('fill')).toBe(`url(#${prefix}g)`);
    expect(first?.querySelector('use')?.getAttribute('href')).toBe(`#${prefix}dot`);
  });

  it('gives kit strokes to a drawing of any size, and keeps the strokes it asks to keep', async () => {
    const fixture = TestBed.createComponent(Custom);
    document.body.append(fixture.nativeElement as HTMLElement);
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const wideIcon = await loader.getHarness(AveIconHarness.with({ name: 'spec-wide' }));
    expect((await wideIcon.getRenderedSize()).stroke).toBeCloseTo(1.5, 5);
    const drawnWide = (fixture.nativeElement as HTMLElement).querySelector('[data-icon="spec-wide"] path');
    expect(drawnWide?.getAttribute('stroke-width')).toBe('4.5');
    fixture.componentInstance.size.set('lg');
    fixture.detectChanges();
    expect((await wideIcon.getRenderedSize()).stroke).toBeCloseTo(1.75, 5);

    const fineIcon = await loader.getHarness(AveIconHarness.with({ name: 'spec-fine' }));
    expect((await fineIcon.getRenderedSize()).stroke).toBe(0);
    const drawnFine = (fixture.nativeElement as HTMLElement).querySelector('[data-icon="spec-fine"] path');
    expect(drawnFine?.getAttribute('stroke-width')).toBe('4');
  });

  it("sees the icons of its own component's providers and of every ancestor", () => {
    TestBed.configureTestingModule({ providers: [provideAveIcons([lucideX])] });
    const fixture = TestBed.createComponent(Outer);
    fixture.detectChanges();
    const drawn = [...(fixture.nativeElement as HTMLElement).querySelectorAll('ave-icon')].map(
      (host) => `${host.getAttribute('data-icon') ?? ''}:${String(host.querySelector('svg')?.childElementCount)}`,
    );
    expect(drawn).toEqual([
      `download:${String(lucideDownload.nodes.length)}`,
      `x:${String(lucideX.nodes.length)}`,
      `x:${String(lucideX.nodes.length)}`,
    ]);
  });

  it('throws in development for a name no provider registered, naming the export to add', () => {
    const fixture = TestBed.createComponent(Unregistered);
    expect(() => {
      fixture.detectChanges();
    }).toThrow(
      '<ave-icon name="calendar-days">: no icon of this name is registered. Add lucideCalendarDays from ' +
        '@avelune/icons/lucide, or your own icon from defineAveIcon(), to provideAveIcons() in the providers of the ' +
        'application, the route or the component.',
    );
  });

  it('throws in development without a label or decorative, and with both', () => {
    const neither = TestBed.createComponent(Misused);
    expect(() => {
      neither.detectChanges();
    }).toThrow('<ave-icon name="x">: set a label, or mark it decorative when text says the same.');

    const blank = TestBed.createComponent(Misused);
    blank.componentRef.setInput('label', '  ');
    expect(() => {
      blank.detectChanges();
    }).toThrow('set a label');

    const both = TestBed.createComponent(Misused);
    both.componentRef.setInput('label', 'Close');
    both.componentRef.setInput('decorative', true);
    expect(() => {
      both.detectChanges();
    }).toThrow('<ave-icon name="x">: a decorative icon has no label; remove one of the two.');
  });

  it('matches every icon without filters, and fails an icon without a name', async () => {
    const { fixture, loader } = setup();
    expect(await loader.getAllHarnesses(AveIconHarness.with())).toHaveLength(2);
    const [first] = await loader.getAllHarnesses(AveIconHarness);
    (fixture.nativeElement as HTMLElement).querySelector('ave-icon')?.removeAttribute('data-icon');
    await expect(first?.getName()).rejects.toThrow('the icon has no data-icon');
  });

  it('rejects a size the harness does not know', async () => {
    const { fixture, loader } = setup();
    const icon = await loader.getHarness(AveIconHarness.with({ name: 'download' }));
    (fixture.nativeElement as HTMLElement).querySelector('[data-icon="download"]')?.setAttribute('data-size', 'xl');
    await expect(icon.getSize()).rejects.toThrow('unexpected data-size "xl"');
  });
});
