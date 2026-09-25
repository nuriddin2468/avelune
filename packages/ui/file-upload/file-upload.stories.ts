import { Component, LOCALE_ID, input, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormField, form, minLength } from '@angular/forms/signals';
import {
  applicationConfig,
  componentWrapperDecorator,
  moduleMetadata,
  type Meta,
  type StoryObj,
} from '@storybook/angular-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { AveFileUpload } from '@avelune/ui/file-upload';
import { AveError, AveFormField, AveHint } from '@avelune/ui/form-field';

const megabyte = 1024 * 1024;

/** A file of a size in bytes, for the stories. */
function file(name: string, size: number, type = 'application/pdf'): File {
  return new File([new ArrayBuffer(Math.round(size))], name, { type, lastModified: 1 });
}

/** Drops files on the zone of the field at `index`, as a person does. */
function drop(canvasElement: HTMLElement, files: readonly File[], index = 0): void {
  const zone = canvasElement.querySelectorAll('.zone')[index];
  const transfer = new DataTransfer();
  for (const item of files) transfer.items.add(item);
  zone?.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer: transfer }));
}

type View = 'states' | 'compact';

/** The frame the stories draw file uploads in, with plain labels. Styled with tokens only. */
@Component({
  selector: 'ave-file-upload-stories',
  imports: [AveFileUpload],
  template: `
    <div class="stack narrow" [attr.data-density]="view() === 'compact' ? 'compact' : null">
      <div class="field">
        <span class="label">Empty</span>
        <ave-file-upload label="Empty" multiple />
      </div>
      <div class="field">
        <span class="label">With files</span>
        <ave-file-upload label="With files" multiple [value]="files" />
      </div>
      @if (view() === 'states') {
        <div class="field">
          <span class="label">Dragging</span>
          <ave-file-upload label="Dragging" multiple data-dragging-target />
        </div>
        <div class="field">
          <span class="label">Disabled</span>
          <ave-file-upload label="Disabled" multiple disabled [value]="files" />
        </div>
      }
    </div>
  `,
  styleUrl: './file-upload.stories.css',
})
class FileUploadStories {
  readonly view = input<View>('states');
  protected readonly files = [file('Договор ДК-2026-114.pdf', 2.4 * megabyte), file('Смета.pdf', 340 * 1024)];
}

/** Signal Forms and Reactive Forms: at least one file each. */
@Component({
  selector: 'ave-file-upload-forms',
  imports: [AveFileUpload, FormField, ReactiveFormsModule],
  template: `
    <div class="stack narrow">
      <div class="field">
        <span class="label">Attachments (Signal Forms)</span>
        <ave-file-upload label="Attachments (Signal Forms)" multiple [formField]="letter.attachments" />
      </div>
      <div class="field">
        <span class="label">Scan (Reactive Forms)</span>
        <ave-file-upload label="Scan (Reactive Forms)" [formControl]="scan" />
      </div>
    </div>
    <p class="status" role="status">
      Signal Forms: {{ model().attachments.length }} · Reactive Forms: {{ scan.value.length }}
    </p>
  `,
  styleUrl: './file-upload.stories.css',
})
class FileUploadForms {
  protected readonly model = signal<{ attachments: readonly File[] }>({ attachments: [] });
  protected readonly letter = form(this.model, (path) => {
    minLength(path.attachments, 1);
  });
  protected readonly scan = new FormControl<readonly File[]>([], {
    nonNullable: true,
    // eslint-disable-next-line @typescript-eslint/unbound-method -- Angular's validators are static functions that never read this.
    validators: [Validators.required],
  });
}

/** A long Russian label, hint and error around a required field in a 320px column, with a long file name. */
@Component({
  selector: 'ave-file-upload-long',
  imports: [AveError, AveFileUpload, AveFormField, AveHint, FormField],
  template: `
    <div class="stack narrow">
      <ave-form-field label="Протокол разногласий к договору поставки, подписанный обеими сторонами">
        <ave-file-upload multiple accept=".pdf" [maxSize]="5 * 1024 * 1024" [formField]="contract.protocol" />
        <p aveHint>Только PDF, до 5 МБ каждый; скан или файл с электронной подписью, не больше десяти страниц.</p>
      </ave-form-field>
      <ave-form-field label="Доверенность представителя">
        <ave-file-upload [formField]="contract.power" />
        <p aveError>Прикрепите доверенность: без неё договор не примут к регистрации.</p>
      </ave-form-field>
    </div>
  `,
  styleUrl: './file-upload.stories.css',
})
class FileUploadLong {
  protected readonly model = signal<{ protocol: readonly File[]; power: readonly File[] }>({
    protocol: [file('Протокол_разногласий_к_договору_поставки_ДК-2026-114_от_18.03.2026_подписан.pdf', 1.2 * megabyte)],
    power: [],
  });
  protected readonly contract = form(this.model, (path) => {
    minLength(path.power, 1);
  });

