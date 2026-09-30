import {
  Component,
  ElementRef,
  afterRenderEffect,
  booleanAttribute,
  computed,
  contentChild,
  inject,
  input,
  linkedSignal,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Combobox, ComboboxPopup, ComboboxWidget } from '@angular/aria/combobox';
import { Listbox, Option } from '@angular/aria/listbox';
import { OverlayModule } from '@angular/cdk/overlay';
import { NgControl, type ControlValueAccessor } from '@angular/forms';
import { FORM_FIELD } from '@angular/forms/signals';
import { lucideCheck, lucideChevronDown, lucideX } from '@avelune/icons/lucide';
import {
  AVE_CONTROL_OWNER,
  AveClearButton,
  AveControlTarget,
  injectControlState,
  type AveControlState,
} from '@avelune/ui/forms';
import { AveIcon, provideAveIcons } from '@avelune/ui/icon';
import { aveConnectedOverlay, aveOverlayPresence } from '@avelune/ui/overlay';
import { pruned } from './choice';
import { AveOptionContent, describedBy, optionIds } from './option-content';
import { AveOptionTemplate, AveSelectValueTemplate } from './templates';
import type { AveOption, AveSelectSize } from './types';

/**
 * The kit's select (brief §9.1, ADR 0046): one choice from a list of 6 to 15 options that opens under a trigger with
 * the box of an Input. Built on Angular Aria's combobox and listbox (the WAI-ARIA select-only combobox), in CDK's
 * overlay. Signal Forms bind it through its `value` model (`[formField]`), Reactive Forms through its value accessor
 * (`formControl`, `formControlName`). Put it in an `<ave-form-field>` for its label, hint and error.
 *
 * ```html
 * <ave-select [options]="kinds" placeholder="Choose a kind" [formField]="contract.kind" />
 * ```
 *
 * @beta
 */
