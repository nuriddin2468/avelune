import {
  Component,
  DestroyRef,
  ElementRef,
  Renderer2,
  RendererStyleFlags2,
  afterRenderEffect,
  booleanAttribute,
  computed,
  contentChild,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { Combobox, ComboboxPopup, ComboboxWidget } from '@angular/aria/combobox';
import { Listbox, Option } from '@angular/aria/listbox';
import { CdkConnectedOverlay, OverlayModule } from '@angular/cdk/overlay';
import { NgControl, type ControlValueAccessor } from '@angular/forms';
import { FORM_FIELD } from '@angular/forms/signals';
import { lucideCheck, lucideChevronDown, lucideCircleAlert, lucideLoaderCircle, lucideX } from '@avelune/icons/lucide';
import { AveButton } from '@avelune/ui/button';
import { AVE_CONTROL_OWNER, AveClearButton, AveControlTarget, injectControlState } from '@avelune/ui/forms';
import { injectAveMessages } from '@avelune/ui/i18n';
import { AveIcon, provideAveIcons } from '@avelune/ui/icon';
import { aveConnectedOverlay, aveOverlayPresence } from '@avelune/ui/overlay';
import { AVE_TAG_FIELD, AveTag } from '@avelune/ui/tag';
import { pruned } from './choice';
import { matches } from './match';
import { AveOptionContent, describedBy, optionIds } from './option-content';
import { remoteList, type AveSearchMode } from './remote';
import { AveOptionTemplate } from './templates';
import type { AveOption, AveSelectSize } from './types';

/**
 * The kit's multiselect (brief §9.1, ADR 0046): several choices from a list, under a trigger with the box of an
 * Input that names what is chosen. The list stays open while people check and uncheck options, and closes on Escape,
 * Tab or a click outside. With `search`, the trigger is an input that filters the options or asks a server (ADR
 * 0057). Built on Angular Aria's combobox and a multi-select listbox, in CDK's overlay. Signal Forms
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
    AveButton,
    AveClearButton,
    AveControlTarget,
    AveIcon,
    AveOptionContent,
    Combobox,
    ComboboxPopup,
    ComboboxWidget,
    AveTag,
    Listbox,
    Option,
    OverlayModule,
  ],
  providers: [
    provideAveIcons([lucideCheck, lucideChevronDown, lucideCircleAlert, lucideLoaderCircle, lucideX]),
    { provide: AVE_CONTROL_OWNER, useExisting: AveMultiselect },
    { provide: AVE_TAG_FIELD, useValue: true },
  ],
  host: {
    '[attr.data-size]': 'size()',
    '[attr.data-chips]': 'chosen().length > 0 ? "" : null',
    '[attr.data-disabled]': 'isDisabled() ? "" : null',
  },
  template: `
    <!-- The field: the trigger, and while there are chosen values their tags, whose rows set its height (ADR 0081). -->
    <div class="box">
      @if (search() === 'none') {
        <button
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
          <!-- The combobox's value: the chosen labels, out of sight while the tags show them (ADR 0081). -->
          <span class="value" [class.cdk-visually-hidden]="chosen().length > 0">{{ text() }}</span>
          <ave-icon class="chevron" name="chevron-down" decorative />
        </button>
      } @else {
        <!-- A searchable multiselect (ADR 0057, 0081): the search only, after the last tag. -->
        <input
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
          [attr.placeholder]="(chosen().length === 0 && placeholder()) || null"
          [attr.data-empty]="chosen().length === 0 ? '' : null"
          [attr.data-clear]="clearable() ? '' : null"
          [(value)]="searchText"
          [(expanded)]="expanded"
          (focusout)="left($event)"
          (input)="typed()"
          (keydown.enter)="enter()"
        />
      }
      @if (chosen().length > 0) {
        <!-- The chosen values as tags over the trigger, in rows that wrap (ADR 0081); a press on a tag's words reaches the
           trigger under it, its remove button unchecks it. -->
        <ul
          class="chips"
          [attr.data-clear]="clearable() ? '' : null"
          [attr.aria-disabled]="isDisabled() ? 'true' : null"
        >
          @for (option of chosen(); track option.value) {
            <li>
              <ave-tag size="sm" [removable]="changeable()" (remove)="uncheck(option.value)">{{
                option.label
              }}</ave-tag>
            </li>
          }
          @if (search() !== 'none') {
            <li #room class="room" aria-hidden="true"></li>
          }
        </ul>
        @if (search() !== 'none') {
          <span hidden [id]="chosenId">{{ messages.chosenValues(summary()) }}</span>
        }
      }
      @if (clearable()) {
        <button aveClearButton type="button" class="clear" [label]="label()" (click)="clear()">
          <ave-icon name="x" decorative />
        </button>
      }
    </div>
    <!-- The popup outside the overlay, so the combobox knows its popup (aria-haspopup, aria-autocomplete) before it
         first opens; the overlay renders once the list is first shown and stays, closed, after (preserveContent). -->
    <ng-template ngComboboxPopup [combobox]="trigger()">
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
            [wrap]="!hasMore()"
            [value]="value()"
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
          } @else if (search() !== 'none' && shown().length === 0 && !loading()) {
            <!-- A local list says it here; a server's list says it through the announcer, once it has loaded. -->
            <p class="empty" [attr.role]="search() === 'local' ? 'status' : null">{{ messages.noResults }}</p>
          }
        </div>
      </ng-template>
    </ng-template>
  `,
  styleUrls: ['./select.css', './list.css', './chips.css'],
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

  /**
   * Whether people search the options (ADR 0057): `none`, a button opens the list; `local`, an input filters the
   * options by label as people type; `server`, the input asks a server through `query`, a page at a time (ADR 0056).
   */
  readonly search = input<AveSearchMode | 'none'>('none');

  /** With `search="server"`: whether the server is sending options. */
  readonly loading = input(false, { transform: booleanAttribute });

  /** With `search="server"`: whether the last request failed; the list offers to try again, as Enter does. */
  readonly error = input(false, { transform: booleanAttribute });

  /** With `search="server"`: whether the server has more options than the list. */
  readonly hasMore = input(false, { transform: booleanAttribute });

  /** Emits when the person leaves the multiselect, which marks a Signal Forms field touched. */
  readonly touch = output();

  /** With `search="server"`: the text to search for, once typing pauses, and at once when the list opens. */
  readonly query = output<string>();

  /** With `search="server"` and `hasMore`: the list wants its next page. */
  readonly loadMore = output();

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

  /** The chosen labels, comma-separated. */
  protected readonly summary = computed(() =>
    this.chosen()
      .map((option) => option.label)
      .join(', '),
  );

  /** What the button says: the chosen labels, or the placeholder. */
  protected readonly text = computed(() => this.summary() || this.placeholder());

  /**
   * What the searchable input holds (ADR 0081): only what the person types, which stays while options are checked;
   * the tags say what is chosen.
   */
  protected readonly searchText = signal('');

  /** The options the list shows: every one, or the matches of a local search. */
  protected readonly shown = computed(() => {
    const options = this.options();
    const text = this.searchText();
    if (this.search() !== 'local' || text === '') return options;
    return options.filter((option) => matches(option.label, text));
  });

  protected readonly messages = injectAveMessages();

  protected readonly isDisabled = computed(() => this.disabled() || this.state.disabled() || this.disabledByForm());

  /** Whether the chosen options can be changed: their tags have remove buttons. */
  protected readonly changeable = computed(() => !this.isDisabled() && !this.readonly());

  /** Whether the clear button shows: chosen options that can be changed and may be taken away (ADR 0052). */
  protected readonly clearable = computed(
    () => this.value().length > 0 && !this.isDisabled() && !this.readonly() && !this.state.required(),
  );

  /** @internal The field around the control dims its label while the control is disabled, by input or by form. */
  readonly controlDisabled = this.isDisabled;

  /** The id of the words that describe a searchable input with what is chosen (ADR 0081). */
  protected readonly chosenId = `${this.optionIds}-chosen`;

  /** @internal A searchable input is described by what is chosen, which its tags show and its value does not. */
  readonly controlDescriptions = computed(() =>
    this.search() !== 'none' && this.chosen().length > 0 ? [this.chosenId] : [],
  );

  protected readonly trigger = viewChild.required<Combobox>(Combobox);
  private readonly list = viewChild<Listbox<V>>('listbox');
  private readonly popup = viewChild<ElementRef<HTMLElement>>('popup');
  /** The list's overlay, which follows the field as its rows of tags grow or shrink. */
  private readonly connected = viewChild(CdkConnectedOverlay);
  /** The room after the last tag where the search is typed (ADR 0081). */
  private readonly room = viewChild<ElementRef<HTMLElement>>('room');
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly renderer = inject(Renderer2);

  /** The overlay stays open while the list plays its exit (ADR 0046). */
  protected readonly presence = aveOverlayPresence(
    this.expanded,
    computed(() => this.popup()?.nativeElement),
  );

  protected readonly overlay = computed(() => aveConnectedOverlay(this.trigger().element));

  /** The server's side of the list (ADR 0056). */
  private readonly remote = remoteList({
    search: this.search,
    text: this.searchText,
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

  /** Whether the list shows its spinner, on the spinner's timings (ADR 0056). */
  protected readonly spinner = this.remote.spinner;

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
    // The list closed: the search is over.
    effect(() => {
      if (!this.expanded()) this.searchText.set('');
    });
    // The search is typed in the room after the last tag, wherever the tags wrap to; an open list stays under the
    // field as it grows or shrinks by a row.
    afterRenderEffect(() => {
      this.chosen();
      this.placeSearch();
    });
    const resized = new ResizeObserver(() => {
      this.placeSearch();
      if (this.presence.open()) this.connected()?.overlayRef.updatePosition();
    });
    resized.observe(this.host);
    inject(DestroyRef).onDestroy(() => {
      resized.disconnect();
    });
  }

  /**
   * Puts a searchable input's text in the room after the last tag (ADR 0081): its padding starts where the room
   * starts, and its line is the room's.
   */
  private placeSearch(): void {
    const room = this.room()?.nativeElement;
    if (room === undefined) return;
    const host = this.host.getBoundingClientRect();
    const box = room.getBoundingClientRect();
    const border = Number.parseFloat(getComputedStyle(this.host.querySelector('.trigger') ?? this.host).borderTopWidth);
    const start = getComputedStyle(this.host).direction === 'rtl' ? host.right - box.right : box.left - host.left;
    const place = (name: string, value: number) => {
      this.renderer.setStyle(this.host, name, `${String(value)}px`, RendererStyleFlags2.DashCase);
    };
    place('--ave-multiselect-search-start', start - border);
    place('--ave-multiselect-search-top', box.top - host.top - border);
    place('--ave-multiselect-search-bottom', host.bottom - box.bottom - border);
  }

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
   * The person checked or unchecked an option: the values change in the order of the list, and those it does not show
   * stay after them; the list stays open.
   */
  protected choose(values: V[]): void {
    const shown = this.shown();
    // Chosen values the list does not show, which Aria's listbox dropped, stay chosen.
    if (pruned(this.value(), values, shown)) return;
    const has = (list: readonly V[], value: V) => list.some((other) => Object.is(other, value));
    const isShown = (value: V) => shown.some((option) => Object.is(option.value, value));
    // A value the list shows is chosen as the list says; one it hides (a search, a server's page) as it was.
    const kept = (value: V) => (isShown(value) ? has(values, value) : has(this.value(), value));
    const known = this.options().map((option) => option.value);
    const outside = this.value().filter((value) => !has(known, value));
    const next = [...known.filter(kept), ...outside.filter(kept)];
    this.remembered.update((remembered) => [
      ...remembered.filter((option) => !isShown(option.value)),
      ...shown.filter((option) => has(next, option.value)),
    ]);
    this.value.set(next);
    this.changed(next);
  }

  /** A tag's remove button: its option is unchecked, and focus goes to the trigger (ADR 0081). */
  protected uncheck(value: V): void {
    const next = this.value().filter((chosen) => !Object.is(chosen, value));
    this.value.set(next);
    this.changed(next);
    this.trigger().element.focus();
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
    if (next instanceof Node && this.host.contains(next)) return;
    this.searchText.set('');
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
