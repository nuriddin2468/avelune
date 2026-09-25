import {
  Component,
  ElementRef,
  afterRenderEffect,
  booleanAttribute,
  computed,
  inject,
  input,
  linkedSignal,
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
import { lucideCheck } from '@avelune/icons/lucide';
import { injectControlState } from '@avelune/ui/forms';
import { injectAveMessages } from '@avelune/ui/i18n';
import { AveIcon, provideAveIcons } from '@avelune/ui/icon';
import { AVE_CONTROL_OWNER, AveControlTarget } from './control';
import { matches } from './match';
import { listOverlay } from './overlay';
import { listPresence } from './presence';
import type { AveOption, AveSelectSize } from './types';

/**
 * The kit's combobox (brief §9.1, ADR 0046): one choice from a long list, found by typing. An input with the box of
 * an Input filters the options by their labels as people type; the list opens under it. Built on Angular Aria's
 * combobox and listbox (the WAI-ARIA combobox with list autocomplete), in CDK's overlay. The value is always one of
 * the options: text that matches none is put back when the person leaves. Signal Forms bind its `value` model
 * (`[formField]`), Reactive Forms its value accessor. Put it in an `<ave-form-field>` for its label, hint and error.
 *
 * ```html
 * <ave-combobox [options]="counterparties" [formField]="contract.counterparty" />
 * ```
 *
 * @alpha
 */
@Component({
  selector: 'ave-combobox',
  imports: [AveControlTarget, AveIcon, Combobox, ComboboxPopup, ComboboxWidget, Listbox, Option, OverlayModule],
  providers: [provideAveIcons([lucideCheck]), { provide: AVE_CONTROL_OWNER, useExisting: AveCombobox }],
  host: {
    '[attr.data-size]': 'size()',
  },
  template: `
    <input
      #combobox="ngCombobox"
      class="trigger"
      type="text"
      autocomplete="off"
      aveControlTarget
      ngCombobox
      [disabled]="isDisabled()"
      [softDisabled]="false"
      [preserveContent]="true"
      [readonly]="readonly()"
      [attr.aria-label]="label() || null"
      [attr.placeholder]="placeholder() || null"
      [(value)]="query"
      [(expanded)]="expanded"
      (focusout)="left($event)"
    />
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
            @for (option of shown(); track $index) {
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
          @if (shown().length === 0) {
            <p class="empty" role="status">{{ messages.noResults }}</p>
          }
        </div>
      </ng-template>
    </ng-template>
  `,
  styleUrls: ['./select.css', './list.css'],
})
export class AveCombobox<V> implements ControlValueAccessor {
  /** Every option; typing shows those whose label contains the text. For more than 15, or an unknown number. */
  readonly options = input.required<readonly AveOption<V>[]>();

  /** The chosen value, or `null` while nothing is chosen. Signal Forms bind it with `[formField]`. */
  readonly value = model<V | null>(null);

  /** A hint inside the empty input ("Start typing a name"). It never replaces a label. */
  readonly placeholder = input('');

  /** The size: the box of an Input of that size. */
  readonly size = input<AveSelectSize>('md');

  /** Whether the combobox is disabled. A form binding sets it too. */
  readonly disabled = input(false, { transform: booleanAttribute });

  /** Whether the value can be read but not changed. A form binding sets it too. */
  readonly readonly = input(false, { transform: booleanAttribute });

  /** The accessible name when the combobox has no visible label; an `<ave-form-field>` gives it one instead. */
  readonly label = input('');

  /** Emits when the person leaves the combobox, which marks a Signal Forms field touched. */
  readonly touch = output();

  /** The form state, read on the host, where the form binding is. */
  readonly state = injectControlState();

  protected readonly messages = injectAveMessages();

  private readonly selected = computed(() => this.options().find((option) => Object.is(option.value, this.value())));

  /** What the input says: the chosen option's label, reset whenever the value changes, or what the person types. */
  protected readonly query = linkedSignal(() => this.selected()?.label ?? '');

  /** Whether the list is open. */
  protected readonly expanded = signal(false);

  /** The options the list shows: every one while the input shows the chosen label, the matches while typing. */
  protected readonly shown = computed(() => {
    const query = this.query();
    const options = this.options();
    return query === (this.selected()?.label ?? '')
      ? options
      : options.filter((option) => matches(option.label, query));
  });

  protected readonly selectedValues = computed<V[]>(() => {
    const value = this.value();
    return value === null ? [] : [value];
  });

  protected readonly isDisabled = computed(() => this.disabled() || this.state.disabled() || this.disabledByForm());

  private readonly input = viewChild.required<Combobox>('combobox');
  private readonly list = viewChild<Listbox<V>>('listbox');
  private readonly popup = viewChild<ElementRef<HTMLElement>>('popup');

  /** The overlay stays open while the list plays its exit (ADR 0046). */
  protected readonly presence = listPresence(
    this.expanded,
    computed(() => this.popup()?.nativeElement),
  );

  protected readonly overlay = computed(() => listOverlay(this.input().element));

  private readonly disabledByForm = signal(false);
  private changed: (value: V | null) => void = () => undefined;
  private touched: () => void = () => undefined;

  constructor() {
    // Reactive Forms reach the combobox through its value accessor; Signal Forms through its value model.
    const ngControl =
      inject(FORM_FIELD, { self: true, optional: true }) === null
        ? inject(NgControl, { self: true, optional: true })
        : null;
    if (ngControl !== null) ngControl.valueAccessor = this;
    afterRenderEffect(() => {
      this.list()?.scrollActiveItemIntoView({ block: 'nearest' });
    });
  }

  /** The person chose an option: the value changes, the input shows its label, and the list closes. */
  protected choose(values: V[]): void {
    const value = values[0] ?? null;
    this.value.set(value);
    this.query.set(this.selected()?.label ?? '');
    this.changed(value);
    this.expanded.set(false);
  }

  /**
   * Focus left the combobox: an emptied input clears the value; any other text that is not the chosen label is put
   * back.
   */
  protected left(event: FocusEvent): void {
    const next = event.relatedTarget;
    if (next instanceof Node && this.input().element.parentElement?.contains(next) === true) return;
    if (this.query().trim() === '' && this.value() !== null) {
      this.value.set(null);
      this.changed(null);
    }
    this.query.set(this.selected()?.label ?? '');
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
