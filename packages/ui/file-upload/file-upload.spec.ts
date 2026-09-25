import { Component, LOCALE_ID, signal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormField, disabled, form, minLength } from '@angular/forms/signals';
import { AveFileUpload } from '@avelune/ui/file-upload';
import { AveFileUploadHarness } from '@avelune/ui/file-upload/testing';
import { AveFormField, AveHint } from '@avelune/ui/form-field';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { accepts } from './accept';

const megabyte = 1024 * 1024;

/** A file of a size in bytes. */
function file(name: string, size: number, type = 'application/pdf'): File {
  return new File([new ArrayBuffer(Math.round(size))], name, { type, lastModified: 1 });
}

/** Chooses files as the system's dialog does: on the field's file input, then `change`. */
function choose(element: HTMLElement, files: readonly File[]): void {
  const input = element.querySelector<HTMLInputElement>('input[type=file]');
  if (input === null) throw new Error('No file input');
  const transfer = new DataTransfer();
  for (const item of files) transfer.items.add(item);
  input.files = transfer.files;
  input.dispatchEvent(new Event('change'));
}

/** Dispatches a drag event with files on the zone. */
function drag(element: HTMLElement, files: readonly File[], type: 'dragenter' | 'dragover' | 'drop'): DragEvent {
  const zone = element.querySelector('.zone');
  if (zone === null) throw new Error('No zone');
  const transfer = new DataTransfer();
  for (const item of files) transfer.items.add(item);
  const event = new DragEvent(type, { bubbles: true, cancelable: true, dataTransfer: transfer });
  zone.dispatchEvent(event);
  return event;
}

@Component({
  selector: 'ave-upload-signal',
  imports: [AveFileUpload, AveFormField, AveHint, FormField],
  template: `
    <ave-form-field label="Приложения">
      <ave-file-upload
        multiple
        accept=".pdf,image/*"
        [maxSize]="5 * 1024 * 1024"
        [maxFiles]="3"
        [formField]="letter.attachments"
      />
      <p aveHint>PDF или изображения, до 5 МБ.</p>
    </ave-form-field>
  `,
})
class SignalHost {
  readonly model = signal<{ attachments: readonly File[]; locked: boolean }>({ attachments: [], locked: false });
  // `context.valueOf`: see the angular-eslint note in the input specs.
  readonly letter = form(this.model, (path) => {
    minLength(path.attachments, 1);
    disabled(path.attachments, { when: (context) => context.valueOf(path.locked) });
  });
}

@Component({
  selector: 'ave-upload-reactive',
  imports: [AveFileUpload, ReactiveFormsModule],
  template: `<ave-file-upload label="Скан" [formControl]="scan" />`,
})
class ReactiveHost {
  // eslint-disable-next-line @typescript-eslint/unbound-method -- Angular's validators are static functions that never read this.
  readonly scan = new FormControl<readonly File[]>([], { nonNullable: true, validators: [Validators.required] });
}

@Component({
  selector: 'ave-upload-bare',
  imports: [AveFileUpload],
  template: `<ave-file-upload />`,
})
class BareHost {}

