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
    for (const messages of [aveMessagesEn, aveMessagesRu, aveMessagesUzLatn, aveMessagesUzCyrl]) {
      expect(Object.keys(messages).sort()).toEqual(keys);
      for (const key of keys) {
        const message: unknown = messages[key];
        const text: unknown = typeof message === 'function' ? Reflect.apply(message, undefined, ['1']) : message;
        expect(typeof text === 'string' && text.trim() !== '', key).toBe(true);
      }
    }
  });
});

describe('the messages of a file upload', () => {
  it('name the file and the limit, and count in Russian with the right case', () => {
    expect(aveMessagesRu.removeFile('Смета.xlsx')).toBe('Удалить «Смета.xlsx»');
    expect(aveMessagesRu.fileTooLarge('20 МБ')).toBe('Файл больше 20 МБ. Выберите файл поменьше.');
    expect([1, 2, 5, 21].map((max) => aveMessagesRu.tooManyFiles(max))).toEqual([
      'Можно прикрепить не больше 1 файла.',
      'Можно прикрепить не больше 2 файлов.',
      'Можно прикрепить не больше 5 файлов.',
      'Можно прикрепить не больше 21 файла.',
    ]);
    expect([1, 3].map((max) => aveMessagesEn.tooManyFiles(max))).toEqual([
      'You can attach at most 1 file.',
      'You can attach at most 3 files.',
    ]);
    expect(aveMessagesUzLatn.filesAdded(2)).toBe('Biriktirilgan fayllar: 2');
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
