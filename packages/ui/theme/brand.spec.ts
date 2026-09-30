import { EnvironmentInjector, PLATFORM_ID, type Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { generateAveBrand as GenerateAveBrand } from '@avelune/tokens/brand';
import { aveBrandFingerprint } from '@avelune/tokens/brand/presets';
import { AveTheme, provideAvelune, type AveOptions } from '@avelune/ui/theme';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { isBrandStylesheet, parseStoredBrand } from './brand';

const key = 'avelune:brand';

// The generator is loaded as @avelune/ui/theme loads it, lazily: a static import of it is a lint error in the kit.
let generateAveBrand: typeof GenerateAveBrand;
beforeAll(async () => {
  ({ generateAveBrand } = await import('@avelune/tokens/brand'));
});
const root = document.documentElement;

/** The accent fill the page paints now, from whichever stylesheet wins. */
function accent(): string {
  return getComputedStyle(root).getPropertyValue('--ave-color-accent-bg').trim();
}

function stored(): unknown {
  const json = localStorage.getItem(key);
  return json === null ? null : JSON.parse(json);
}

/** A brand as an earlier visit kept it. */
function keep(input: 'blue' | 'green' | `#${string}`, fingerprint = aveBrandFingerprint, css?: string): void {
  const brand = generateAveBrand(input);
  localStorage.setItem(key, JSON.stringify({ input, fingerprint, css: css ?? brand.css, report: brand.report }));
}

function boot(options?: AveOptions, providers: Provider[] = []): AveTheme {
  TestBed.configureTestingModule({ providers: [provideAvelune(options), ...providers] });
  TestBed.inject(EnvironmentInjector);
  return TestBed.inject(AveTheme);
}

function otherTab(newValue: string | null, eventKey: string | null = key): void {
  window.dispatchEvent(new StorageEvent('storage', { key: eventKey, newValue, storageArea: localStorage }));
}

beforeEach(() => {
  localStorage.clear();
  document.adoptedStyleSheets = [];
});

afterEach(() => {
  vi.restoreAllMocks();
  TestBed.resetTestingModule();
  localStorage.clear();
  document.adoptedStyleSheets = [];
});

describe('AveTheme brand', () => {
  it('shows the kit’s own colours until a brand is set', () => {
    const theme = boot();
    expect([theme.brand(), theme.brandReport()]).toEqual([null, null]);
    expect(document.adoptedStyleSheets).toEqual([]);
  });

  it('generates a brand, paints it through one adopted stylesheet and keeps it for the next visit', async () => {
    const theme = boot();
    const report = await theme.setBrand('blue');
    const expected = generateAveBrand('blue');
    expect(report).toEqual(expected.report);
    expect([theme.brand(), theme.brandReport()]).toEqual(['blue', expected.report]);
    expect(document.adoptedStyleSheets).toHaveLength(1);
    expect(accent()).toBe(expected.light['color.accent.bg']);
    expect(stored()).toEqual({ input: 'blue', fingerprint: aveBrandFingerprint, css: expected.css, report: report });

    await theme.setBrand('#7a3cc2');
    expect(document.adoptedStyleSheets).toHaveLength(1);
    expect(accent()).toBe(generateAveBrand('#7a3cc2').light['color.accent.bg']);
  });

  it('paints the kept brand at bootstrap, before anything awaits, and again without the generator', async () => {
    keep('green');
    const theme = boot({ brand: 'blue' });
    expect(theme.brand()).toBe('green');
    expect(accent()).toBe(generateAveBrand('green').light['color.accent.bg']);
    expect(await theme.setBrand('green')).toEqual(generateAveBrand('green').report);
  });

  it('generates the default brand of provideAvelune on a first visit', async () => {
    const theme = boot({ brand: 'teal' });
    await vi.waitFor(() => {
      expect(theme.brand()).toBe('teal');
    });
    expect(accent()).toBe(generateAveBrand('teal').light['color.accent.bg']);
  });

  it('regenerates a brand kept by another version of the kit, and never applies a stylesheet it did not write', async () => {
    keep('green', 'another-kit');
    const theme = boot();
    expect(theme.brand()).toBeNull();
    TestBed.resetTestingModule();

    keep('green', aveBrandFingerprint, "@layer tokens { :root { --ave-color-accent-bg: url('https://x.test/'); } }");
    expect(boot().brand()).toBeNull();
    expect(document.adoptedStyleSheets).toEqual([]);

    const again = TestBed.inject(AveTheme);
    await again.setBrand('green');
    expect(accent()).toBe(generateAveBrand('green').light['color.accent.bg']);
  });

  it('goes back to the kit’s colours with null, and forgets the brand', async () => {
    const theme = boot();
    await theme.setBrand('navy');
    await theme.setBrand(null);
    expect([theme.brand(), theme.brandReport()]).toEqual([null, null]);
    expect(document.adoptedStyleSheets).toEqual([]);
    expect(stored()).toBeNull();
    await theme.setBrand(null);
    expect(document.adoptedStyleSheets).toEqual([]);
  });

  it('rejects what is neither a preset nor a #rrggbb colour, and keeps the brand it has', async () => {
    const theme = boot();
    await theme.setBrand('blue');
    await expect(theme.setBrand('#fff')).rejects.toThrow(/neither a preset nor a #rrggbb colour/);
    await expect(theme.setBrand('url(x)' as 'blue')).rejects.toThrow();
    expect(theme.brand()).toBe('blue');
  });

  it('keeps the last of two brands set at once', async () => {
    const theme = boot();
    const first = theme.setBrand('red');
    const second = theme.setBrand('green');
    await Promise.all([first, second]);
    expect(theme.brand()).toBe('green');
    expect(accent()).toBe(generateAveBrand('green').light['color.accent.bg']);
  });

  it('follows a brand set or cleared in another tab', () => {
    const theme = boot();
    const brand = generateAveBrand('magenta');
    otherTab(
      JSON.stringify({ input: 'magenta', fingerprint: aveBrandFingerprint, css: brand.css, report: brand.report }),
    );
    expect(theme.brand()).toBe('magenta');
    expect(accent()).toBe(brand.light['color.accent.bg']);

    otherTab(JSON.stringify({ theme: 'dark' }), 'avelune:preferences');
    expect(theme.brand()).toBe('magenta');

    otherTab(null);
    expect(theme.brand()).toBeNull();
    expect(document.adoptedStyleSheets).toEqual([]);

    otherTab(
      JSON.stringify({ input: 'magenta', fingerprint: aveBrandFingerprint, css: brand.css, report: brand.report }),
    );
    otherTab(null, null);
    expect(theme.brand()).toBeNull();
  });

  it('keeps a brand for this visit when storage throws', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Storage is blocked', 'SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Storage is full', 'QuotaExceededError');
    });
    const theme = boot();
    await theme.setBrand('indigo');
    expect(theme.brand()).toBe('indigo');
    expect(accent()).toBe(generateAveBrand('indigo').light['color.accent.bg']);
  });

  it('keeps nothing with persist: false', async () => {
    keep('green');
    const theme = boot({ persist: false });
    expect(theme.brand()).toBeNull();
    await theme.setBrand('blue');
    expect(JSON.parse(localStorage.getItem(key) ?? 'null')).toMatchObject({ input: 'green' });
  });

  it('sets the brand but paints nothing on the server', async () => {
    const theme = boot({}, [{ provide: PLATFORM_ID, useValue: 'server' }]);
    await theme.setBrand('blue');
    expect(theme.brand()).toBe('blue');
    expect(document.adoptedStyleSheets).toEqual([]);
  });
});

describe('a stored brand', () => {
  it('is read only when well formed', () => {
    const brand = generateAveBrand('blue');
    const good = { input: 'blue', fingerprint: 'x', css: brand.css, report: brand.report };
    expect(parseStoredBrand(JSON.stringify(good))).toEqual(good);
    for (const json of [
      null,
      'not json',
      '"blue"',
      JSON.stringify({ ...good, input: 'sepia' }),
      JSON.stringify({ ...good, fingerprint: 1 }),
      JSON.stringify({ ...good, report: null }),
      JSON.stringify({ ...good, css: `${brand.css}\nhtml { background: red; }` }),
    ]) {
      expect(parseStoredBrand(json)).toBeUndefined();
    }
  });

  it('holds colour declarations with computed hex values only', () => {
    const { css } = generateAveBrand('#123abc');
    expect(isBrandStylesheet(css)).toBe(true);
    expect(isBrandStylesheet(css.replace(/#[0-9a-f]{6};/, 'red;'))).toBe(false);
    expect(isBrandStylesheet(css.replace('@layer tokens {', '@import url(x);\n@layer tokens {'))).toBe(false);
  });
});
