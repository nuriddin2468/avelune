import { Component, LOCALE_ID, PLATFORM_ID, signal, type Provider } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Router, RouterOutlet, provideRouter } from '@angular/router';
import { lucideUser } from '@avelune/icons/lucide';
import { tokens } from '@avelune/tokens';
import { provideAveIcons } from '@avelune/ui/icon';
import { AveSettingsPage, type AveSettingsSection } from '@avelune/ui/settings-page';
import { AveSettingsPageHarness } from '@avelune/ui/settings-page/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';

@Component({ selector: 'ave-profile-section', template: '<h2 class="title">Профиль</h2>' })
class Profile {}

@Component({ selector: 'ave-brand-section', template: '<h2 class="title">Бренд организации</h2>' })
class Brand {}

@Component({ selector: 'ave-settings-index', template: '' })
class Index {}

@Component({
  selector: 'ave-settings-page-host',
  imports: [AveSettingsPage, RouterOutlet],
  providers: [provideAveIcons([lucideUser])],
  template: `
    <ave-settings-page
      heading="Настройки"
      [description]="description()"
      [sections]="sections"
      [backLabel]="backLabel()"
      home="/settings"
    >
      <router-outlet />
    </ave-settings-page>
  `,
})
class SettingsHost {
  readonly sections: readonly AveSettingsSection[] = [
    { label: 'Профиль', link: '/settings/profile', icon: 'user' },
    { label: 'Бренд организации', link: '/settings/brand' },
  ];
  readonly description = signal('Изменения сохраняются сразу.');
  readonly backLabel = signal<string | undefined>(undefined);
}

const every = Object.values(tokens);
const root = document.documentElement;
const reset = document.createElement('style');
// The kit's layer order and reset (ADR 0030): without styles.css, layers would stack in the order they first appear.
reset.textContent =
  '@layer reset, tokens, base, components, patterns, utilities, app; @layer reset { *, ::before, ::after { box-sizing: border-box; } p, h1, h2 { margin: 0; } }';

beforeEach(() => {
  for (const token of every) root.style.setProperty(token.cssVar, token.css);
  document.head.append(reset);
});

afterEach(() => {
  for (const token of every) root.style.removeProperty(token.cssVar);
  reset.remove();
});

async function mount(
  width: number,
  providers: Provider[] = [],
): Promise<{ fixture: ComponentFixture<SettingsHost>; element: HTMLElement; router: Router }> {
  TestBed.configureTestingModule({
    providers: [
      { provide: LOCALE_ID, useValue: 'ru' },
      provideRouter([
        {
          path: 'settings',
          children: [
            { path: '', component: Index },
            { path: 'profile', component: Profile },
            { path: 'brand', component: Brand },
          ],
        },
      ]),
      ...providers,
    ],
  });
  const router = TestBed.inject(Router);
  await router.navigateByUrl('/settings');
  const fixture = TestBed.createComponent(SettingsHost);
  const element = fixture.nativeElement as HTMLElement;
  element.style.display = 'block';
  element.style.inlineSize = `${String(width)}px`;
  document.body.prepend(element);
  fixture.detectChanges();
  return { fixture, element, router };
}

function box(element: Element | null | undefined): DOMRect {
  if (element === null || element === undefined) throw new Error('No element');
  return element.getBoundingClientRect();
}

describe('AveSettingsPage', () => {
  it('stands the sections in a 256px column and opens the first one at its own address, from container.md', async () => {
    const { fixture, element, router } = await mount(900);
    const page = await TestbedHarnessEnvironment.loader(fixture).getHarness(
      AveSettingsPageHarness.with({ heading: 'Настройки' }),
    );
    expect(await page.getDescription()).toBe('Изменения сохраняются сразу.');
    expect(await page.getSectionsLabel()).toBe('Разделы настроек');
    expect(await page.getSections()).toEqual(['Профиль', 'Бренд организации']);
    await vi.waitFor(() => {
      expect(router.url).toBe('/settings/profile');
    });
    expect(await page.getCurrentSection()).toBe('Профиль');
    expect(await page.isListShown()).toBe(true);
    expect(await page.isSectionShown()).toBe(true);
    expect(await page.hasBackLink()).toBe(false);
    const list = element.querySelector('.sections');
    const title = element.querySelector('.title');
    expect(box(list).width).toBe(256);
    expect(box(title).left - box(list).right).toBe(24);

    await page.openSection('Бренд организации');
    await fixture.whenStable();
    expect(router.url).toBe('/settings/brand');
    expect(element.querySelector('.title')?.textContent).toBe('Бренд организации');
    fixture.componentInstance.description.set('');
    expect(await page.getDescription()).toBe('');
    element.remove();
  });

  it('shows the list, then a section under the way back, below container.md; focus follows', async () => {
    const { fixture, element, router } = await mount(480);
    const page = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveSettingsPageHarness);
    await new Promise(requestAnimationFrame);
    expect(router.url).toBe('/settings');
    expect(await page.getCurrentSection()).toBeNull();
    expect(await page.isListShown()).toBe(true);
    expect(await page.isSectionShown()).toBe(false);

    const brand = [...element.querySelectorAll('nav a')].find((link) => link.textContent.includes('Бренд'));
    await userEvent.click(brand ?? element);
    await vi.waitFor(async () => {
      expect(await page.isSectionShown()).toBe(true);
    });
    expect(router.url).toBe('/settings/brand');
    expect(await page.isListShown()).toBe(false);
    expect(await page.hasBackLink()).toBe(true);
    expect(await page.getBackLabel()).toBe('Все настройки');
    await vi.waitFor(() => {
      expect(document.activeElement?.textContent.trim()).toBe('Все настройки');
    });

    await userEvent.click(document.activeElement ?? element);
    await vi.waitFor(async () => {
      expect(await page.isListShown()).toBe(true);
    });
    expect(router.url).toBe('/settings');
    await vi.waitFor(() => {
      expect(document.activeElement).toBe(brand);
    });
    element.remove();
  });

  it('returns focus to the list itself when a section was reached from elsewhere', async () => {
    const { fixture, element, router } = await mount(480);
    const page = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveSettingsPageHarness);
    fixture.componentInstance.backLabel.set('Ко всем настройкам');
    await router.navigateByUrl('/settings/profile');
    await fixture.whenStable();
    expect(await page.getBackLabel()).toBe('Ко всем настройкам');
    expect(document.activeElement).toBe(document.body);
    await page.goBack();
    await vi.waitFor(() => {
      expect(document.activeElement).toBe(element.querySelector('.sections'));
    });
    element.remove();
  });

  it('opens no section where it cannot read the width, and on the server', async () => {
    root.style.removeProperty(tokens['container.md'].cssVar);
    const unread = await mount(900);
    await new Promise(requestAnimationFrame);
    expect(unread.router.url).toBe('/settings');
    unread.element.remove();
    TestBed.resetTestingModule();

    root.style.setProperty(tokens['container.md'].cssVar, tokens['container.md'].css);
    const server = await mount(900, [{ provide: PLATFORM_ID, useValue: 'server' }]);
    await new Promise(requestAnimationFrame);
    expect(server.router.url).toBe('/settings');
    server.element.remove();
  });
});