@Component({
  selector: 'ave-select',
  imports: [
    AveClearButton,
    AveControlTarget,
    AveIcon,
    AveOptionContent,
    Combobox,
    NgTemplateOutlet,
    ComboboxPopup,
    ComboboxWidget,
    Listbox,
    Option,
    OverlayModule,
  ],
  providers: [
    provideAveIcons([lucideCheck, lucideChevronDown, lucideX]),
    { provide: AVE_CONTROL_OWNER, useExisting: AveSelect },
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
      [attr.aria-required]="required() && !state.bound ? 'true' : null"
      [attr.data-empty]="selected() === undefined ? '' : null"
      [attr.data-clear]="clearable() ? '' : null"
      [(expanded)]="expanded"
      (focusout)="left($event)"
      (keydown.delete)="clearByKey($event)"
      (keydown.backspace)="clearByKey($event)"
    >
      <span class="value">
        @if (selected(); as option) {
          @if (valueTemplate(); as custom) {
            <ng-container [ngTemplateOutlet]="custom.template" [ngTemplateOutletContext]="{ $implicit: option }" />
          } @else {
            <ave-option-content [option]="option" lines="one" />
          }
        } @else {
          {{ placeholder() }}
        }
      </span>
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
            focusMode="activedescendant"
            selectionMode="explicit"
            [tabindex]="-1"
            [value]="selectedValues()"
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
export class AveSelect<V> implements ControlValueAccessor {
  /** The options, in the order they are shown: 6 to 15 of them (GUIDELINES.md, "Radio, select or combobox"). */
  readonly options = input.required<readonly AveOption<V>[]>();

  /** The chosen value, or `null` while nothing is chosen. Signal Forms bind it with `[formField]`. */
  readonly value = model<V | null>(null);

  /** What the trigger says while nothing is chosen ("Choose a kind"). It never replaces a label. */
  readonly placeholder = input('');

  /** The size: the box of an Input of that size. */
  readonly size = input<AveSelectSize>('md');

  /** Whether the select is disabled. A form binding sets it too. */
  readonly disabled = input(false, { transform: booleanAttribute });

  /** Whether the value can be read but not changed. A form binding sets it too. */
  readonly readonly = input(false, { transform: booleanAttribute });

  /**
   * Whether the select must hold a value, so it has no clear button: a page size outside a form (ADR 0087). A form's
   * required validator says it too.
   */
  readonly required = input(false, { transform: booleanAttribute });

  /** The accessible name when the select has no visible label; an `<ave-form-field>` gives it one instead. */
  readonly label = input('');

  /**
   * The options of a value set from outside (a saved form) that the options may not hold, so the trigger can name
   * it; the options people choose are remembered (ADR 0056).
   */
  readonly chosenOptions = input<readonly AveOption<V>[]>([]);

  /** Emits when the person leaves the select, which marks a Signal Forms field touched. */
  readonly touch = output();

  private readonly formState = injectControlState();

  /** The form state, read on the host, where the form binding is; required by the form or by `required`. */
  readonly state: AveControlState = {
    ...this.formState,
    required: computed(() => this.required() || this.formState.required()),
  };

  /** The application's template for the inside of every option, if it gives one (ADR 0055). */
  protected readonly optionTemplate = contentChild<AveOptionTemplate<V>>(AveOptionTemplate);

  /** The application's template for the chosen value in the trigger, if it gives one (ADR 0055). */
  protected readonly valueTemplate = contentChild<AveSelectValueTemplate<V>>(AveSelectValueTemplate);

  /** The ids of the options' descriptions and meta. */
  protected readonly optionIds = optionIds();

  /** Whether the list is open. */
  protected readonly expanded = signal(false);

  /** The option people chose last, which the options may no longer hold. */
  private readonly remembered = signal<AveOption<V> | undefined>(undefined);

  /** The chosen option: among the options, among `chosenOptions`, or remembered from the person's choice. */
  protected readonly selected = computed(() => {
    const value = this.value();
    if (value === null) return undefined;
    const remembered = this.remembered();
    return [...this.options(), ...this.chosenOptions(), ...(remembered === undefined ? [] : [remembered])].find(
      (option) => Object.is(option.value, value),
    );
  });
  /**
   * The list's selection: the value. Aria's single selection toggles, so choosing the chosen option again takes it
   * away in the list; the list is then given the value back (see `choose`).
   */
  protected readonly selectedValues = linkedSignal<V[]>(() => {
    const value = this.value();
    return value === null ? [] : [value];
  });
  protected readonly isDisabled = computed(() => this.disabled() || this.state.disabled() || this.disabledByForm());

  /** Whether the clear button shows: a value that can be changed and may be taken away (ADR 0052). */
  protected readonly clearable = computed(
    () => this.value() !== null && !this.isDisabled() && !this.readonly() && !this.state.required(),
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
  private changed: (value: V | null) => void = () => undefined;
  private touched: () => void = () => undefined;

  constructor() {
    // Reactive Forms reach the select through its value accessor; Signal Forms through its value model.
    const ngControl =
      inject(FORM_FIELD, { self: true, optional: true }) === null
        ? inject(NgControl, { self: true, optional: true })
        : null;
    if (ngControl !== null) ngControl.valueAccessor = this;
    afterRenderEffect(() => {
      this.list()?.scrollActiveItemIntoView({ block: 'nearest' });
    });
  }

  /** The person chose an option: the value changes and the list closes. The chosen option chosen again keeps it. */
  protected choose(values: V[]): void {
    // Options that no longer hold the value make Aria's listbox drop it: the value stays.
    if (pruned(this.selectedValues(), values, this.options())) return;
    const value = values[0] ?? this.value();
    this.selectedValues.set(value === null ? [] : [value]);
    const option = this.options().find((listed) => Object.is(listed.value, value));
    if (option !== undefined) this.remembered.set(option);
    this.value.set(value);
    this.changed(value);
    this.expanded.set(false);
  }

  /** The clear button, or Delete: the value goes, the list closes, and focus stays on the trigger (ADR 0052). */
  protected clear(): void {
    this.value.set(null);
    this.changed(null);
    this.expanded.set(false);
    this.trigger().element.focus();
  }

  /** Delete or Backspace on the trigger clear a select that may be empty; Aria's combobox has no key for it. */
  protected clearByKey(event: Event): void {
    if (!this.clearable()) return;
    event.preventDefault();
    this.clear();
  }

  /** Focus left the select, not into its own list. */
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
    this.value.set((value ?? null) as V | null);
  }

  /** @internal */
  registerOnChange(callback: (value: V | null) => void): void {
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