  constructor() {
    this.contract.power().markAsTouched();
  }
}

/** Pads the single-field stories. */
@Component({
  selector: 'ave-file-upload-story-frame',
  template: '<div class="narrow"><ng-content /></div>',
  styleUrl: './file-upload.stories.css',
})
class FileUploadStoryFrame {}

type Story = StoryObj;

function locale(value: string): ReturnType<typeof applicationConfig> {
  return applicationConfig({ providers: [{ provide: LOCALE_ID, useValue: value }] });
}

function frame(view: View): NonNullable<Story['render']> {
  return () => ({
    props: { view },
    template: `<ave-file-upload-stories [view]="view" />`,
    moduleMetadata: { imports: [FileUploadStories] },
  });
}

function source(...lines: readonly string[]): NonNullable<Story['parameters']> {
  return { docs: { source: { code: lines.join('\n'), language: 'html' } } };
}

// No `component`: Storybook instantiates a meta's component outside an injection context, where `model()` throws.
const meta: Meta = {
  title: 'Components/FileUpload',
  decorators: [moduleMetadata({ imports: [AveFileUpload, AveFormField, AveHint, FileUploadStoryFrame] })],
  render: () => ({
    template: `
      <ave-form-field label="Скан подписанного договора">
        <ave-file-upload accept=".pdf,image/*" [maxSize]="20 * 1024 * 1024" />
        <p aveHint>PDF или изображение, до 20 МБ.</p>
      </ave-form-field>
    `,
  }),
};
export default meta;

/** One file in Russian, in a form field: the zone, its button and the drop hint. */
export const Default: Story = {
  decorators: [locale('ru'), componentWrapperDecorator(FileUploadStoryFrame)],
  parameters: source(
    '<ave-form-field label="Скан подписанного договора">',
    '  <ave-file-upload accept=".pdf,image/*" [maxSize]="20 * 1024 * 1024" [formField]="contract.scan" />',
    '  <p aveHint>PDF или изображение, до 20 МБ.</p>',
    '</ave-form-field>',
  ),
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Скан подписанного договора Выбрать файл' });
    await expect(button).toHaveAccessibleDescription('PDF или изображение, до 20 МБ.');
    await expect(canvasElement.querySelector('.drop')).toHaveTextContent('или перетащите его сюда');
  },
};

/** Several files dropped at once: the ones taken with their sizes, the others with the reason. */
export const Files: Story = {
  tags: ['forced-colors'],
  decorators: [locale('ru'), componentWrapperDecorator(FileUploadStoryFrame)],
  render: () => ({
    template: `
      <ave-form-field label="Приложения к письму">
        <ave-file-upload multiple accept=".pdf,image/*" [maxSize]="5 * 1024 * 1024" [maxFiles]="3" />
        <p aveHint>PDF или изображения, до 5 МБ, не больше трёх.</p>
      </ave-form-field>
    `,
  }),
  parameters: source('<ave-file-upload multiple accept=".pdf,image/*" [maxSize]="5 * 1024 * 1024" [maxFiles]="3" />'),
  play: async ({ canvasElement }) => {
    drop(canvasElement, [
      file('Письмо № 14-02.pdf', 2.4 * megabyte),
      file('Фото объекта.jpg', 860 * 1024, 'image/jpeg'),
      file('Смета.xlsx', 48 * 1024, 'application/vnd.ms-excel'),
      file('Чертёж.pdf', 12 * megabyte),
    ]);
    const list = await within(canvasElement).findByRole('list', { name: 'Файлы' });
    await expect(within(list).getAllByRole('listitem')).toHaveLength(4);
    await expect(list).toHaveTextContent('2,4 МБ');
    await expect(list).toHaveTextContent('Файл больше 5 МБ. Выберите файл поменьше.');
    const live = document.querySelector('.cdk-live-announcer-element');
    await expect(live?.getBoundingClientRect().width).toBeLessThanOrEqual(1);
  },
};

