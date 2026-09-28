import {
  Component,
  ElementRef,
  afterRenderEffect,
  booleanAttribute,
  computed,
  contentChild,
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
import { lucideCheck, lucideChevronDown, lucideX } from '@avelune/icons/lucide';
import { AVE_CONTROL_OWNER, AveClearButton, AveControlTarget, injectControlState } from '@avelune/ui/forms';
import { AveIcon, provideAveIcons } from '@avelune/ui/icon';
import { aveConnectedOverlay, aveOverlayPresence } from '@avelune/ui/overlay';
import { pruned } from './choice';
import { AveOptionContent, describedBy, optionIds } from './option-content';
import { AveOptionTemplate } from './templates';
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
  imports: [
    AveClearButton,
    AveControlTarget,
    AveIcon,
    AveOptionContent,
    Combobox,
    ComboboxPopup,
    ComboboxWidget,
    Listbox,
    Option,
    OverlayModule,
  ],
  providers: [
    provideAveIcons([lucideCheck, lucideChevronDown, lucideX]),
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
      [attr.data-clear]="clearable() ? '' : null"
      [(expanded)]="expanded"
      (focusout)="left($event)"
      (keydown.delete)="clearByKey($event)"
      (keydown.backspace)="clearByKey($event)"
    >
      <span class="value">{{ text() }}</span>
      <ave-icon class="chevron" name="chevron-down" decorative />
    </button>
    @if (clearable()) {
      <button aveClearButton type="button" class="clear" [label]="label()" (click)="clear()">
        <ave-icon name="x" decorative />
      </button>
    }
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
                [attr.aria-label]="option.label"
                [attr.aria-describedby]="optionDescription(option, $index)"
              >
                <ave-option-content
                  [option]="option"
                  [template]="optionTemplate()?.template"
                  [idPrefix]="optionIds + '-' + $index"
                />
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

  /**
   * The options of a value set from outside (a saved form) that the options may not hold, so the trigger can name
   * them; the options people choose are remembered (ADR 0056).
   */
  readonly chosenOptions = input<readonly AveOption<V>[]>([]);

  /** Emits when the person leaves the multiselect, which marks a Signal Forms field touched. */
  readonly touch = output();

  /** The form state, read on the host, where the form binding is. */
  readonly state = injectControlState();

  /** The application's template for the inside of every option, if it gives one (ADR 0055). */
  protected readonly optionTemplate = contentChild<AveOptionTemplate<V>>(AveOptionTemplate);

  /** The ids of the options' descriptions and meta. */
  protected readonly optionIds = optionIds();

  /** Whether the list is open. */
  protected readonly expanded = signal(false);

  /** The chosen options, in the order of the list. */
  protected readonly chosen = computed(() => {
    const value = this.value();
    const options = this.options();
    const listed = options.filter((option) => value.some((chosen) => Object.is(chosen, option.value)));
    // Chosen values the options do not hold, named from `chosenOptions` or the person's choice, after the listed.
    const known = [...this.chosenOptions(), ...this.remembered()];
    const hidden = value
      .filter((chosen) => !options.some((option) => Object.is(option.value, chosen)))
      .map((chosen) => known.find((option) => Object.is(option.value, chosen)))
      .filter((option) => option !== undefined);
    return [...listed, ...hidden];
  });

  /** The options people chose, which the options may no longer hold. */
  private readonly remembered = signal<readonly AveOption<V>[]>([]);

  /** What the trigger says: the chosen labels, comma-separated, or the placeholder. */
  protected readonly text = computed(() => {
    const chosen = this.chosen();
    return chosen.length === 0 ? this.placeholder() : chosen.map((option) => option.label).join(', ');
  });

  protected readonly isDisabled = computed(() => this.disabled() || this.state.disabled() || this.disabledByForm());

  /** Whether the clear button shows: chosen options that can be changed and may be taken away (ADR 0052). */
  protected readonly clearable = computed(
    () => this.value().length > 0 && !this.isDisabled() && !this.readonly() && !this.state.required(),
  );

  /** @internal The field around the control dims its label while the control is disabled, by input or by form. */
  readonly controlDisabled = this.isDisabled;

  private readonly trigger = viewChild.required<Combobox>('combobox');
  private readonly list = viewChild<Listbox<V>>('listbox');
  private readonly popup = viewChild<ElementRef<HTMLElement>>('popup');

  /** The overlay stays open while the list plays its exit (ADR 0046). */
  protected readonly presence = aveOverlayPresence(
    this.expanded,
    computed(() => this.popup()?.nativeElement),
  );

  protected readonly overlay = computed(() => aveConnectedOverlay(this.trigger().element));

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

  /**
   * The person checked or unchecked an option: the values change in the order of the list, and those it does not show
   * stay after them; the list stays open.
   */
  protected choose(values: V[]): void {
    // Chosen values no option holds, which Aria's listbox dropped, stay chosen, after those the list shows.
    if (pruned(this.value(), values, this.options())) return;
    const options = this.options();
    const listed = options
      .map((option) => option.value)
      .filter((value) => values.some((chosen) => Object.is(chosen, value)));
    const hidden = this.value().filter((value) => !options.some((option) => Object.is(option.value, value)));
    const next = [...listed, ...hidden];
    this.remembered.update((remembered) => [
      ...remembered.filter((option) => !listed.some((value) => Object.is(value, option.value))),
      ...options.filter((option) => listed.some((value) => Object.is(value, option.value))),
    ]);
    this.value.set(next);
    this.changed(next);
  }

  /** The clear button, or Delete: every option is unchecked, the list closes, focus stays on the trigger (ADR 0052). */
  protected clear(): void {
    this.value.set([]);
    this.changed([]);
    this.expanded.set(false);
    this.trigger().element.focus();
  }

  /** Delete or Backspace on the trigger clear a multiselect that may be empty; Aria's combobox has no key for it. */
  protected clearByKey(event: Event): void {
    if (!this.clearable()) return;
    event.preventDefault();
    this.clear();
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

  /** The ids that describe an option: its description and meta, unless a template draws it (ADR 0055). */
  protected optionDescription(option: AveOption<V>, index: number): string | null {
    return describedBy(option, `${this.optionIds}-${String(index)}`, this.optionTemplate() !== undefined);
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
