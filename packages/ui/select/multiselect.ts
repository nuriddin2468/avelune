import {
  Component,
  ElementRef,
  afterRenderEffect,
  booleanAttribute,
  computed,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { Combobox, ComboboxPopup, ComboboxWidget } from '@angular/aria/combobox';
import { Listbox, Option } from '@angular/aria/listbox';
import { OverlayModule } from '@angular/cdk/overlay';
import { NgControl, type ControlValueAccessor } from '@angular/forms';
import { FORM_FIELD } from '@angular/forms/signals';
import { lucideCheck, lucideChevronDown } from '@avelune/icons/lucide';
import { injectControlState } from '@avelune/ui/forms';
import { AveIcon, provideAveIcons } from '@avelune/ui/icon';
import { AVE_CONTROL_OWNER, AveControlTarget } from './control';
import { listOverlay } from './overlay';
import { listPresence } from './presence';
import type { AveOption, AveSelectSize } from './types';

/**
 * The kit's multiselect (brief §9.1, ADR 0046): several choices from a list, under a trigger with the box of an
 * Input that names what is chosen. The list stays open while people check and uncheck options, and closes on Escape,
 * Tab or a click outside. Built on Angular Aria's combobox and a multi-select listbox, in CDK's overlay. Signal Forms
 * bind its `value` model (`[formField]` on an array), Reactive Forms its value accessor. Put it in an
 * `<ave-form-field>` for its label, hint and error.
 *
 * ```html
 * <ave-multiselect [options]="approvers" placeholder="Choose approvers" [formField]="contract.approvers" />
 * ```
 *
 * @alpha
 */
@Component({
  selector: 'ave-multiselect',
  imports: [AveControlTarget, AveIcon, Combobox, ComboboxPopup, ComboboxWidget, Listbox, Option, OverlayModule],
  providers: [
    provideAveIcons([lucideCheck, lucideChevronDown]),
    { provide: AVE_CONTROL_OWNER, useExisting: AveMultiselect },
  ],
  host: {
    '[attr.data-size]': 'size()',
  },
  template: `
    <button
      #combobox="ngCombobox"
      class="trigger"
      type="button"
      aveControlTarget
      ngCombobox
      [disabled]="isDisabled()"
      [softDisabled]="false"
      [preserveContent]="true"
      [readonly]="readonly()"
      [attr.aria-label]="label() || null"
      [attr.data-empty]="chosen().length === 0 ? '' : null"
      [(expanded)]="expanded"
      (focusout)="left($event)"
    >
      <span class="value">{{ text() }}</span>
      <ave-icon class="chevron" name="chevron-down" decorative />
    </button>
    <!-- The popup outside the overlay, so the combobox knows its popup (aria-haspopup, aria-autocomplete) before it
         first opens; the overlay renders once the list is first shown and stays, closed, after (preserveContent). -->
    <ng-template ngComboboxPopup [combobox]="combobox">
      <ng-template [cdkConnectedOverlay]="overlay()" [cdkConnectedOverlayOpen]="presence.open()">
        <div
          #popup
          class="popup ave-motion-popover-enter"
          [class.ave-motion-popover-exit]="presence.closing()"
          (mousedown)="keepFocus($event)"
        >
          <div
            #listbox="ngListbox"
            class="listbox"
            ngListbox
            ngComboboxWidget
            multi
            focusMode="activedescendant"
            selectionMode="explicit"
            [tabindex]="-1"
            [value]="value()"
            [activeDescendant]="listbox.activeDescendant()"
            (valueChange)="choose($event)"
          >
            @for (option of options(); track $index) {
              <div
                class="option"
                ngOption
                [value]="option.value"
                [label]="option.label"
                [disabled]="option.disabled ?? false"
              >
                <span class="label">{{ option.label }}</span>
                <ave-icon class="check" name="check" decorative />
              </div>
            }
          </div>
        </div>
      </ng-template>
    </ng-template>
  `,
  styleUrls: ['./select.css', './list.css'],
})
export class AveMultiselect<V> implements ControlValueAccessor {
  /** The options, in the order they are shown. */
  readonly options = input.required<readonly AveOption<V>[]>();

  /** The chosen values, in the order of the options; empty while nothing is chosen. */
  readonly value = model<V[]>([]);

  /** What the trigger says while nothing is chosen ("Choose approvers"). It never replaces a label. */
  readonly placeholder = input('');

  /** The size: the box of an Input of that size. */
  readonly size = input<AveSelectSize>('md');

  /** Whether the multiselect is disabled. A form binding sets it too. */
  readonly disabled = input(false, { transform: booleanAttribute });

  /** Whether the values can be read but not changed. A form binding sets it too. */
  readonly readonly = input(false, { transform: booleanAttribute });

  /** The accessible name when the multiselect has no visible label; an `<ave-form-field>` gives it one instead. */
  readonly label = input('');

  /** Emits when the person leaves the multiselect, which marks a Signal Forms field touched. */
  readonly touch = output();

  /** The form state, read on the host, where the form binding is. */
  readonly state = injectControlState();

  /** Whether the list is open. */
  protected readonly expanded = signal(false);

  /** The chosen options, in the order of the list. */
  protected readonly chosen = computed(() => {
    const value = this.value();
    return this.options().filter((option) => value.some((chosen) => Object.is(chosen, option.value)));
  });

  /** What the trigger says: the chosen labels, comma-separated, or the placeholder. */
  protected readonly text = computed(() => {
    const chosen = this.chosen();
    return chosen.length === 0 ? this.placeholder() : chosen.map((option) => option.label).join(', ');
  });

  protected readonly isDisabled = computed(() => this.disabled() || this.state.disabled() || this.disabledByForm());

  private readonly trigger = viewChild.required<Combobox>('combobox');
  private readonly list = viewChild<Listbox<V>>('listbox');
  private readonly popup = viewChild<ElementRef<HTMLElement>>('popup');

  /** The overlay stays open while the list plays its exit (ADR 0046). */
  protected readonly presence = listPresence(
    this.expanded,
    computed(() => this.popup()?.nativeElement),
  );

  protected readonly overlay = computed(() => listOverlay(this.trigger().element));

  private readonly disabledByForm = signal(false);
  private changed: (value: V[]) => void = () => undefined;
  private touched: () => void = () => undefined;

  constructor() {
    // Reactive Forms reach the multiselect through its value accessor; Signal Forms through its value model.
    const ngControl =
      inject(FORM_FIELD, { self: true, optional: true }) === null
        ? inject(NgControl, { self: true, optional: true })
        : null;
    if (ngControl !== null) ngControl.valueAccessor = this;
    afterRenderEffect(() => {
      this.list()?.scrollActiveItemIntoView({ block: 'nearest' });
    });
  }

  /** The person checked or unchecked an option: the values change in the order of the list; the list stays open. */
  protected choose(values: V[]): void {
    const ordered = this.options()
      .map((option) => option.value)
      .filter((value) => values.some((chosen) => Object.is(chosen, value)));
    this.value.set(ordered);
    this.changed(ordered);
  }

  /** Focus left the multiselect, not into its own list. */
  protected left(event: FocusEvent): void {
    const next = event.relatedTarget;
    if (next instanceof Node && this.trigger().element.parentElement?.contains(next) === true) return;
    this.touch.emit();
    this.touched();
  }

  /**
   * A press in the list keeps focus on the trigger: the list is the trigger's `aria-activedescendant`, so its options
   * never take focus, and focus is where the person left it when the list closes.
   */
  protected keepFocus(event: MouseEvent): void {
    event.preventDefault();
  }

  /** @internal */
  writeValue(value: unknown): void {
    this.value.set(Array.isArray(value) ? (value as V[]) : []);
  }

  /** @internal */
  registerOnChange(callback: (value: V[]) => void): void {
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
