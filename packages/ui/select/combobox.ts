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
import { Combobox, ComboboxPopup, ComboboxWidget } from '@angular/aria/combobox';
import { Listbox, Option } from '@angular/aria/listbox';
import { OverlayModule } from '@angular/cdk/overlay';
import { NgControl, type ControlValueAccessor } from '@angular/forms';
import { FORM_FIELD } from '@angular/forms/signals';
import { lucideCheck, lucideCircleAlert, lucideLoaderCircle, lucideX } from '@avelune/icons/lucide';
import { AveButton } from '@avelune/ui/button';
import { AVE_CONTROL_OWNER, AveClearButton, AveControlTarget, injectControlState } from '@avelune/ui/forms';
import { injectAveMessages } from '@avelune/ui/i18n';
import { AveIcon, provideAveIcons } from '@avelune/ui/icon';
import { pruned } from './choice';
import { matches } from './match';
import { remoteList, type AveSearchMode } from './remote';
import { aveConnectedOverlay, aveOverlayPresence } from '@avelune/ui/overlay';
import { AveOptionContent, describedBy, optionIds } from './option-content';
import { AveOptionTemplate } from './templates';
import type { AveOption, AveSelectSize } from './types';

/**
 * The kit's combobox (brief §9.1, ADR 0046): one choice from a long list, found by typing. An input with the box of
 * an Input filters the options by their labels as people type; the list opens under it. Built on Angular Aria's
 * combobox and listbox (the WAI-ARIA combobox with list autocomplete), in CDK's overlay. With `search="server"` the
 * application searches: the combobox emits `query` and shows the server's answer, a page at a time (ADR 0056). Text
 * that matches no option is put back when the person leaves. Signal Forms bind its `value` model
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
  imports: [
    AveButton,
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
    provideAveIcons([lucideCheck, lucideCircleAlert, lucideLoaderCircle, lucideX]),
    { provide: AVE_CONTROL_OWNER, useExisting: AveCombobox },
  ],
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
      [attr.data-clear]="clearable() ? '' : null"
      [(value)]="text"
      [(expanded)]="expanded"
      (focusout)="left($event)"
      (input)="typed()"
      (keydown.enter)="enter()"
    />
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
            [wrap]="!hasMore()"
            [value]="selectedValues()"
            [activeDescendant]="listbox.activeDescendant()"
            (valueChange)="choose($event)"
            (scroll)="scrolled()"
          >
            @for (option of shown(); track $index) {
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
          @if (spinner()) {
            <p class="state">
              <ave-icon class="ave-motion-spin" name="loader-circle" decorative />{{ messages.loading }}
            </p>
          } @else if (error()) {
            <div class="state failed">
              <ave-icon class="alert" name="circle-alert" decorative />
              <span class="text">{{ messages.loadFailed }}</span>
              <button aveButton type="button" variant="ghost" size="sm" (click)="retry()">
                {{ messages.retry }}
              </button>
            </div>
          } @else if (shown().length === 0 && !loading()) {
            <!-- A local list says it here; a server's list says it through the announcer, once it has loaded. -->
            <p class="empty" [attr.role]="search() === 'local' ? 'status' : null">{{ messages.noResults }}</p>
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

  /**
   * Where the options come from (ADR 0056): `local`, every option given, filtered by label as people type; `server`,
   * the server's answer to `query`, shown as given.
   */
  readonly search = input<AveSearchMode>('local');

  /** Whether the server is sending options: the list shows a spinner at its end, after a moment. */
  readonly loading = input(false, { transform: booleanAttribute });

  /** Whether the last request failed: the list says so and offers to try again, as Enter in the input does. */
  readonly error = input(false, { transform: booleanAttribute });

  /** Whether the server has more options than the list: its end, or Down on its last option, asks for them. */
  readonly hasMore = input(false, { transform: booleanAttribute });

  /**
   * The options of a value set from outside (a saved form) that the list may not hold, so the input can name it; the
   * options people choose are remembered (ADR 0056).
   */
  readonly chosenOptions = input<readonly AveOption<V>[]>([]);

  /** Emits when the person leaves the combobox, which marks a Signal Forms field touched. */
  readonly touch = output();

  /**
   * With `search="server"`: the text to search for, once typing has paused for `timing.search-delay`, and at once when
   * the list opens on text not asked for yet.
   */
  readonly query = output<string>();

  /** With `search="server"` and `hasMore`: the list wants its next page. */
  readonly loadMore = output();

  /** The form state, read on the host, where the form binding is. */
  readonly state = injectControlState();

  /** The application's template for the inside of every option, if it gives one (ADR 0055). */
  protected readonly optionTemplate = contentChild<AveOptionTemplate<V>>(AveOptionTemplate);

  /** The ids of the options' descriptions and meta. */
  protected readonly optionIds = optionIds();

  protected readonly messages = injectAveMessages();

  /** The option people chose last, which a server's later page may not hold. */
  private readonly remembered = signal<AveOption<V> | undefined>(undefined);

  /** The chosen option: in the list, among `chosenOptions`, or remembered from the person's choice. */
  private readonly selected = computed(() => {
    const value = this.value();
    if (value === null) return undefined;
    const find = (options: readonly AveOption<V>[] | undefined) =>
      options?.find((option) => Object.is(option.value, value));
    const remembered = this.remembered();
    return find(this.options()) ?? find(this.chosenOptions()) ?? find(remembered === undefined ? [] : [remembered]);
  });

  private readonly selectedLabel = computed(() => this.selected()?.label ?? '');

  /**
   * What the input says: the chosen option's label, or what the person types. It is the label again when the value
   * changes, and when the label changes (a server's page, a saved option) while the text is not being edited.
   */
  protected readonly text = linkedSignal<{ value: V | null; label: string }, string>({
    source: () => ({ value: this.value(), label: this.selectedLabel() }),
    computation: (source, previous) => {
      if (previous === undefined || !Object.is(previous.source.value, source.value)) return source.label;
      return previous.value === previous.source.label ? source.label : previous.value;
    },
  });

  /** Whether the list is open. */
  protected readonly expanded = signal(false);

  /** The options the list shows: every one while the input shows the chosen label, the matches while typing. */
  protected readonly shown = computed(() => {
    const options = this.options();
    if (this.search() === 'server') return options;
    const text = this.text();
    return text === this.selectedLabel() ? options : options.filter((option) => matches(option.label, text));
  });

  /**
   * The list's selection: the value. Aria's single selection toggles, so choosing the chosen option again takes it
   * away in the list; the list is then given the value back (see `choose`).
   */
  protected readonly selectedValues = linkedSignal<V[]>(() => {
    // Given anew whenever the list changes, so an option the search hid and shows again has its check back.
    this.shown();
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

  private readonly input = viewChild.required<Combobox>('combobox');
  private readonly list = viewChild<Listbox<V>>('listbox');
  private readonly popup = viewChild<ElementRef<HTMLElement>>('popup');

  /** The overlay stays open while the list plays its exit (ADR 0046). */
  protected readonly presence = aveOverlayPresence(
    this.expanded,
    computed(() => this.popup()?.nativeElement),
  );

  protected readonly overlay = computed(() => aveConnectedOverlay(this.input().element));

  /** The server's side of the list (ADR 0056). */
  private readonly remote = remoteList({
    search: this.search,
    // The chosen label is not a search: the list asks for everything, as a local list shows every option.
    text: computed(() => (this.text() === this.selectedLabel() ? '' : this.text())),
    expanded: this.expanded,
    loading: this.loading,
    error: this.error,
    hasMore: this.hasMore,
    count: computed(() => this.shown().length),
    list: computed(() => this.popup()?.nativeElement.querySelector<HTMLElement>('.listbox') ?? undefined),
    listbox: this.list,
    query: this.query,
    loadMore: this.loadMore,
  });

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

  /** Whether the list shows its spinner, on the spinner's timings (ADR 0056). */
  protected readonly spinner = this.remote.spinner;

  /** The person typed: a server's list searches once typing pauses. */
  protected typed(): void {
    this.remote.typed();
  }

  /** The list scrolled: at its end, a server's list asks for its next page. */
  protected scrolled(): void {
    this.remote.scrolled();
  }

  /** The Try again button: the last request goes again. */
  protected retry(): void {
    this.remote.retry();
  }

  /** Enter with no option active, after a request failed, asks the server again (ADR 0056). */
  protected enter(): void {
    if (this.error() && this.list()?.activeDescendant() === undefined) this.remote.retry();
  }

  /**
   * The person chose an option: the value changes, the input shows its label, and the list closes. The chosen option
   * chosen again keeps it.
   */
  protected choose(values: V[]): void {
    // The search hid the chosen option, and Aria's listbox dropped it: the value and the typed text stay.
    if (pruned(this.selectedValues(), values, this.shown())) return;
    const value = values[0] ?? this.value();
    this.selectedValues.set(value === null ? [] : [value]);
    const option = this.shown().find((shown) => Object.is(shown.value, value));
    if (option !== undefined) this.remembered.set(option);
    this.value.set(value);
    this.text.set(this.selectedLabel());
    this.changed(value);
    this.expanded.set(false);
  }

  /** The clear button: the input empties, the value goes, the list closes, and focus is in the input (ADR 0052). */
  protected clear(): void {
    this.value.set(null);
    this.text.set('');
    this.changed(null);
    this.expanded.set(false);
    this.input().element.focus();
  }

  /**
   * Focus left the combobox: an emptied input clears the value; any other text that is not the chosen label is put
   * back.
   */
  protected left(event: FocusEvent): void {
    const next = event.relatedTarget;
    if (next instanceof Node && this.input().element.parentElement?.contains(next) === true) return;
    if (this.text().trim() === '' && this.value() !== null) {
      this.value.set(null);
      this.changed(null);
    }
    this.text.set(this.selectedLabel());
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
