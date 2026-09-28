import { Component, LOCALE_ID, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { tokens, type TokenName } from '@avelune/tokens';
import { AveAlert, AveBanner, type AveAlertVariant } from '@avelune/ui/alert';
import { AveAlertHarness, AveBannerHarness } from '@avelune/ui/alert/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

@Component({
  selector: 'ave-alert-host',
  imports: [AveAlert, AveBanner],
  template: `
    <ave-alert [variant]="variant()" [heading]="heading()">
      Налоговый номер не найден в реестре. <a href="#check">Проверить ИНН</a>
    </ave-alert>
    <ave-alert>Договор сохранён как черновик.</ave-alert>
    <ave-banner [variant]="variant()" [dismissible]="dismissible()" (dismiss)="dismissed.set(dismissed() + 1)">
      В субботу с 22:00 до 02:00 система будет недоступна.
    </ave-banner>
  `,
})
class AlertHost {
  readonly variant = signal<AveAlertVariant>('warning');
  readonly heading = signal('Контрагент не прошёл проверку');
  readonly dismissible = signal(true);
  readonly dismissed = signal(0);
}

const used = [
  'space.1',
  'space.2',
  'space.3',
  'space.4',
  'border-width.default',
  'radius.lg',
  'font.body-md',
  'font.label-md',
  'size.icon.sm',
  'size.icon.md',
  'control.height.sm',
  'control.padding-inline.sm',
  'radius.md',
  'color.fg.default',
  'color.info.bg-subtle',
  'color.warning.bg-subtle',
  'color.warning.fg',
  'color.danger.bg-subtle',
] as const satisfies readonly TokenName[];

const root = document.documentElement;
const reset = document.createElement('style');
// The kit's reset (ADR 0030): border-box sizing, no margins on paragraphs.
reset.textContent = '*, ::before, ::after { box-sizing: border-box; } p { margin: 0; }';

beforeEach(() => {
  for (const name of used) root.style.setProperty(tokens[name].cssVar, tokens[name].css);
  root.style.setProperty('--ave-font-body-md-line-height', '20px');
  document.head.append(reset);
});

afterEach(() => {
  for (const name of used) root.style.removeProperty(tokens[name].cssVar);
  root.style.removeProperty('--ave-font-body-md-line-height');
  reset.remove();
});

function mount(locale = 'ru'): { fixture: ComponentFixture<AlertHost>; element: HTMLElement } {
  TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: locale }] });
  const fixture = TestBed.createComponent(AlertHost);
  const element = fixture.nativeElement as HTMLElement;
  element.style.display = 'block';
  element.style.inlineSize = '600px';
  document.body.append(element);
  fixture.detectChanges();
  return { fixture, element };
}

/** `#rrggbb` → `rgb(r, g, b)`, as computed styles report colours. */
function rgb(hex: string): string {
  const [r, g, b] = [1, 3, 5].map((start) => Number.parseInt(hex.slice(start, start + 2), 16));
  return `rgb(${String(r)}, ${String(g)}, ${String(b)})`;
}

describe('AveAlert', () => {
  it('is an alert for a warning or an error and a status otherwise, its icon named by its kind', async () => {
    const { fixture } = mount();
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const warning = await loader.getHarness(AveAlertHarness.with({ variant: 'warning' }));
    expect(await warning.getRole()).toBe('alert');
    expect(await warning.getKind()).toBe('Предупреждение');
    expect(await warning.getHeading()).toBe('Контрагент не прошёл проверку');
    expect(await warning.getMessage()).toBe('Налоговый номер не найден в реестре. Проверить ИНН');
    expect(await warning.getText()).toBe(
      'Контрагент не прошёл проверку Налоговый номер не найден в реестре. Проверить ИНН',
    );
    const info = await loader.getHarness(AveAlertHarness.with({ text: 'Договор сохранён как черновик.' }));
    expect(await info.getVariant()).toBe('info');
    expect(await info.getRole()).toBe('status');
    expect(await info.getKind()).toBe('Информация');
    expect(await info.getHeading()).toBe('');

    fixture.componentInstance.variant.set('danger');
    fixture.detectChanges();
    expect(await warning.getKind()).toBe('Ошибка');
    fixture.componentInstance.variant.set('success');
    fixture.detectChanges();
    expect(await warning.getRole()).toBe('status');
    expect(await warning.getKind()).toBe('Успешно');
  });

  it('draws a tinted box with the icon level with the first line, on the 4px grid', () => {
    const { element } = mount();
    const alert = element.querySelector('ave-alert');
    if (alert === null) throw new Error('No alert');
    const style = getComputedStyle(alert);
    expect(style.backgroundColor).toBe(rgb(tokens['color.warning.bg-subtle'].css));
    expect(style.borderTopLeftRadius).toBe(tokens['radius.lg'].css);
    expect(style.color).toBe(rgb(tokens['color.fg.default'].css));
    const box = alert.getBoundingClientRect();
    const icon = alert.querySelector('.icon')?.getBoundingClientRect();
    const heading = alert.querySelector('.heading')?.getBoundingClientRect();
    expect(icon?.top).toBe(heading?.top);
    expect([icon?.width, icon?.height]).toEqual([20, 20]);
    expect((icon?.top ?? 0) - box.top).toBe(12);
    expect((icon?.left ?? 0) - box.left).toBe(16);
    expect(box.height % 4).toBe(0);
    expect(getComputedStyle(alert.querySelector('.icon') ?? alert).color).toBe(rgb(tokens['color.warning.fg'].css));
  });
});

describe('AveBanner', () => {
  it('is 40px tall with or without its close button, which emits dismiss', async () => {
    const { fixture, element } = mount('en');
    const banner = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveBannerHarness);
    const host = element.querySelector('ave-banner');
    expect(await banner.getVariant()).toBe('warning');
    expect(await banner.getRole()).toBe('alert');
    expect(await banner.getText()).toBe('В субботу с 22:00 до 02:00 система будет недоступна.');
    expect(await banner.isDismissible()).toBe(true);
    expect(host?.querySelector('button.close')?.getAttribute('aria-label')).toBe('Close');
    expect(host?.getBoundingClientRect().height).toBe(40);
    await banner.dismiss();
    expect(fixture.componentInstance.dismissed()).toBe(1);

    fixture.componentInstance.dismissible.set(false);
    fixture.componentInstance.variant.set('info');
    fixture.detectChanges();
    expect(await banner.isDismissible()).toBe(false);
    expect(await banner.getRole()).toBe('status');
    expect(host?.getBoundingClientRect().height).toBe(40);
    expect(getComputedStyle(host ?? element).backgroundColor).toBe(rgb(tokens['color.info.bg-subtle'].css));
    expect(
      await TestbedHarnessEnvironment.loader(fixture).getAllHarnesses(AveBannerHarness.with({ variant: 'info' })),
    ).toHaveLength(1);
  });
});
