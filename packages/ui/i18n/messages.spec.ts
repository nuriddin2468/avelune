import { Component, LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  aveMessagesEn,
  aveMessagesFor,
  aveMessagesRu,
  aveMessagesUzCyrl,
  aveMessagesUzLatn,
  injectAveMessages,
  provideAveMessages,
  type AveMessages,
} from '@avelune/ui/i18n';
import { describe, expect, it } from 'vitest';

@Component({ selector: 'ave-messages-host', template: '{{ messages.noResults }}' })
class Host {
  readonly messages = injectAveMessages();
}

describe('aveMessagesFor', () => {
  it.each([
    ['ru', aveMessagesRu],
    ['ru-RU', aveMessagesRu],
    ['uz', aveMessagesUzLatn],
    ['uz-Latn-UZ', aveMessagesUzLatn],
    ['uz-Cyrl', aveMessagesUzCyrl],
    ['uz_Cyrl_UZ', aveMessagesUzCyrl],
    ['en-US', aveMessagesEn],
    ['de', aveMessagesEn],
    ['', aveMessagesEn],
  ])('picks the messages for %s', (locale, messages) => {
    expect(aveMessagesFor(locale)).toBe(messages);
  });

  it('has every message in every locale', () => {
    const keys = Object.keys(aveMessagesEn).sort() as (keyof AveMessages)[];
    for (const messages of [aveMessagesRu, aveMessagesUzLatn, aveMessagesUzCyrl]) {
      expect(Object.keys(messages).sort()).toEqual(keys);
      expect(keys.every((key) => messages[key].trim() !== '')).toBe(true);
    }
  });
});

describe('injectAveMessages', () => {
  it('follows LOCALE_ID', () => {
    TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: 'uz-Cyrl' }] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toBe('Ҳеч нарса топилмади');
  });

  it('takes the messages an application provides over the kit’s', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: LOCALE_ID, useValue: 'ru' }, provideAveMessages({ noResults: 'Контрагент не найден' })],
    });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toBe('Контрагент не найден');
  });
});
