import { Component, PLATFORM_ID, signal, type Provider } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Router, provideRouter } from '@angular/router';
import { tokens } from '@avelune/tokens';
import { AveAppShell, AveAppShellActions, AveAppShellBanner, type AveAppLogo } from '@avelune/ui/app-shell';
import { AveAppShellHarness } from '@avelune/ui/app-shell/testing';
import { AveDrawerHarness } from '@avelune/ui/dialog/testing';
import type { AveSidebarEntry } from '@avelune/ui/sidebar-nav';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page, userEvent } from 'vitest/browser';

const light = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='96' height='32'/>";
const dark = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='96' height='32' id='dark'/>";

@Component({ template: '' })
class Blank {}

@Component({
  selector: 'ave-app-shell-host',
  imports: [AveAppShell, AveAppShellActions, AveAppShellBanner],
  template: `
    <ave-app-shell
      product="Документооборот"
      [logo]="logo()"
      [navigation]="pages()"
      [navigationLabel]="label()"
      [(navigationOpen)]="navigating"
    >
      <div aveAppShellActions>
        <button type="button" class="action">Тёмная тема</button>
        <button type="button" class="action">Плотность</button>
      </div>
      <p aveAppShellBanner class="banner">Плановые работы в субботу.</p>
      <h1 class="heading">Договоры</h1>
    </ave-app-shell>
  `,
})
class ShellHost {
  readonly logo = signal<AveAppLogo | null>({ src: light, darkSrc: dark, alt: 'Узбекский банк' });
  readonly pages = signal<readonly AveSidebarEntry[]>([
    { label: 'Реестр договоров', link: '/contracts' },
    { label: 'Настройки', link: '/settings' },
  ]);
  readonly label = signal<string | undefined>('Разделы');
  readonly navigating = signal(false);
}

/** The shell composes the bar's buttons, the navigation and a drawer: every token is set, as tokens.css sets it. */
const every = Object.values(tokens);

const root = document.documentElement;
const reset = document.createElement('style');
// The kit's layer order and reset (ADR 0030): without styles.css, layers would stack in the order they first appear.
reset.textContent =
  '@layer reset, tokens, base, components, patterns, utilities, app; @layer reset { *, ::before, ::after { box-sizing: border-box; } body, h1, p { margin: 0; } }';

beforeEach(() => {
  for (const token of every) root.style.setProperty(token.cssVar, token.css);
  document.head.append(reset);
  localStorage.clear();
});

afterEach(() => {
  for (const token of every) root.style.removeProperty(token.cssVar);
  reset.remove();
  root.removeAttribute('data-theme');
  localStorage.clear();
});

function mount(providers: Provider[] = []): { fixture: ComponentFixture<ShellHost>; element: HTMLElement } {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([
        { path: 'contracts', component: Blank },
        { path: 'settings', component: Blank },
      ]),
      ...providers,
    ],
  });
  const fixture = TestBed.createComponent(ShellHost);
  const element = fixture.nativeElement as HTMLElement;
  document.body.prepend(element);
  fixture.detectChanges();
  return { fixture, element };
}

function box(element: Element | null | undefined): DOMRect {
  if (element === null || element === undefined) throw new Error('No element');
  return element.getBoundingClientRect();
}

async function atWidth(width: number, test: () => Promise<void>): Promise<void> {
  await page.viewport(width, 768);
  try {
    await test();
  } finally {
    await page.viewport(414, 896);
  }
}