function mount<T>(type: new () => T, locale = 'ru'): ComponentFixture<T> {
  TestBed.configureTestingModule({ providers: [{ provide: LOCALE_ID, useValue: locale }] });
  const fixture = TestBed.createComponent(type);
  document.body.append(fixture.nativeElement as HTMLElement);
  fixture.detectChanges();
  return fixture;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AveFileUpload', () => {
  it('replaces its one file, writes its size in the locale, and tells screen readers', async () => {
    const fixture = mount(ReactiveHost);
    const upload = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveFileUploadHarness);
    const element = fixture.nativeElement as HTMLElement;
    expect(await upload.getButtonText()).toBe('Выбрать файл');
    choose(element, [file('Скан.pdf', 2.4 * megabyte)]);
    expect(await upload.getFileNames()).toEqual(['Скан.pdf']);
    expect(await upload.getFileSizes()).toEqual(['2,4\u00a0МБ']);
    await expect
      .poll(() => document.querySelector('.cdk-live-announcer-element')?.textContent)
      .toBe('Прикреплено файлов: 1');
    // Heard, not seen: CDK's live element is hidden once the kit loads its styles.
    expect(document.querySelector('.cdk-live-announcer-element')?.getBoundingClientRect().width).toBeLessThanOrEqual(1);
    choose(element, [file('Скан, второй экземпляр.pdf', 300)]);
    expect(await upload.getFileNames()).toEqual(['Скан, второй экземпляр.pdf']);
    expect(fixture.componentInstance.scan.value.map((item) => item.name)).toEqual(['Скан, второй экземпляр.pdf']);
    choose(element, []);
    expect(await upload.getFileNames()).toHaveLength(1);
  });

  it('adds files, and lists the ones it does not take with the reason', async () => {
    const fixture = mount(SignalHost);
    const upload = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveFileUploadHarness);
    const element = fixture.nativeElement as HTMLElement;
    expect(await upload.getButtonText()).toBe('Выбрать файлы');
    const letter = file('Письмо.pdf', 1000);
    choose(element, [letter, file('Фото.JPG', 2000, 'image/jpeg')]);
    choose(element, [
      letter,
      file('Смета.xlsx', 1000, 'application/vnd.ms-excel'),
      file('Чертёж.pdf', 6 * megabyte),
      file('Акт.pdf', 10),
      file('Опись.pdf', 20),
    ]);
    expect(await upload.getFileNames()).toEqual(['Письмо.pdf', 'Фото.JPG', 'Акт.pdf']);
    expect(await upload.getRejected()).toEqual([
      { name: 'Смета.xlsx', reason: 'Файлы этого типа не принимаются.' },
      { name: 'Чертёж.pdf', reason: 'Файл больше 5\u00a0МБ. Выберите файл поменьше.' },
      { name: 'Опись.pdf', reason: 'Можно прикрепить не больше 3 файлов.' },
    ]);
    expect(fixture.componentInstance.model().attachments).toHaveLength(3);
    const found = await TestbedHarnessEnvironment.loader(fixture).getHarness(
      AveFileUploadHarness.with({ fileName: /^Акт/ }),
    );
    expect(await found.getFileNames()).toContain('Акт.pdf');
  });

  it('moves focus to the next remove button, the one before, then the choose button', async () => {
    const fixture = mount(SignalHost);
    const upload = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveFileUploadHarness);
    const element = fixture.nativeElement as HTMLElement;
    choose(element, [file('Первый.pdf', 10), file('Второй.pdf', 20), file('Смета.xlsx', 30, 'text/csv')]);
    await upload.removeFile('Первый.pdf');
    await expect.poll(() => document.activeElement?.getAttribute('aria-label')).toBe('Удалить «Второй.pdf»');
    await upload.removeFile('Смета.xlsx');
    await expect.poll(() => document.activeElement?.getAttribute('aria-label')).toBe('Удалить «Второй.pdf»');
    await upload.removeFile('Второй.pdf');
    await expect.poll(() => document.activeElement?.classList.contains('choose')).toBe(true);
    expect(element.querySelector('.files')).toBeNull();
    await expect(upload.removeFile('Третий.pdf')).rejects.toThrow('the list has no file named "Третий.pdf"');
  });

  it('shows a drag over the zone, takes dropped files, and keeps the browser from opening them', async () => {
    const fixture = mount(SignalHost);
    const upload = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveFileUploadHarness);
    const element = fixture.nativeElement as HTMLElement;
    const over = drag(element, [file('Акт.pdf', 10)], 'dragenter');
    expect(over.defaultPrevented).toBe(true);
    expect(await upload.isDragging()).toBe(true);
    const zone = element.querySelector('.zone');
    zone?.dispatchEvent(new DragEvent('dragleave', { bubbles: true, relatedTarget: element.querySelector('.choose') }));
    expect(await upload.isDragging()).toBe(true);
    zone?.dispatchEvent(new DragEvent('dragleave', { bubbles: true, relatedTarget: document.body }));
    expect(await upload.isDragging()).toBe(false);
    zone?.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true }));
    expect(await upload.isDragging()).toBe(false);
    const drop = drag(element, [file('Акт.pdf', 10)], 'drop');
    expect(drop.defaultPrevented).toBe(true);
    zone?.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true }));
    expect(await upload.getFileNames()).toEqual(['Акт.pdf']);
    expect(await upload.isDragging()).toBe(false);
  });

  it('takes nothing while disabled, and dims every part', async () => {
    const fixture = mount(SignalHost);
    const upload = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveFileUploadHarness);
    const element = fixture.nativeElement as HTMLElement;
    choose(element, [file('Акт.pdf', 10)]);
    fixture.componentInstance.model.update((model) => ({ ...model, locked: true }));
    fixture.detectChanges();
    expect(await upload.isDisabled()).toBe(true);
    expect(element.querySelector('ave-file-upload')?.getAttribute('data-disabled')).toBe('true');
    expect(element.querySelector<HTMLButtonElement>('.remove')?.disabled).toBe(true);
    drag(element, [file('Опись.pdf', 10)], 'dragover');
    expect(await upload.isDragging()).toBe(false);
    expect(drag(element, [file('Опись.pdf', 10)], 'drop').defaultPrevented).toBe(true);
    expect(await upload.getFileNames()).toEqual(['Акт.pdf']);
  });

  it('is named by its field and described by its hint and, when a file is needed, by "required"', async () => {
    const fixture = mount(SignalHost);
    const upload = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveFileUploadHarness);
    const element = fixture.nativeElement as HTMLElement;
    const button = element.querySelector('.choose');
    const text = (ids: string | null | undefined) =>
      (ids ?? '')
        .split(' ')
        .map((id) => document.getElementById(id)?.textContent.trim())
        .join(' | ');
    const [label, own] = button?.getAttribute('aria-labelledby')?.split(' ') ?? [];
    expect(label).toBe(element.querySelector('label')?.id);
    expect(document.getElementById(own ?? '')?.textContent).toBe('Выбрать файлы');
    expect(text(button?.getAttribute('aria-describedby'))).toBe('Обязательное поле | PDF или изображения, до 5 МБ.');
    expect(button?.hasAttribute('aria-required')).toBe(false);
    expect(await upload.isRequired()).toBe(true);
    expect(await upload.isInvalid()).toBe(false);
    await upload.focus();
    await upload.blur();
    expect(await upload.isInvalid()).toBe(true);
    expect(element.querySelector('ave-file-upload')?.getAttribute('data-invalid')).toBe('true');
    choose(element, [file('Акт.pdf', 10)]);
    fixture.detectChanges();
    expect(await upload.isInvalid()).toBe(false);
  });

  it('binds Reactive Forms, is touched when focus leaves but not while the system dialog is open', async () => {
    const fixture = mount(ReactiveHost, 'en-US');
    const upload = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveFileUploadHarness);
    const element = fixture.nativeElement as HTMLElement;
    const { scan } = fixture.componentInstance;
    expect(await upload.isRequired()).toBe(true);
    const button = element.querySelector<HTMLButtonElement>('.choose');
    const labelled = button?.getAttribute('aria-labelledby')?.split(' ') ?? [];
    expect(labelled.map((id) => document.getElementById(id)?.textContent.trim())).toEqual(['Скан', 'Choose a file']);
    await upload.focus();
    vi.spyOn(document, 'hasFocus').mockReturnValue(false);
    button?.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    expect(scan.touched).toBe(false);
    vi.restoreAllMocks();
    await upload.blur();
    expect(scan.touched).toBe(true);
    element.querySelector('input[type=file]')?.dispatchEvent(new Event('change'));
    scan.setValue([file('Scan.pdf', 2.4 * megabyte)]);
    expect(await upload.getFileSizes()).toEqual(['2.4\u00a0MB']);
    scan.setValue('nothing' as unknown as File[]);
    expect(await upload.getFileNames()).toEqual([]);
    scan.disable();
    expect(await upload.isDisabled()).toBe(true);
  });
});

