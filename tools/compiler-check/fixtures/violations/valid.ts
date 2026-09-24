// Proves: nothing. The control fixture: idiomatic kit code that the required options must accept with no
// diagnostic at all, so a flag that also rejects correct code is caught before it reaches a component.
// Expect: none

import {
  booleanAttribute,
  Component,
  computed,
  Directive,
  ElementRef,
  forwardRef,
  inject,
  Injectable,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { Listbox, Option } from '@angular/aria/listbox';
import { FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule, type ControlValueAccessor } from '@angular/forms';
import { form, FormField, required, type FormValueControl } from '@angular/forms/signals';

export type FixtureVariant = 'primary' | 'secondary';

interface FixtureOptions {
  readonly label?: string;
  readonly variant?: FixtureVariant;
}

/** Optional options are left out, never set to `undefined` (exactOptionalPropertyTypes). */
export function withLabel(options: FixtureOptions, label: string | undefined): FixtureOptions {
  return { ...options, ...(label === undefined ? {} : { label }) };
}

@Injectable({ providedIn: 'root' })
export class FixtureClock {
  now(): number {
    return Date.now();
  }
}

@Directive({
  selector: 'button[aveFixtureButton], a[aveFixtureButton]',
  host: {
    '[class.ave-fixture-button]': 'true',
    '[attr.data-variant]': 'variant()',
    '[attr.aria-disabled]': 'disabled() || null',
    '(click)': 'onClick($event)',
  },
})
export class FixtureButton {
  readonly variant = input<FixtureVariant>('secondary');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly pressed = output<void>();

  /** Host listeners receive `Event`: the host element's event map is not known to the type checker. */
  protected onClick(event: Event): void {
    if (this.disabled()) {
      event.preventDefault();
      return;
    }
    this.pressed.emit();
  }
}

/** A Signal Forms control. */
@Component({
  selector: 'ave-fixture-input',
  host: { '[attr.aria-invalid]': 'invalid() || null' },
  template: `<input
    #field
    aria-label="Name"
    [value]="value()"
    [disabled]="disabled()"
    (input)="value.set(field.value)"
    (blur)="touch.emit()"
  />`,
})
export class FixtureInput implements FormValueControl<string> {
  readonly value = model('');
  readonly disabled = input(false);
  readonly invalid = input(false);
  readonly touch = output<void>();
  private readonly field = viewChild.required<ElementRef<HTMLInputElement>>('field');

  focus(): void {
    this.field().nativeElement.focus();
  }
}

/** A Reactive Forms control. */
@Component({
  selector: 'ave-fixture-checkbox',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => FixtureCheckbox), multi: true }],
  template: `<input type="checkbox" aria-label="Agree" [checked]="checked()" (change)="toggle()" />`,
})
export class FixtureCheckbox implements ControlValueAccessor {
  protected readonly checked = signal(false);
  private onChange: (value: boolean) => void = () => undefined;

  writeValue(value: unknown): void {
    this.checked.set(value === true);
  }

  registerOnChange(fn: (value: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(): void {}

  protected toggle(): void {
    this.checked.update((checked) => !checked);
    this.onChange(this.checked());
  }
}

@Component({ selector: 'ave-fixture-card', template: '<ng-content select="header" /><ng-content />' })
export class FixtureCard {}

@Component({
  selector: 'ave-fixture-page',
  imports: [FixtureButton, FixtureInput, FixtureCheckbox, FixtureCard, FormField, ReactiveFormsModule, Listbox, Option],
  template: `
    <ave-fixture-card>
      <header>{{ title() }}</header>
      @let count = items().length;
      <p>{{ count }} items, {{ total() }} in total</p>
      @for (item of items(); track item.id) {
        <p>{{ item.label }}</p>
      } @empty {
        <p>No items</p>
      }
      @switch (variant()) {
        @case ('primary') {
          <p>Primary</p>
        }
        @default {
          <p>Secondary</p>
        }
      }
      @if (user?.name; as name) {
        <p>{{ name }}</p>
      }
    </ave-fixture-card>
    <button type="button" aveFixtureButton variant="primary" disabled (pressed)="save()">Save</button>
    <ave-fixture-input [formField]="profile.name" />
    <ave-fixture-checkbox [formControl]="agree" />
    <ul ngListbox aria-label="Size" [(value)]="sizes">
      <li ngOption [value]="'sm'" label="Small">Small</li>
    </ul>
  `,
})
export class FixturePage {
  private readonly clock = inject(FixtureClock);
  readonly title = input.required<string>();
  protected readonly variant = signal<FixtureVariant>('primary');
  protected readonly items = signal<readonly { readonly id: string; readonly label: string }[]>([]);
  protected readonly total = computed(() => this.items().length);
  protected readonly user: { readonly name?: string } | undefined = undefined;
  protected readonly model = signal({ name: '' });
  protected readonly profile = form(this.model, (path) => {
    required(path.name);
  });
  protected readonly agree = new FormControl(false, { nonNullable: true });
  protected sizes: string[] = [];

  protected save(): number {
    return this.clock.now();
  }
}
