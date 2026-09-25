import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { aveOverlayPresence } from '@avelune/ui/overlay';

describe('aveOverlayPresence', () => {
  it('is open while expanded, and closes at once when the list has no exit to play', async () => {
    const expanded = signal(true);
    const presence = TestBed.runInInjectionContext(() => aveOverlayPresence(expanded, signal(undefined)));
    TestBed.tick();
    expect(presence.open()).toBe(true);
    expanded.set(false);
    TestBed.tick();
    await expect.poll(() => presence.open()).toBe(false);
    expect(presence.closing()).toBe(false);
  });
});
