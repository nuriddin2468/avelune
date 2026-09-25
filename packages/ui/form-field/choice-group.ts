import { Component, ElementRef, computed, inject, input, signal } from '@angular/core';
import { lucideCircleAlert } from '@avelune/icons/lucide';
import { AVE_FIELD, type AveControlState, type AveFieldContext } from '@avelune/ui/forms';
import { AveIcon, provideAveIcons } from '@avelune/ui/icon';
import { AVE_FIELD_PARTS } from './parts';

/** Unique ids for the legends of groups. */
let nextGroup = 0;

/** No ids: the controls of a group are described by the group, not one by one. */
const noIds = signal<readonly string[]>([]).asReadonly();

/** A control of the group, as it registered. */
interface GroupControl {
  readonly radio: boolean;
  readonly state: AveControlState;
}

/**
 * A group of choices (brief §9.1, ADR 0044) on a native `<fieldset>`: its legend asks the question, with an asterisk
 * when every choice is required, then the radios or checkboxes in their `label[aveChoice]`, one under the other, then a
 * hint (`[aveHint]`) and an error (`[aveError]`). The group is described by the hint and, while it shows, the error.
 * With a form binding the error shows once a control of the group is touched; without one, whenever it is in the
 * template. A group of radios is a `radiogroup`, which says required and invalid for all of them.
 *
 * ```html
 * <fieldset aveChoiceGroup legend="Delivery">
 *   <label aveChoice><input type="radio" aveRadio value="courier" [formField]="order.delivery" /> Courier</label>
 *   <label aveChoice><input type="radio" aveRadio value="pickup" [formField]="order.delivery" /> Pickup</label>
 *   @if (order.delivery().errors().length > 0) {
 *     <p aveError>Choose how to deliver the order.</p>
 *   }
 * </fieldset>
 * ```
 *
 * @alpha
 */
@Component({
  selector: 'fieldset[aveChoiceGroup]',
  imports: [AveIcon],
  providers: [
    provideAveIcons([lucideCircleAlert]),
    { provide: AVE_FIELD, useExisting: AveChoiceGroup },
    { provide: AVE_FIELD_PARTS, useExisting: AveChoiceGroup },
  ],
  host: {
    '[attr.role]': 'radios() ? "radiogroup" : null',
    '[attr.aria-labelledby]': 'radios() ? legendId : null',
    '[attr.aria-describedby]': 'groupDescribedBy()',
    '[attr.aria-required]': 'radios() && required() ? "true" : null',
    '[attr.aria-invalid]': 'radios() && errorShown() ? "true" : null',
    '[attr.data-disabled]': 'disabled() ? "" : null',
    '[attr.data-invalid]': 'errorShown() ? "" : null',
  },
  // The required marker follows the legend with no whitespace, behind a no-break space, as in a form field.
  template: `
    <legend class="legend" [id]="legendId">
      {{ legend() }}<span class="required" aria-hidden="true" [hidden]="!required()">&nbsp;*</span>
    </legend>
    <div class="choices"><ng-content /></div>
    <ng-content select="[aveHint]" />
    @if (errorShown()) {
      <div class="error">
        <ave-icon name="circle-alert" decorative />
        <ng-content select="[aveError]" />
      </div>
    }
  `,
  styleUrl: './choice-group.css',
})
export class AveChoiceGroup implements AveFieldContext {
  /** The legend: the question the choices answer, in a few words ("Delivery"). It names the group. */
  readonly legend = input.required<string>();

  /** The id of the legend, which names a group of radios. */
  protected readonly legendId = `ave-group-${String(nextGroup++)}`;

  /** The id of the legend, for a control that names its parts with it. */
  readonly labelId = this.legendId;

  /** The controls of a group keep their own ids; the legend names the group. */
  readonly defaultId = null;

  /** The controls of a group are not described one by one: the group is. */
  readonly describedBy = noIds;

  /** The ids the application wrote in the template, kept before the hint and the error. */
  private readonly ownDescribedBy = (
    inject<ElementRef<HTMLFieldSetElement>>(ElementRef).nativeElement.getAttribute('aria-describedby') ?? ''
  )
    .split(/\s+/)
    .filter((id) => id !== '');

  private readonly controls = signal<readonly GroupControl[]>([]);
  private readonly hints = signal<readonly string[]>([]);
  private readonly errors = signal<readonly string[]>([]);

  /** Whether the group holds radios: then it is a `radiogroup`. */
  protected readonly radios = computed(() => this.controls().some((control) => control.radio));

  /**
   * Whether the group's answer is required: every control is (a group of radios, or of one required checkbox). A group
   * that mixes optional and required checkboxes shows no asterisk; the required one says so in its label.
   */
  protected readonly required = computed(() => {
    const controls = this.controls();
    return controls.length > 0 && controls.every((control) => control.state.required());
  });

  /** Whether every control is disabled: the legend dims with them. */
  protected readonly disabled = computed(() => {
    const controls = this.controls();
    return controls.length > 0 && controls.every((control) => control.state.disabled());
  });

  /** Whether the error shows: with a form binding once a control is touched; without one, whenever there is one. */
  protected readonly errorShown = computed(() => {
    if (this.errors().length === 0) return false;
    const bound = this.controls().filter((control) => control.state.bound);
    return bound.length === 0 || bound.some((control) => control.state.touched());
  });

  /** The group's description: the application's own ids, the hint and, while it shows, the error. */
  protected readonly groupDescribedBy = computed(() => {
    const ids = [...this.ownDescribedBy, ...this.hints(), ...(this.errorShown() ? this.errors() : [])];
    return ids.length === 0 ? null : ids.join(' ');
  });

  /** Called by each control inside the group, with its element and state. */
  register(control: HTMLElement, state: AveControlState): void {
    const radio = control instanceof HTMLInputElement && control.type === 'radio';
    this.controls.update((controls) => [...controls, { radio, state }]);
  }

  /**
   * Called by a hint or an error inside the group, with its id; returns the function that removes it.
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
