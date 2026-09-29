import { Component, LOCALE_ID, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { tokens, type TokenName } from '@avelune/tokens';
import { AveAvatar } from '@avelune/ui/avatar';
import { AveAvatarHarness } from '@avelune/ui/avatar/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

/** A 1×1 photo, drawn as SVG. */
const photo =
  'data:image/svg+xml,' +
  encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"><rect width="1" height="1"/></svg>');

@Component({
  selector: 'ave-avatar-host',
  imports: [AveAvatar],
  template: `
    <ave-avatar class="person" name="Азиза Каримова" />
    <ave-avatar class="org" name="ООО «Мебель Сервис»" kind="organization" size="lg" />
    <ave-avatar class="plain-org" name="Uztelecom" kind="organization" size="sm" />
    <ave-avatar class="uz" name="Oʻktam Aliyev" size="sm" />
    <ave-avatar class="one" name="алишер" />
    <ave-avatar class="marks" name=" № 5 — Бахтиёр" />
    <ave-avatar class="own" name="ИП Каримов А." kind="organization" initials="КА" decorative />
    <ave-avatar class="photo" name="Бахтиёр Рахимов" [image]="image()" />
  `,
})
class AvatarHost {
  readonly image = signal<string | undefined>(photo);
}

const used = [
  'space.6',
  'space.8',
  'space.10',
  'border-width.default',
  'radius.sm',
  'radius.md',
  'radius.full',
  'font.label-sm',
  'font.label-md',
  'color.bg.active',
  'color.fg.default',
] as const satisfies readonly TokenName[];

const root = document.documentElement;
const reset = document.createElement('style');
reset.textContent = '*, ::before, ::after { box-sizing: border-box; }';

beforeEach(() => {
  for (const name of used) root.style.setProperty(tokens[name].cssVar, tokens[name].css);
  document.head.append(reset);
});

afterEach(() => {
  for (const name of used) root.style.removeProperty(tokens[name].cssVar);
  reset.remove();
});

function mount(): { fixture: ComponentFixture<AvatarHost>; element: HTMLElement } {
  TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: 'ru' }] });
  const fixture = TestBed.createComponent(AvatarHost);
  const element = fixture.nativeElement as HTMLElement;
  document.body.append(element);
  fixture.detectChanges();
  return { fixture, element };
}

function box(element: Element | null | undefined): DOMRect {
  if (element === null || element === undefined) throw new Error('No element');
  return element.getBoundingClientRect();
}

/** Waits for the photo avatar to show its photo, or for a photo to have had the time to fail. */
async function settled(fixture: ComponentFixture<AvatarHost>, shown: boolean): Promise<void> {
  for (let tries = 0; tries < 20; tries++) {
    await new Promise((resolve) => {
      setTimeout(resolve, 10);
    });
    fixture.detectChanges();
    const avatar = (fixture.nativeElement as HTMLElement).querySelector('.photo');
    if (shown && avatar?.hasAttribute('data-photo') === true) return;
  }
}

describe('AveAvatar', () => {
  it('takes the initials of the first two words, of an organisation’s name in quotes, from letters only', async () => {
    const { fixture, element } = mount();
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const initials = async (selector: string) =>
      (await loader.getHarness(AveAvatarHarness.with({ selector }))).getInitials();
    expect(await initials('.person')).toBe('АК');
    expect(await initials('.org')).toBe('МС');
    expect(await initials('.plain-org')).toBe('U');
    expect(await initials('.uz')).toBe('OA');
    expect(await initials('.one')).toBe('А');
    // Words without a letter give none.
    expect(await initials('.marks')).toBe('Б');
    expect(await initials('.own')).toBe('КА');
    element.remove();
  });

  it('is an image named by the name, or hidden when it is decorative', async () => {
    const { fixture, element } = mount();
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const person = await loader.getHarness(AveAvatarHarness.with({ name: 'Азиза Каримова' }));
    expect(await (await person.host()).getAttribute('role')).toBe('img');
    const own = await loader.getHarness(AveAvatarHarness.with({ selector: '.own' }));
    expect(await own.getName()).toBeNull();
    expect(await (await own.host()).getAttribute('aria-hidden')).toBe('true');
    expect(await (await own.host()).getAttribute('role')).toBeNull();
    element.remove();
  });

  it('draws a circle for a person and a rounded square for an organisation, 24, 32 or 40px', async () => {
    const { fixture, element } = mount();
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const person = element.querySelector('.person');
    expect(box(person).width).toBe(32);
    expect(box(person).height).toBe(32);
    expect(getComputedStyle(person ?? element).borderTopLeftRadius).not.toBe('8px');
    const org = element.querySelector('.org');
    expect(box(org).width).toBe(40);
    expect(getComputedStyle(org ?? element).borderTopLeftRadius).toBe('8px');
    expect(getComputedStyle(org ?? element).fontSize).toBe('14px');
    expect(box(element.querySelector('.plain-org')).width).toBe(24);
    expect(getComputedStyle(element.querySelector('.plain-org') ?? element).borderTopLeftRadius).toBe('4px');
    const small = await loader.getHarness(AveAvatarHarness.with({ selector: '.uz' }));
    expect(await small.getSize()).toBe('sm');
    expect(await small.getKind()).toBe('person');
    const large = await loader.getHarness(AveAvatarHarness.with({ selector: '.org' }));
    expect(await large.getSize()).toBe('lg');
    expect(await large.getKind()).toBe('organization');
    expect(await (await loader.getHarness(AveAvatarHarness.with({ selector: '.person' }))).getSize()).toBe('md');
    // The initials sit in the middle of the shape.
    const letters = person?.querySelector('.initials');
    expect(Math.round(box(letters).left + box(letters).width / 2)).toBe(Math.round(box(person).left + 16));
    element.remove();
  });

  it('shows a photo over the initials once it has loaded, and the initials when it fails', async () => {
    const { fixture, element } = mount();
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const avatar = await loader.getHarness(AveAvatarHarness.with({ selector: '.photo' }));
    await settled(fixture, true);
    expect(await avatar.isPhotoShown()).toBe(true);
    const host = element.querySelector('.photo') ?? element;
    expect(getComputedStyle(host).backgroundImage).toMatch(/^url\("data:image\/svg\+xml,/);
    expect(getComputedStyle(host).backgroundSize).toBe('cover');
    expect(getComputedStyle(host.querySelector('.initials') ?? element).visibility).toBe('hidden');
    // A photo that fails leaves the initials.
    fixture.componentInstance.image.set('data:image/png;base64,broken');
    fixture.detectChanges();
    await settled(fixture, false);
    expect(await avatar.isPhotoShown()).toBe(false);
    expect(getComputedStyle(host).backgroundImage).toBe('none');
    expect(await avatar.getInitials()).toBe('БР');
    // No photo at all.
    fixture.componentInstance.image.set(undefined);
    fixture.detectChanges();
    expect(await avatar.isPhotoShown()).toBe(false);
    element.remove();
  });
});