describe('AveAppShell', () => {
  it('draws the bar: the logo and the name as the link home, the actions at the end, the banners under it', async () => {
    await atWidth(1024, async () => {
      const { fixture, element } = mount();
      const shell = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveAppShellHarness);
      expect(await shell.getProduct()).toBe('Документооборот');
      expect(await shell.getHome()).toBe('/');
      expect(await shell.getLogo()).toEqual({ src: light, alt: 'Узбекский банк' });

      const bar = element.querySelector('header');
      expect(box(bar).height).toBe(52);
      expect(getComputedStyle(bar ?? element).borderBottomWidth).toBe('1px');
      const logo = element.querySelector('.home img');
      expect(box(logo).height).toBe(32);
      expect(box(logo).width).toBe(96);
      expect(box(logo).left).toBe(16);
      expect(box(element.querySelector('.home .product')).left - box(logo).right).toBe(12);
      const [, last] = element.querySelectorAll('.action');
      expect(box(bar).right - box(last).right).toBe(16);
      expect(box(element.querySelector('.banner')).top).toBe(box(bar).bottom);
      const heading = element.querySelector('.heading');
      expect(box(heading).top - box(element.querySelector('.banner')).bottom).toBe(24);
      element.remove();
    });
  });

  it('keeps one row on a phone: a logo stands for the product, whose name still names the link', async () => {
    const { fixture, element } = mount();
    const shell = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveAppShellHarness);
    const bar = element.querySelector('header');
    expect(box(bar).height).toBe(52);
    const product = element.querySelector('.home .product');
    expect(getComputedStyle(product ?? element).clipPath).toBe('inset(50%)');
    expect(element.querySelector('.home')?.textContent.trim()).toBe('Документооборот');
    expect(box(element.querySelector('.home img')).left - box(element.querySelector('.start > button')).right).toBe(16);
    expect(box(element.querySelector('.heading')).left).toBe(16);

    fixture.componentInstance.logo.set(null);
    expect(await shell.getLogo()).toBeNull();
    expect(getComputedStyle(product ?? element).clipPath).toBe('none');
    element.remove();
  });

  it('takes the logo’s dark source while the page shows the dark theme, and its only source without one', async () => {
    const { fixture, element } = mount();
    const shell = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveAppShellHarness);
    root.setAttribute('data-theme', 'dark');
    expect(await shell.getLogo()).toEqual({ src: dark, alt: 'Узбекский банк' });
    fixture.componentInstance.logo.set({ src: light, alt: '' });
    expect(await shell.getLogo()).toEqual({ src: light, alt: '' });
    fixture.componentInstance.logo.set(null);
    expect(await shell.getLogo()).toBeNull();
    element.remove();
  });

  it('opens the navigation in a drawer on a phone, which navigation closes', async () => {
    const { fixture, element } = mount();
    const shell = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveAppShellHarness);
    expect(await shell.hasNavigationButton()).toBe(true);
    expect(await shell.hasNavigationColumn()).toBe(false);
    expect(element.querySelector('.start > button')?.getAttribute('aria-haspopup')).toBe('dialog');
    expect(element.querySelector('.start > button')?.getAttribute('aria-label')).toBe('Разделы');

    await shell.openNavigation();
    expect(await shell.isNavigationOpen()).toBe(true);
    expect(fixture.componentInstance.navigating()).toBe(true);
    const navigation = await shell.getNavigation();
    expect(await navigation.getLabel()).toBe('Разделы');
    expect(await navigation.getLinks()).toEqual(['Реестр договоров', 'Настройки']);

    const drawer = await TestbedHarnessEnvironment.documentRootLoader(fixture).getHarness(
      AveDrawerHarness.with({ heading: 'Разделы' }),
    );
    await drawer.close();
    expect(fixture.componentInstance.navigating()).toBe(false);
    await shell.openNavigation();
    expect(await shell.isNavigationOpen()).toBe(true);

    await TestBed.inject(Router).navigateByUrl('/contracts');
    await vi.waitFor(async () => {
      expect(await shell.isNavigationOpen()).toBe(false);
    });
    expect(fixture.componentInstance.navigating()).toBe(false);
    element.remove();
  });

  it('shows the navigation as a 256px column from breakpoint.md, without its button', async () => {
    await atWidth(1024, async () => {
      const { fixture, element } = mount();
      const shell = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveAppShellHarness);
      expect(await shell.hasNavigationButton()).toBe(false);
      expect(await shell.hasNavigationColumn()).toBe(true);
      expect(await (await shell.getNavigation()).getLinks()).toEqual(['Реестр договоров', 'Настройки']);
      const column = element.querySelector('.column');
      expect(box(column).width).toBe(256);
      expect(box(element.querySelector('.heading')).left - box(column).right).toBe(24);
      expect(getComputedStyle(column ?? element).position).toBe('sticky');
      element.remove();
    });
  });

  it('closes the drawer when the window reaches breakpoint.md, and leaves it closed as the window narrows', async () => {
    const { fixture, element } = mount();
    const shell = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveAppShellHarness);
    await shell.openNavigation();
    await atWidth(1024, async () => {
      await vi.waitFor(() => {
        expect(fixture.componentInstance.navigating()).toBe(false);
      });
    });
    await vi.waitFor(async () => {
      expect(await shell.hasNavigationButton()).toBe(true);
    });
    // The window's change reaches the page in its next rendering step.
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
    expect(fixture.componentInstance.navigating()).toBe(false);
    element.remove();
  });

  it('draws no button, column or drawer without navigation, and names it by the kit’s message by default', async () => {
    const { fixture, element } = mount();
    const shell = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveAppShellHarness);
    fixture.componentInstance.label.set(undefined);
    fixture.detectChanges();
    expect(element.querySelector('.start > button')?.getAttribute('aria-label')).toBe('Navigation');
    expect(element.querySelector('nav')?.getAttribute('aria-label')).toBe('Navigation');

    fixture.componentInstance.pages.set([]);
    fixture.detectChanges();
    expect(await shell.hasNavigationButton()).toBe(false);
    expect(await shell.hasNavigationColumn()).toBe(false);
    expect(await shell.isNavigationOpen()).toBe(false);
    expect(element.querySelector('dialog, nav')).toBeNull();
    await expect(shell.openNavigation()).rejects.toThrow('The shell has no navigation.');
    await expect(shell.getNavigation()).rejects.toThrow('The shell has no navigation.');
    element.remove();
  });

  it('starts with a skip link, out of sight until the keyboard reaches it, that moves focus to main', async () => {
    const { fixture, element } = mount();
    const shell = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveAppShellHarness);
    const skip = element.querySelector<HTMLElement>('.skip');
    expect(await shell.getSkipLinkText()).toBe('Skip to content');
    expect(getComputedStyle(skip ?? element).clipPath).toBe('inset(50%)');

    (document.activeElement as HTMLElement | null)?.blur();
    await userEvent.tab();
    expect(document.activeElement?.textContent.trim()).toBe('Skip to content');
    expect(getComputedStyle(skip ?? element).clipPath).toBe('none');
    expect(box(skip).top).toBe(8);
    await userEvent.keyboard('{Enter}');
    expect(await shell.isMainFocused()).toBe(true);
    expect(TestBed.inject(Router).url).toBe('/');
    expect(document.activeElement?.getAttribute('data-focus-ring')).toBe('inset');

    await shell.skipToContent();
    expect(await shell.isMainFocused()).toBe(true);
    expect(await shell.getMainText()).toBe('Договоры');
    element.remove();
  });

  it('matches no width it cannot read, and reads nothing on the server', () => {
    root.style.removeProperty(tokens['breakpoint.md'].cssVar);
    const query = vi.spyOn(window, 'matchMedia');
    const { element } = mount();
    expect(query.mock.calls.map(([media]) => media)).not.toContain('(width >= )');
    expect(query.mock.calls.some(([media]) => media.startsWith('(width'))).toBe(false);
    element.remove();
    TestBed.resetTestingModule();

    const style = vi.spyOn(window, 'getComputedStyle');
    const server = mount([{ provide: PLATFORM_ID, useValue: 'server' }]);
    expect(style).not.toHaveBeenCalledWith(root);
    server.element.remove();
  });
});
