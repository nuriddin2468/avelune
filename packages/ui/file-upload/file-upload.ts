import {
  Component,
  DOCUMENT,
  ElementRef,
  Injector,
  LOCALE_ID,
  afterNextRender,
  booleanAttribute,
  computed,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { _CdkPrivateStyleLoader, _VisuallyHiddenLoader } from '@angular/cdk/private';
import { NgControl, type ControlValueAccessor } from '@angular/forms';
import { FORM_FIELD } from '@angular/forms/signals';
import { lucideCircleAlert, lucideFile, lucideUpload, lucideX } from '@avelune/icons/lucide';
import { AveButton, AveIconButton } from '@avelune/ui/button';
import { AVE_CONTROL_OWNER, AVE_FIELD, AveControlTarget, injectControlState } from '@avelune/ui/forms';
import { aveFileSize, injectAveMessages } from '@avelune/ui/i18n';
import { AveIcon, provideAveIcons } from '@avelune/ui/icon';
import { accepts, sameFile } from './accept';

/** Unique ids for the names and descriptions of each file upload. */
let nextUpload = 0;

/** A file the field did not take, and why, in the locale's words. */
interface RejectedFile {
  readonly file: File;
  readonly reason: string;
}

/**
 * The kit's file field (brief §9.4, ADR 0050): a drop zone with a button that opens the system's file dialog, and a
 * list of the files chosen, each with its size and a button that removes it. Files of a type `accept` does not list,
 * larger than `maxSize`, or beyond `maxFiles` are listed with the reason and left out of the value. The value is the
 * files (`File[]`). Signal Forms bind its `value` model (`[formField]`; "at least one" is `minLength(path, 1)`,
 * ADR 0049), Reactive Forms its value accessor. Put it in an `<ave-form-field>` for its label, hint and error.
 *
 * ```html
 * <ave-file-upload accept=".pdf,image/*" [maxSize]="20 * 1024 * 1024" [formField]="contract.scan" />
 * ```
 *
 * @alpha
 */
@Component({
  selector: 'ave-file-upload',
  imports: [AveButton, AveControlTarget, AveIcon, AveIconButton],
  providers: [
    provideAveIcons([lucideCircleAlert, lucideFile, lucideUpload, lucideX]),
    { provide: AVE_CONTROL_OWNER, useExisting: AveFileUpload },
  ],
  host: {
    '[attr.data-invalid]': "state.bound && state.showError() ? 'true' : null",
    '[attr.data-disabled]': "isDisabled() ? 'true' : null",
    '(focusout)': 'left($event)',
  },
  template: `
    @if (label() !== '') {
      <span hidden [id]="labelId">{{ label() }}</span>
    }
    <span hidden [id]="requiredId">{{ messages.required }}</span>
    <div
      #zone
      class="zone"
      [attr.data-dragging]="dragging() ? 'true' : null"
      (dragenter)="over($event)"
      (dragover)="over($event)"
      (dragleave)="leave($event)"
      (drop)="dropped($event)"
    >
      <button
        aveButton
        class="choose"
        type="button"
        aveControlTarget
        [disabled]="isDisabled()"
        [attr.aria-labelledby]="name()"
        (click)="picker.click()"
      >
        <ave-icon name="upload" decorative />
        <span [id]="textId">{{ multiple() ? messages.chooseFiles : messages.chooseFile }}</span>
      </button>
      <span class="drop">{{ multiple() ? messages.dropFiles : messages.dropFile }}</span>
    </div>
    <input
      #picker
      type="file"
      hidden
      tabindex="-1"
      [accept]="accept()"
      [multiple]="multiple()"
      (change)="picked($event)"
    />
    @if (value().length > 0 || rejected().length > 0) {
      <ul class="files" [attr.aria-label]="messages.files">
        @for (file of value(); track file) {
          <li class="file">
            <ave-icon class="icon" name="file" decorative />
            <span class="text">
              <span class="name">{{ file.name }}</span>
              <span class="meta">{{ sizeOf(file) }}</span>
            </span>
            <button
              aveIconButton
              class="remove"
              type="button"
              variant="ghost"
              size="sm"
              icon="x"
              data-focus-ring="inset"
              [label]="messages.removeFile(file.name)"
              [disabled]="isDisabled()"
              (click)="remove(file)"
            ></button>
          </li>
        }
        @for (item of rejected(); track item.file) {
          <li class="file" data-rejected>
            <ave-icon class="icon" name="circle-alert" decorative />
            <span class="text">
              <span class="name">{{ item.file.name }}</span>
              <span class="meta reason">{{ item.reason }}</span>
            </span>
            <button
              aveIconButton
              class="remove"
              type="button"
              variant="ghost"
              size="sm"
              icon="x"
              data-focus-ring="inset"
              [label]="messages.removeFile(item.file.name)"
              [disabled]="isDisabled()"
              (click)="dismiss(item)"
            ></button>
          </li>
        }
      </ul>
    }
  `,
  styleUrl: './file-upload.css',
})
export class AveFileUpload implements ControlValueAccessor {
  /** The files taken, in the order they were chosen. Signal Forms bind it with `[formField]`. */
  readonly value = model<readonly File[]>([]);

  /**
   * The files the field takes, as the native `accept` attribute lists them: extensions (`.pdf`), MIME types
   * (`application/pdf`) and wildcards (`image/*`). Empty takes every file.
   */
  readonly accept = input('');

  /** Whether the field takes several files; otherwise a new file replaces the one there. */
  readonly multiple = input(false, { transform: booleanAttribute });

  /** The largest file the field takes, in bytes; `null` for no limit. */
  readonly maxSize = input<number | null>(null);

  /** The most files a `multiple` field holds; `null` for no limit. */
  readonly maxFiles = input<number | null>(null);

  /** Whether the field is disabled. A form binding sets it too. */
  readonly disabled = input(false, { transform: booleanAttribute });

  /**
   * The accessible name when the field has no visible label, joined with the button's words; an `<ave-form-field>`
   * gives it one instead.
   */
  readonly label = input('');

  /** Emits when the person leaves the field, which marks a Signal Forms field touched. */
  readonly touch = output();

  /** The form state, read on the host, where the form binding is. */
  readonly state = injectControlState();

  /** @internal The button is described as required by the kit's words: ARIA has no `aria-required` for a button. */
  readonly controlDescriptions = computed(() => (this.state.required() ? [this.requiredId] : []));

  protected readonly messages = injectAveMessages();
  protected readonly labelId = `ave-upload-${String(nextUpload)}-label`;
  protected readonly textId = `ave-upload-${String(nextUpload)}-text`;
  protected readonly requiredId = `ave-upload-${String(nextUpload++)}-required`;

  /**
   * The files that were not taken on the last choice, with the reason. The type is written out, so the entry point's
   * API names no internal type.
   */
  protected readonly rejected = signal<readonly { readonly file: File; readonly reason: string }[]>([]);

  /** Whether files are dragged over the zone. */
  protected readonly dragging = signal(false);

  protected readonly isDisabled = computed(() => this.disabled() || this.state.disabled() || this.disabledByForm());

  /** The button is named by the field's label or the `label` input, when there is one, and its own words. */
  protected readonly name = computed(() => {
    const label = this.field?.labelId ?? (this.label() === '' ? undefined : this.labelId);
    return label === undefined ? null : `${label} ${this.textId}`;
  });

  private readonly field = inject(AVE_FIELD, { optional: true });
  private readonly locale = inject(LOCALE_ID);
  private readonly document = inject(DOCUMENT);
  private readonly announcer = inject(LiveAnnouncer);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly injector = inject(Injector);
  private readonly zone = viewChild.required<ElementRef<HTMLElement>>('zone');

  private readonly disabledByForm = signal(false);
  private changed: (value: readonly File[]) => void = () => undefined;
  private touched: () => void = () => undefined;

  constructor() {
    // CDK's LiveAnnouncer hides its live element with the cdk-visually-hidden class but does not load that class's
    // styles itself (cdkAriaLive and the focus trap do), so its words would show on the page (CDK 22.2, ADR 0050).
    inject(_CdkPrivateStyleLoader).load(_VisuallyHiddenLoader);
    // Reactive Forms reach the field through its value accessor; Signal Forms through its value model.
    const ngControl =
      inject(FORM_FIELD, { self: true, optional: true }) === null
        ? inject(NgControl, { self: true, optional: true })
        : null;
    if (ngControl !== null) ngControl.valueAccessor = this;
  }

  protected sizeOf(file: File): string {
    return aveFileSize(file.size, this.locale);
  }

  /** The system's dialog closed with files; the input is emptied, so the same file can be chosen again. */
  protected picked(event: Event): void {
    if (!(event.target instanceof HTMLInputElement)) return;
    this.add([...(event.target.files ?? [])]);
    event.target.value = '';
  }

  /**
   * Files are dragged over the zone. The default is always prevented, or the browser would open a file dropped here
   * itself; a disabled field shows that it takes nothing.
   */
  protected over(event: DragEvent): void {
    event.preventDefault();
    const files = event.dataTransfer?.types.includes('Files') ?? false;
    const takes = files && !this.isDisabled();
    if (event.dataTransfer !== null) event.dataTransfer.dropEffect = takes ? 'copy' : 'none';
    this.dragging.set(takes);
  }

  /** The drag left the zone, not into one of its own parts. */
  protected leave(event: DragEvent): void {
    const next = event.relatedTarget;
    if (next instanceof Node && this.zone().nativeElement.contains(next)) return;
    this.dragging.set(false);
  }

  protected dropped(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    if (this.isDisabled()) return;
    this.add([...(event.dataTransfer?.files ?? [])]);
  }

  /** Takes a file off the list; focus goes to the remove button in its place. */
  protected remove(file: File): void {
    const index = this.value().indexOf(file);
    this.set(this.value().filter((item) => item !== file));
    this.refocus(index);
  }

  /** Takes a file that was not taken off the list. */
  protected dismiss(item: { readonly file: File; readonly reason: string }): void {
    const index = this.value().length + this.rejected().indexOf(item);
    this.rejected.update((list) => list.filter((entry) => entry !== item));
    this.refocus(index);
  }

  /**
   * Focus left the field: it is touched. The system's file dialog takes the window's focus and leaves the button
   * focused, which is not leaving.
   */
  protected left(event: FocusEvent): void {
    const next = event.relatedTarget;
    if (next instanceof Node && this.host.contains(next)) return;
    if (!this.document.hasFocus() && this.host.contains(this.document.activeElement)) return;
    this.touch.emit();
    this.touched();
  }

  /**
   * Takes the files the person chose or dropped, in order: of an accepted type, within the size, not already there,
   * and within the number; the rest are listed with the reason. Screen readers hear what happened.
   */
  private add(files: readonly File[]): void {
    if (files.length === 0) return;
    const multiple = this.multiple();
    const next = multiple ? [...this.value()] : [];
    const limit = multiple ? (this.maxFiles() ?? Number.POSITIVE_INFINITY) : 1;
    const maxSize = this.maxSize();
    const rejected: RejectedFile[] = [];
    let added = 0;
    for (const file of files) {
      if (!accepts(this.accept(), file)) rejected.push({ file, reason: this.messages.fileTypeRejected });
      else if (maxSize !== null && file.size > maxSize)
        rejected.push({ file, reason: this.messages.fileTooLarge(aveFileSize(maxSize, this.locale)) });
      else if (next.some((item) => sameFile(item, file))) continue;
      else if (next.length >= limit) rejected.push({ file, reason: this.messages.tooManyFiles(limit) });
      else {
        next.push(file);
        added += 1;
      }
    }
    this.rejected.set(rejected);
    if (added > 0) this.set(next);
    const said = [
      ...(added > 0 ? [this.messages.filesAdded(added)] : []),
      ...rejected.map(({ file, reason }) => `${file.name}: ${reason}`),
    ];
    if (said.length > 0) void this.announcer.announce(said.join(' '), 'polite');
  }

  private set(files: readonly File[]): void {
    this.value.set(files);
    this.changed(files);
  }

  /** After a row is removed, focus goes to the remove button now at its place, or the one before, or the button. */
  private refocus(index: number): void {
    afterNextRender(
      () => {
        const buttons = [...this.host.querySelectorAll<HTMLButtonElement>('.remove')];
        (buttons[index] ?? buttons[index - 1] ?? this.host.querySelector<HTMLButtonElement>('.choose'))?.focus();
      },
      { injector: this.injector },
    );
  }

  /** @internal */
  writeValue(value: unknown): void {
    this.value.set(Array.isArray(value) ? value.filter((item): item is File => item instanceof File) : []);
  }

  /** @internal */
  registerOnChange(callback: (value: readonly File[]) => void): void {
    this.changed = callback;
  }

  /** @internal */
  registerOnTouched(callback: () => void): void {
    this.touched = callback;
  }

  /** @internal */
  setDisabledState(disabled: boolean): void {
    this.disabledByForm.set(disabled);
  }
}
