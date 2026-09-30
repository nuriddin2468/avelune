import { EnvironmentInjector, PLATFORM_ID, runInInjectionContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { aveColorScheme } from '@avelune/ui/theme';
import { afterEach, describe, expect, it, vi } from 'vitest';

const root = document.documentElement;

/** A system preference that the test changes, as the operating system would. */
function system(dark: boolean): {
  change: (dark: boolean) => void;
  listening: () => number;
  query: ReturnType<typeof vi.spyOn>;
} {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  const query = {
    matches: dark,
    addEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) => listeners.add(listener),
    removeEventListener: (_: string, listener: (event: MediaQueryListEvent) => void) => listeners.delete(listener),
  };
  const spy = vi.spyOn(window, 'matchMedia').mockReturnValue(query as unknown as MediaQueryList);
  return {
    query: spy,
    change: (value) => {
      for (const listener of listeners) listener({ matches: value } as MediaQueryListEvent);
    },
    listening: () => listeners.size,
  };
}

function scheme() {
  return runInInjectionContext(TestBed.inject(EnvironmentInjector), () => aveColorScheme());
}

afterEach(() => {
  vi.restoreAllMocks();
  root.removeAttribute('data-theme');
});

describe('aveColorScheme', () => {
  it('reads the theme <html> says, and follows it as it changes', async () => {
    system(false);
    root.setAttribute('data-theme', 'dark');
    const shown = scheme();
    expect(shown()).toBe('dark');
    root.setAttribute('data-theme', 'light');
    await Promise.resolve();
    expect(shown()).toBe('light');
    expect(root.getAttribute('data-theme')).toBe('light');
  });

  it('follows the system while <html> names no theme', async () => {
    const preference = system(true);
    const shown = scheme();
    expect(preference.query).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
    expect(shown()).toBe('dark');
    preference.change(false);
    expect(shown()).toBe('light');
    root.setAttribute('data-theme', 'dark');
    await Promise.resolve();
    expect(shown()).toBe('dark');
    root.setAttribute('data-theme', 'system');
    await Promise.resolve();
    expect(shown()).toBe('light');
    TestBed.resetTestingModule();
    expect(preference.listening()).toBe(0);
  });

  it('is one watcher per application, and light on the server, where it reads nothing', () => {
    const query = vi.spyOn(window, 'matchMedia');
    TestBed.configureTestingModule({ providers: [{ provide: PLATFORM_ID, useValue: 'server' }] });
    const first = scheme();
    expect(first()).toBe('light');
    expect(scheme()).toBe(first);
    expect(query).not.toHaveBeenCalled();
  });
});
