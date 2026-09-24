import { Component, input, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { iconNames, icons } from '@avelune/icons';
import { tokens } from '@avelune/tokens';
import { AveIcon, type AveIconName, type AveIconSize } from '@avelune/ui/icon';
import { AveIconHarness } from '@avelune/ui/icon/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

@Component({
  selector: 'ave-icon-host',
  imports: [AveIcon],
  template: `
    <p>
      <ave-icon name="circle-alert" label="Error" [size]="size()" />
      <ave-icon name="download" decorative /> Download
    </p>
  `,
})
class IconHost {
  readonly size = signal<AveIconSize>('sm');
}

@Component({
  selector: 'ave-icon-gallery',
  imports: [AveIcon],
  template: `
    @for (name of names; track name) {
      <ave-icon [name]="name" decorative />
    }
  `,
})
class Gallery {
  readonly names = iconNames;
}

@Component({
  selector: 'ave-icon-misused',
  imports: [AveIcon],
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

  it('draws every icon of the set, element for element', () => {
    const fixture = TestBed.createComponent(Gallery);
    fixture.detectChanges();
    const hosts = [...(fixture.nativeElement as HTMLElement).querySelectorAll('ave-icon')];
    expect(hosts).toHaveLength(iconNames.length);
    for (const host of hosts) {
      const name = host.getAttribute('data-icon') as AveIconName;
      const drawn = [...(host.querySelector('svg')?.children ?? [])];
      const expected = icons[name];
      expect(
        drawn.map((child) => child.localName),
        name,
      ).toEqual(expected.map((element) => element.tag));
      for (const [index, element] of expected.entries()) {
        for (const [attribute, value] of Object.entries(element)) {
          if (attribute !== 'tag') expect(drawn[index]?.getAttribute(attribute), `${name} ${attribute}`).toBe(value);
        }
      }
      expect(drawn.every((child) => child.namespaceURI === 'http://www.w3.org/2000/svg')).toBe(true);
    }
  });

  it('keeps the svg itself out of the accessibility tree', () => {
    const fixture = TestBed.createComponent(Gallery);
    fixture.detectChanges();
    const svg = (fixture.nativeElement as HTMLElement).querySelector('svg');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
    expect(svg?.getAttribute('focusable')).toBe('false');
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
