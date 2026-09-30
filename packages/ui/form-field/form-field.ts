import { Component, computed, input, signal, type Signal } from '@angular/core';
import { lucideCircleAlert } from '@avelune/icons/lucide';
import { AVE_FIELD, type AveControlState, type AveFieldContext } from '@avelune/ui/forms';
import { AveIcon, provideAveIcons } from '@avelune/ui/icon';
import { AVE_FIELD_PARTS } from './parts';

/** Unique ids for the controls of fields. */
let nextField = 0;

/**
 * A labelled form field (brief §9.1, ADR 0040): the label above the control, with an asterisk when the control needs
 * a value, and under it a hint (`[aveHint]`) and an error (`[aveError]`). The control inside it, such as
 * `input[aveInput]`, takes the label's id and is described by the hint and, while it shows, the error. With a form
 * binding the error shows once the control is invalid and touched.
 *
 * ```html
 * <ave-form-field label="Contract number">
 *   <input aveInput type="text" [formField]="form.number" />
 *   <p aveHint>As written on the signed copy.</p>
 *   <p aveError>Enter the contract number, for example ДК-2026/114.</p>
 * </ave-form-field>
 * ```
 *
 * With a form binding, the docs page shows the error in an `@if` block of the field's errors.
 *
 * @beta
 */
@Component({
  selector: 'ave-form-field',
  imports: [AveIcon],
  providers: [
    provideAveIcons([lucideCircleAlert]),
    { provide: AVE_FIELD, useExisting: AveFormField },
    { provide: AVE_FIELD_PARTS, useExisting: AveFormField },
  ],
  host: {
    '[attr.data-disabled]': 'disabled() ? "" : null',
    '[attr.data-invalid]': 'errorShown() ? "" : null',
  },
  // The required marker follows the label with no whitespace, behind a no-break space, so the asterisk stays with the
  // last word when a long label wraps. It is always in the page and hidden while the control is optional. A control
  // that shows its value (a slider) puts it at the end of the label, hidden from the name (ADR 0051).
  template: `
    <label class="label" [id]="labelId" [attr.for]="controlId()">
      <span class="text"
        >{{ label() }}<span class="required" aria-hidden="true" [hidden]="!required()">&nbsp;*</span></span
      >
      @if (value(); as text) {
        <span class="value" aria-hidden="true">{{ text }}</span>
      }
    </label>
    <ng-content />
    <ng-content select="[aveHint]" />
    @if (errorShown()) {
      <div class="error">
        <ave-icon name="circle-alert" decorative />
        <ng-content select="[aveError]" />
      </div>
    }
  `,
  styleUrl: './form-field.css',
})
export class AveFormField implements AveFieldContext {
  /** The label: what the control asks for, in a few words ("Contract number"). It names the control. */
  readonly label = input.required<string>();

  /** The id a control without its own takes, so the label names it. */
  readonly defaultId = `ave-field-${String(nextField++)}`;

  /** The id of the label, for a control that names its parts with it. */
  readonly labelId = `${this.defaultId}-label`;

  private readonly control = signal<{ readonly id: string; readonly state: AveControlState } | null>(null);
  private readonly shown = signal<Signal<string> | null>(null);
  private readonly hints = signal<readonly string[]>([]);
  private readonly errors = signal<readonly string[]>([]);

  /** The control's id, which the label's `for` names. */
  protected readonly controlId = computed(() => this.control()?.id ?? this.defaultId);

  /** The control's value as it writes it, at the end of the label's row, or nothing. */
  protected readonly value = computed(() => this.shown()?.() ?? '');

  /** Whether the control needs a value: the asterisk. */
  protected readonly required = computed(() => this.control()?.state.required() ?? false);

  /** Whether the control is disabled: the label dims with it. */
  protected readonly disabled = computed(() => this.control()?.state.disabled() ?? false);

  /** Whether the error shows: with a form binding once invalid and touched; without one, whenever there is one. */
  protected readonly errorShown = computed(() => {
    if (this.errors().length === 0) return false;
    const state = this.control()?.state;
    return state?.bound === true ? state.showError() : true;
  });

  /** The ids of the hint and, while it shows, the error. */
  readonly describedBy = computed<readonly string[]>(() => [
    ...this.hints(),
    ...(this.errorShown() ? this.errors() : []),
  ]);

  /** Called by the control inside the field, with its element and state. */
  register(control: HTMLElement, state: AveControlState): void {
    this.control.set({ id: control.id, state });
  }

  /** Called by a control that shows its value in the label's row, such as a slider. */
  showValue(text: Signal<string>): () => void {
    this.shown.set(text);
    return () => {
      if (this.shown() === text) this.shown.set(null);
    };
  }

  /**
   * Called by a hint or an error inside the field, with its id; returns the function that removes it.
   *
   * @internal
   */
  add(kind: 'hint' | 'error', id: string): () => void {
    const parts = kind === 'hint' ? this.hints : this.errors;
    parts.update((ids) => [...ids, id]);
    return () => {
      parts.update((ids) => ids.filter((other) => other !== id));
    };
  }
}