describe('AveFileUpload without a form', () => {
  it('is named by its own words and needs no file', async () => {
    const fixture = mount(BareHost, 'en-US');
    const upload = await TestbedHarnessEnvironment.loader(fixture).getHarness(AveFileUploadHarness.with());
    const button = (fixture.nativeElement as HTMLElement).querySelector('.choose');
    expect(button?.hasAttribute('aria-labelledby')).toBe(false);
    expect(button?.hasAttribute('aria-describedby')).toBe(false);
    expect(await upload.isRequired()).toBe(false);
    expect(await upload.isInvalid()).toBe(false);
    expect(await upload.getButtonText()).toBe('Choose a file');
  });
});

describe('accepts', () => {
  it('reads extensions, MIME types and wildcards in any case, and takes everything when empty', () => {
    const pdf = { name: 'Акт.PDF', type: 'application/pdf' };
    expect(accepts('', pdf)).toBe(true);
    expect(accepts(' .pdf , .docx ', pdf)).toBe(true);
    expect(accepts('application/pdf', { name: 'act', type: 'application/pdf' })).toBe(true);
    expect(accepts('image/*', { name: 'photo.heic', type: 'image/heic' })).toBe(true);
    expect(accepts('image/*,.docx', pdf)).toBe(false);
  });
});
