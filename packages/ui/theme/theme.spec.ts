import { EnvironmentInjector, PLATFORM_ID, type Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AveTheme, provideAvelune, type AveOptions } from '@avelune/ui/theme';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const key = 'avelune:preferences';
const attributes = ['data-theme', 'data-density', 'data-motion'] as const;
const root = document.documentElement;

/** The kit's attributes on <html>, absent ones left out. */
function written(): Record<string, string> {
  return Object.fromEntries(
    attributes.flatMap((name) => {
      const value = root.getAttribute(name);
      return value === null ? [] : [[name, value]];
    }),
  );
}

function stored(): unknown {
  const json = localStorage.getItem(key);
  return json === null ? null : JSON.parse(json);
}

/** Boots a TestBed environment with provideAvelune, as an application does, without injecting AveTheme. */
function boot(options?: AveOptions, providers: Provider[] = []): void {
  TestBed.configureTestingModule({ providers: [provideAvelune(options), ...providers] });
  TestBed.inject(EnvironmentInjector);
}

/** A choice made in another tab of the same origin. */
function otherTab(newValue: string | null, eventKey: string | null = key): void {
  window.dispatchEvent(new StorageEvent('storage', { key: eventKey, newValue, storageArea: localStorage }));
}

beforeEach(() => {
  localStorage.clear();
  for (const name of attributes) root.removeAttribute(name);
});

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
  for (const name of attributes) root.removeAttribute(name);
});

describe('AveTheme', () => {
  it('follows the system and writes nothing by default', () => {
    const theme = TestBed.inject(AveTheme);
    expect([theme.theme(), theme.density(), theme.motion()]).toEqual(['system', 'comfortable', 'system']);
    expect(written()).toEqual({});
  });

  it('writes the defaults of provideAvelune at bootstrap, before anything injects it', () => {
    boot({ theme: 'dark', density: 'compact', motion: 'reduced' });
    expect(written()).toEqual({ 'data-theme': 'dark', 'data-density': 'compact', 'data-motion': 'reduced' });
    expect(stored()).toBeNull();
  });

  it('restores the choices of an earlier visit over the defaults', () => {
    localStorage.setItem(key, JSON.stringify({ theme: 'light', density: 'compact' }));
    boot({ theme: 'dark', motion: 'reduced' });
    const theme = TestBed.inject(AveTheme);
    expect([theme.theme(), theme.density(), theme.motion()]).toEqual(['light', 'compact', 'reduced']);
    expect(written()).toEqual({ 'data-theme': 'light', 'data-density': 'compact', 'data-motion': 'reduced' });
  });

  it('keeps only the stored values it knows', () => {
    localStorage.setItem(key, JSON.stringify({ theme: 'sepia', density: 3, motion: 'reduced' }));
    const theme = TestBed.inject(AveTheme);
    expect([theme.theme(), theme.density(), theme.motion()]).toEqual(['system', 'comfortable', 'reduced']);
  });

  it.each(['not json', 'null', '"dark"'])('ignores a stored value that is no object: %s', (json) => {
    localStorage.setItem(key, json);
    const theme = TestBed.inject(AveTheme);
    expect([theme.theme(), theme.density(), theme.motion()]).toEqual(['system', 'comfortable', 'system']);
  });

  it('writes each choice to <html> and keeps it for the next visit', () => {
    const theme = TestBed.inject(AveTheme);
    theme.setTheme('dark');
    theme.setDensity('compact');
    theme.setMotion('reduced');
    expect(written()).toEqual({ 'data-theme': 'dark', 'data-density': 'compact', 'data-motion': 'reduced' });
    expect(stored()).toEqual({ theme: 'dark', density: 'compact', motion: 'reduced' });

    theme.setTheme('light');
    expect(written()['data-theme']).toBe('light');
    theme.setTheme('system');
    theme.setDensity('comfortable');
    theme.setMotion('system');
    expect(written()).toEqual({});
    expect(stored()).toEqual({ theme: 'system', density: 'comfortable', motion: 'system' });

    // A later visit starts from what this one kept, in the browser's real localStorage.
    theme.setTheme('dark');
    TestBed.resetTestingModule();
    root.removeAttribute('data-theme');
    expect(TestBed.inject(AveTheme).theme()).toBe('dark');
    expect(written()).toEqual({ 'data-theme': 'dark' });
  });

  it('keeps nothing, and reads nothing, with persist: false', () => {
    localStorage.setItem(key, JSON.stringify({ theme: 'dark' }));
    boot({ persist: false });
    const theme = TestBed.inject(AveTheme);
    expect(theme.theme()).toBe('system');
    theme.setTheme('light');
    expect(written()).toEqual({ 'data-theme': 'light' });
    expect(stored()).toEqual({ theme: 'dark' });
  });

  it('follows a choice made in another tab, and a cleared storage', () => {
    boot({ density: 'compact' });
    const theme = TestBed.inject(AveTheme);
    otherTab(JSON.stringify({ theme: 'dark', density: 'comfortable', motion: 'reduced' }));
    expect([theme.theme(), theme.density(), theme.motion()]).toEqual(['dark', 'comfortable', 'reduced']);
    expect(written()).toEqual({ 'data-theme': 'dark', 'data-motion': 'reduced' });

    otherTab(JSON.stringify({ theme: 'light' }), 'another-key');
    expect(theme.theme()).toBe('dark');

    otherTab(null, null);
    expect([theme.theme(), theme.density(), theme.motion()]).toEqual(['system', 'compact', 'system']);
    expect(written()).toEqual({ 'data-density': 'compact' });
  });

  it('ignores storage events once its application is destroyed', () => {
    TestBed.inject(AveTheme);
    TestBed.resetTestingModule();
    otherTab(JSON.stringify({ theme: 'dark' }));
    expect(written()).toEqual({});
  });

  it('keeps working when storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Storage is blocked', 'SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Storage is full', 'QuotaExceededError');
    });
    boot({ theme: 'dark' });
    const theme = TestBed.inject(AveTheme);
    expect(theme.theme()).toBe('dark');
    expect(() => {
      theme.setTheme('light');
    }).not.toThrow();
    expect(written()).toEqual({ 'data-theme': 'light' });
  });

  it('works without storage when reading localStorage throws', () => {
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new DOMException('No storage in this frame', 'SecurityError');
    });
    const theme = TestBed.inject(AveTheme);
    theme.setDensity('compact');
    expect(written()).toEqual({ 'data-density': 'compact' });
  });

  it('writes the attributes but touches no storage on the server', () => {
    localStorage.setItem(key, JSON.stringify({ theme: 'dark' }));
    boot({ motion: 'reduced' }, [{ provide: PLATFORM_ID, useValue: 'server' }]);
    const theme = TestBed.inject(AveTheme);
    expect(theme.theme()).toBe('system');
    theme.setTheme('light');
    expect(written()).toEqual({ 'data-theme': 'light', 'data-motion': 'reduced' });
    expect(stored()).toEqual({ theme: 'dark' });
  });
});
