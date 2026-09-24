import { Injector, runInInjectionContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { lucideCheck, lucideX } from '@avelune/icons/lucide';
import { defineAveIcon, provideAveIcons } from '@avelune/ui/icon';
import { describe, expect, it } from 'vitest';
import { injectAveIcons } from './registry';

declare module '@avelune/icons' {
  interface IconNames {
    'spec-check': true;
  }
}

const iconsOf = (injector: Injector) => [...runInInjectionContext(injector, injectAveIcons).keys()];

describe('provideAveIcons', () => {
  it('starts from no icons', () => {
    expect(iconsOf(TestBed.inject(Injector))).toEqual([]);
  });

  it("adds a child's icons to its ancestors' and leaves the ancestors alone", () => {
    TestBed.configureTestingModule({ providers: [provideAveIcons([lucideX])] });
    const root = TestBed.inject(Injector);
    const child = Injector.create({ providers: [provideAveIcons([lucideCheck])], parent: root });
    expect(iconsOf(child)).toEqual(['x', 'check']);
    expect(iconsOf(root)).toEqual(['x']);
  });

  it('accepts the same icon twice, and throws in development for one name with two drawings', () => {
    TestBed.configureTestingModule({ providers: [provideAveIcons([lucideX, lucideX])] });
    const root = TestBed.inject(Injector);
    expect(iconsOf(root)).toEqual(['x']);

    const clash = defineAveIcon('spec-check', '<svg viewBox="0 0 24 24"><path d="M0 0"/></svg>');
    const other = defineAveIcon('spec-check', '<svg viewBox="0 0 24 24"><path d="M1 1"/></svg>');
    const child = Injector.create({ providers: [provideAveIcons([clash, other])], parent: root });
    expect(() => iconsOf(child)).toThrow(
      'provideAveIcons: "spec-check" is already registered with another drawing; give one of the two another name.',
    );
  });
});
