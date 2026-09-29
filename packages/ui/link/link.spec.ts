import { Component, LOCALE_ID } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { Location } from '@angular/common';
import { provideLocationMocks } from '@angular/common/testing';
import { RouterLink, provideRouter } from '@angular/router';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { tokens, type TokenName } from '@avelune/tokens';
import { AveLink } from '@avelune/ui/link';
import { AveLinkHarness } from '@avelune/ui/link/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';

@Component({ selector: 'ave-link-page', template: '' })
class Page {}

@Component({
  selector: 'ave-link-host',
  imports: [AveLink, RouterLink],
  template: `
    <p class="text">
      Продлите <a aveLink routerLink="/contracts/109">договор ДК-2025/109</a> или закройте его. Порядок описан в
      <a aveLink href="https://lex.uz/docs/1234" target="_blank">регламенте согласования</a>.
    </p>
  `,
})
class LinkHost {}

const used = [
  'space.1',
  'radius.sm',
  'border-width.default',
  'border-width.selected',
  'size.icon.sm',
  'color.fg.link',
] as const satisfies readonly TokenName[];

const root = document.documentElement;

beforeEach(() => {
  for (const name of used) root.style.setProperty(tokens[name].cssVar, tokens[name].css);
  TestBed.configureTestingModule({
    providers: [
      { provide: LOCALE_ID, useValue: 'ru' },
      provideRouter([{ path: '**', component: Page }]),
      provideLocationMocks(),
    ],
  });
});

afterEach(() => {
  for (const name of used) root.style.removeProperty(tokens[name].cssVar);
});

async function mount(): Promise<{ fixture: ComponentFixture<LinkHost>; element: HTMLElement }> {
  const fixture = TestBed.createComponent(LinkHost);
  const element = fixture.nativeElement as HTMLElement;
  document.body.prepend(element);
  fixture.detectChanges();
  await fixture.whenStable();
  return { fixture, element };
}

describe('AveLink', () => {
  it('is a native link through the router, underlined in the link colour', async () => {
    const { fixture, element } = await mount();
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const link = await loader.getHarness(AveLinkHarness.with({ text: 'договор ДК-2025/109' }));
    expect(await link.getHref()).toBe('/contracts/109');
    expect(await link.opensInNewTab()).toBe(false);
    const anchor = element.querySelector<HTMLElement>('a[href="/contracts/109"]');
    if (anchor === null) throw new Error('No link');
    const style = getComputedStyle(anchor);
    expect(style.textDecorationLine).toBe('underline');
    expect(style.textDecorationThickness).toBe('1px');
    expect(style.color).not.toBe(getComputedStyle(element.querySelector('.text') ?? anchor).color);
    // The link takes the font of the text around it.
    expect(style.font).toBe(getComputedStyle(element.querySelector('.text') ?? anchor).font);
    await link.follow();
    await fixture.whenStable();
    expect(TestBed.inject(Location).path()).toBe('/contracts/109');
    element.remove();
  });

  it('thickens its underline under the pointer', async () => {
    const { element } = await mount();
    const anchor = element.querySelector<HTMLElement>('a[href="/contracts/109"]');
    if (anchor === null) throw new Error('No link');
    await userEvent.hover(anchor);
    expect(getComputedStyle(anchor).textDecorationThickness).toBe('2px');
    await userEvent.unhover(anchor);
    expect(getComputedStyle(anchor).textDecorationThickness).toBe('1px');
    element.remove();
  });

  it('says that a link opens a new tab, with an icon named in the locale after its words', async () => {
    const { fixture, element } = await mount();
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const link = await loader.getHarness(AveLinkHarness.with({ text: /^регламенте/ }));
    expect(await link.opensInNewTab()).toBe(true);
    const anchor = element.querySelector<HTMLElement>('a[target="_blank"]');
    const icon = anchor?.querySelector('ave-icon');
    expect(icon?.getAttribute('data-icon')).toBe('external-link');
    expect(icon?.getAttribute('role')).toBe('img');
    expect(icon?.getAttribute('aria-label')).toBe('откроется в новой вкладке');
    // 4px after the words, inside the link.
    const words = anchor?.firstChild;
    const range = document.createRange();
    if (words !== null && words !== undefined) range.selectNodeContents(words);
    expect(Math.round((icon?.getBoundingClientRect().left ?? 0) - range.getBoundingClientRect().right)).toBe(4);
    expect(await loader.getAllHarnesses(AveLinkHarness.with({ text: 'Отчёт' }))).toHaveLength(0);
    element.remove();
  });
});
