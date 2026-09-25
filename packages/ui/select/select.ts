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
 * The kit's select (brief §9.1, ADR 0046): one choice from a list of 6 to 15 options that opens under a trigger with
 * the box of an Input. Built on Angular Aria's combobox and listbox (the WAI-ARIA select-only combobox), in CDK's
 * overlay. Signal Forms bind it through its `value` model (`[formField]`), Reactive Forms through its value accessor
 * (`formControl`, `formControlName`). Put it in an `<ave-form-field>` for its label, hint and error.
 *
 * ```html
 * <ave-select [options]="kinds" placeholder="Choose a kind" [formField]="contract.kind" />
 * ```
 *
 * @alpha
 */
@Component({
  selector: 'ave-select',
  imports: [AveControlTarget, AveIcon, Combobox, ComboboxPopup, ComboboxWidget, Listbox, Option, OverlayModule],
  providers: [
    provideAveIcons([lucideCheck, lucideChevronDown]),
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
      [attr.data-empty]="selected() === undefined ? '' : null"
      [(expanded)]="expanded"
      (focusout)="left($event)"
    >
      <span class="value">{{ selected()?.label ?? placeholder() }}</span>
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

  /** The accessible name when the select has no visible label; an `<ave-form-field>` gives it one instead. */
  readonly label = input('');

  /** Emits when the person leaves the select, which marks a Signal Forms field touched. */
  readonly touch = output();

  /** The form state, read on the host, where the form binding is. */
  readonly state = injectControlState();

  /** Whether the list is open. */
  protected readonly expanded = signal(false);

  protected readonly selected = computed(() => this.options().find((option) => Object.is(option.value, this.value())));
  protected readonly selectedValues = computed<V[]>(() => {
    const value = this.value();
    return value === null ? [] : [value];
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

  /** The person chose an option: the value changes and the list closes. */
  protected choose(values: V[]): void {
    const value = values[0] ?? null;
    this.value.set(value);
    this.changed(value);
    this.expanded.set(false);
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
