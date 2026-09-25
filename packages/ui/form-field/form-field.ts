import { Component, computed, input, signal } from '@angular/core';
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
 *   @if (form.number().errors().length > 0) {
 *     <p aveError>Enter the contract number, for example ДК-2026/114.</p>
 *   }
 * </ave-form-field>
 * ```
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
  // last word when a long label wraps. It is always in the page and hidden while the control is optional.
  template: `
    <label class="label" [attr.for]="controlId()"
      >{{ label() }}<span class="required" aria-hidden="true" [hidden]="!required()">&nbsp;*</span></label
    >
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

  private readonly control = signal<{ readonly id: string; readonly state: AveControlState } | null>(null);
  private readonly hints = signal<readonly string[]>([]);
  private readonly errors = signal<readonly string[]>([]);

  /** The control's id, which the label's `for` names. */
  protected readonly controlId = computed(() => this.control()?.id ?? this.defaultId);

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

  /** Called by the control inside the field, with its id and state. */
  register(id: string, state: AveControlState): void {
    this.control.set({ id, state });
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