/** Empty, with files, dragging over, disabled. Invalid is in the Forms and Long text stories. */
export const States: Story = {
  tags: ['forced-colors'],
  decorators: [locale('ru')],
  render: frame('states'),
  parameters: source('<ave-file-upload multiple disabled />'),
  play: async ({ canvasElement }) => {
    const zone = canvasElement.querySelector('[data-dragging-target] .zone');
    const transfer = new DataTransfer();
    transfer.items.add(file('Акт.pdf', 10));
    zone?.dispatchEvent(new DragEvent('dragenter', { bubbles: true, cancelable: true, dataTransfer: transfer }));
    await waitFor(() => expect(zone).toHaveAttribute('data-dragging', 'true'));
    for (const button of within(canvasElement).getAllByRole('button', { name: /^Disabled/ }))
      await expect(button).toBeDisabled();
  },
};

/** Both form APIs: a file required, invalid once left empty; a chosen file is counted. */
export const Forms: Story = {
  decorators: [locale('ru')],
  render: () => ({ template: '<ave-file-upload-forms />', moduleMetadata: { imports: [FileUploadForms] } }),
  parameters: source(
    '<ave-file-upload multiple [formField]="letter.attachments" />',
    '<ave-file-upload [formControl]="scan" />',
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const signalForms = canvas.getByRole('button', { name: 'Attachments (Signal Forms) Выбрать файлы' });
    await expect(signalForms).toHaveAccessibleDescription('Обязательное поле');
    signalForms.focus();
    await userEvent.tab();
    await waitFor(() => expect(signalForms).toHaveAttribute('aria-invalid', 'true'));
    const [, reactive] = canvasElement.querySelectorAll<HTMLInputElement>('input[type=file]');
    if (reactive === undefined) throw new Error('No input');
    await userEvent.upload(reactive, file('Скан.pdf', 1.2 * megabyte));
    await waitFor(() => expect(canvas.getByRole('status')).toHaveTextContent('Reactive Forms: 1'));
    (document.activeElement as HTMLElement | null)?.blur();
  },
};

/** Long Russian labels, hints, an error and a file name wrap in a 320px column. */
export const LongText: Story = {
  name: 'Long text',
  decorators: [locale('ru')],
  render: () => ({ template: '<ave-file-upload-long />', moduleMetadata: { imports: [FileUploadLong] } }),
  parameters: source('<ave-file-upload multiple accept=".pdf" [formField]="contract.protocol" />'),
  play: async ({ canvasElement }) => {
    const column = canvasElement.querySelector('.narrow');
    if (column === null) throw new Error('No column');
    await expect(column.scrollWidth).toBeLessThanOrEqual(column.clientWidth);
    const name = canvasElement.querySelector('.name');
    await expect(name?.getClientRects().length).toBeGreaterThan(0);
    await expect(name?.getBoundingClientRect().height).toBeGreaterThan(20);
    const remove = canvasElement.querySelector('.remove');
    await expect(remove?.getBoundingClientRect().right).toBeLessThanOrEqual(column.getBoundingClientRect().right);
    const power = within(canvasElement).getByRole('button', { name: /^Доверенность представителя/ });
    await expect(power).toHaveAttribute('aria-invalid', 'true');
  },
};

/** Uzbek in Latin script: the kit's words and sizes (`2,4 MB`, which Chromium would write `2.4`). */
export const UzbekLatin: Story = {
  name: 'Uzbek (Latin)',
  decorators: [locale('uz-Latn'), componentWrapperDecorator(FileUploadStoryFrame)],
  render: () => ({ template: `<ave-file-upload label="Ilovalar" multiple accept=".pdf" />` }),
  play: async ({ canvasElement }) => {
    drop(canvasElement, [file('Shartnoma.pdf', 2.4 * megabyte), file('Smeta.xlsx', 1000, 'text/csv')]);
    const list = await within(canvasElement).findByRole('list', { name: 'Fayllar' });
    await expect(list).toHaveTextContent('2,4 MB');
    await expect(list).toHaveTextContent('Bu turdagi fayllar qabul qilinmaydi.');
    await expect(within(canvasElement).getByRole('button', { name: 'Ilovalar Fayllarni tanlash' })).toBeVisible();
  },
};

/** Compact density: the button and the rows one step down. */
export const Compact: Story = {
  decorators: [locale('ru')],
  render: frame('compact'),
  parameters: source('<div data-density="compact">', '  <ave-file-upload multiple />', '</div>'),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('.choose')?.getBoundingClientRect().height).toBe(32);
    const rows = [...canvasElement.querySelectorAll('.file')];
    for (const row of rows) await expect(row.getBoundingClientRect().height).toBeGreaterThanOrEqual(36);
  },
};
