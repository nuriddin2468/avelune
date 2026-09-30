import { Component, input, signal } from '@angular/core';
import { FormField, form, pattern, required } from '@angular/forms/signals';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { AveInput } from '@avelune/ui/input';
import { AveMask, aveMaskPattern, type AveMaskPattern, type AveMaskPreset } from '@avelune/ui/mask';

type View = 'phone' | 'presets' | 'patterns' | 'states' | 'forms' | 'long';

/** Each preset with a value the program wrote, shown grouped. */
const presets: readonly { preset: AveMaskPreset; label: string; hint: string; value: string }[] = [
  { preset: 'phone', label: 'Телефон', hint: 'Например, +998 90 123-45-67', value: '+998901234567' },
  { preset: 'stir', label: 'ИНН (СТИР)', hint: '9 цифр', value: '302345678' },
  { preset: 'pinfl', label: 'ПИНФЛ', hint: '14 цифр', value: '31203865210024' },
  { preset: 'passport', label: 'Паспорт или ID-карта', hint: 'Две латинские буквы и семь цифр', value: 'AD1234567' },
  { preset: 'card', label: 'Номер карты', hint: '16 цифр', value: '8600123456789012' },
  { preset: 'account', label: 'Расчётный счёт', hint: '20 цифр', value: '23402000300100001010' },
  { preset: 'mfo', label: 'МФО банка', hint: '5 цифр', value: '00450' },
  { preset: 'postcode', label: 'Почтовый индекс', hint: '6 цифр', value: '100084' },
];

/** A pattern of the application's: a contract's number, its letters written for the person. */
const contractNumber: AveMaskPattern = { pattern: 'ДК-0000/000', value: 'shown' };

/** A RegExp as a filter: a warehouse code of capital Latin letters, digits and hyphens, at most 12. */
const warehouseCode = /^[A-Z0-9-]{0,12}$/;

let nextFrame = 0;

/**
 * The frame the stories draw masked inputs in, with plain labels until FormField (a composite): the format in a hint
 * that describes the input. Styled with tokens only.
 */
@Component({
  selector: 'ave-mask-stories',
  imports: [AveInput, AveMask, FormField],
  template: `
    @switch (view()) {
      @case ('presets') {
        <div class="grid">
          @for (item of presets; track item.preset) {
            <div class="field">
              <label class="label" [for]="id + item.preset + '-control'">{{ item.label }}</label>
              <input
                [id]="id + item.preset + '-control'"
                aveInput
                [aveMask]="item.preset"
                [value]="item.value"
                [attr.aria-describedby]="id + item.preset"
              />
              <span class="hint" [id]="id + item.preset">{{ item.hint }}</span>
            </div>
          }
        </div>
      }
      @case ('patterns') {
        <div class="stack narrow">
          <div class="field">
            <label class="label" [for]="id + 'number-control'">Номер договора</label>
            <input
              [id]="id + 'number-control'"
              aveInput
              [aveMask]="contractNumber"
              [(value)]="number"
              [attr.aria-describedby]="id + 'number'"
            />
            <span class="hint" [id]="id + 'number'">Например, ДК-2026/114</span>
          </div>
          <div class="field">
            <label class="label" [for]="id + 'code-control'">Код склада</label>
            <input
              [id]="id + 'code-control'"
              aveInput
              [aveMask]="warehouseCode"
              [(value)]="code"
              [attr.aria-describedby]="id + 'code'"
            />
            <span class="hint" [id]="id + 'code'">Заглавные латинские буквы, цифры и дефис, до 12 знаков</span>
          </div>
          <p class="value" role="status">Номер: {{ number() || '—' }}, код: {{ code() || '—' }}</p>
        </div>
      }
      @case ('states') {
        <div class="grid">
          <div class="field">
            <label class="label" [for]="id + 'field1-control'">Телефон, мелкий</label>
            <input [id]="id + 'field1-control'" aveInput aveMask="phone" size="sm" type="tel" value="+998901234567" />
          </div>
          <div class="field">
            <label class="label" [for]="id + 'field2-control'">Телефон, крупный</label>
            <input [id]="id + 'field2-control'" aveInput aveMask="phone" size="lg" type="tel" value="+998901234567" />
          </div>
          <div class="field">
            <label class="label" [for]="id + 'partial-control'">Не полностью</label>
            <input
              [id]="id + 'partial-control'"
              aveInput
              aveMask="phone"
              type="tel"
              value="+99890123"
              aria-invalid="true"
              [attr.aria-describedby]="id + 'partial'"
            />
            <span class="hint error" [id]="id + 'partial'">Введите номер полностью: +998 и 9 цифр</span>
          </div>
          <div class="field">
            <label class="label" [for]="id + 'field3-control'">Только чтение</label>
            <input [id]="id + 'field3-control'" aveInput aveMask="stir" value="302345678" readonly />
          </div>
          <div class="field">
            <label class="label" [for]="id + 'field4-control'">Недоступно</label>
            <input [id]="id + 'field4-control'" aveInput aveMask="card" value="8600123456789012" disabled />
          </div>
        </div>
      }
      @case ('forms') {
        <div class="stack narrow">
          <div class="field">
            <label class="label" [for]="id + 'phone-control'">Телефон контрагента</label>
            <input
              [id]="id + 'phone-control'"
              aveInput
              aveMask="phone"
              type="tel"
              autocomplete="tel"
              [formField]="contact.phone"
              [attr.aria-describedby]="id + 'phone'"
            />
            <span class="hint" [id]="id + 'phone'">Например, +998 90 123-45-67</span>
          </div>
          <p class="value" role="status">Значение формы: {{ contact.phone().value() || '—' }}</p>
        </div>
      }
      @case ('long') {
        <div class="stack narrow" lang="uz-Latn">
          <div class="field">
            <label class="label" [for]="id + 'phone-control'"
              >Kontragentning telefon raqami (ish vaqtida bogʻlanish uchun)</label
            >
            <input
              [id]="id + 'phone-control'"
              aveInput
              aveMask="phone"
              type="tel"
              value="+998901234567"
              [attr.aria-describedby]="id + 'phone'"
            />
            <span class="hint" [id]="id + 'phone'">Masalan, +998 90 123-45-67: mamlakat kodi avtomatik qoʻshiladi</span>
          </div>
          <div class="field">
            <label class="label" [for]="id + 'pinfl-control'"
              >Jismoniy shaxsning shaxsiy identifikatsiya raqami (JShShIR)</label
            >
            <input
              [id]="id + 'pinfl-control'"
              aveInput
              aveMask="pinfl"
              value="31203865210024"
              [attr.aria-describedby]="id + 'pinfl'"
            />
            <span class="hint" [id]="id + 'pinfl'">14 ta raqam, pasport yoki ID-kartaning orqa tomonida</span>
          </div>
        </div>
      }
      @default {
        <div class="stack narrow">
          <div class="field">
            <label class="label" [for]="id + 'phone-control'">Телефон контрагента</label>
            <input
              [id]="id + 'phone-control'"
              aveInput
              aveMask="phone"
              type="tel"
              autocomplete="tel"
              [(value)]="phone"
              [attr.aria-describedby]="id + 'phone'"
            />
            <span class="hint" [id]="id + 'phone'">Например, +998 90 123-45-67</span>
          </div>
          <p class="value" role="status">Значение формы: {{ phone() || '—' }}</p>
        </div>
      }
    }
  `,
  styleUrl: './mask.stories.css',
})
class MaskStories {
  readonly view = input<View>('phone');
  protected readonly id = `ave-mask-story-${String(nextFrame++)}-`;
  protected readonly presets = presets;
  protected readonly contractNumber = contractNumber;
  protected readonly warehouseCode = warehouseCode;
  protected readonly phone = signal('');
  protected readonly number = signal('');
  protected readonly code = signal('');
  protected readonly contact = form(signal({ phone: '' }), (path) => {
    required(path.phone);
    pattern(path.phone, aveMaskPattern('phone'));
  });
}

type Story = StoryObj<AveMask>;

function frame(view: View): NonNullable<Story['render']> {
  return () => ({
    props: { view },
    template: `<ave-mask-stories [view]="view" />`,
    moduleMetadata: { imports: [MaskStories] },
  });
}

/** The field a play function types into, by its label. */
function field(canvasElement: HTMLElement, name: string): HTMLInputElement {
  const found = within(canvasElement).getByRole('textbox', { name });
  if (!(found instanceof HTMLInputElement)) throw new Error(`No input named ${name}`);
  return found;
}

const meta: Meta<AveMask> = {
  title: 'Components/Mask',
  component: AveMask,
};
export default meta;

/** A phone: +998 on focus, the digits grouped as they are typed, the form's value in E.164. */
export const Default: Story = {
  render: frame('phone'),
  parameters: {
    docs: {
      source: {
        code: `<label for="phone">Телефон контрагента</label>
<input id="phone" aveInput aveMask="phone" type="tel" autocomplete="tel" [(value)]="phone" aria-describedby="phone-hint" />
<span id="phone-hint">Например, +998 90 123-45-67</span>
<p role="status">Значение формы: {{ phone() || '—' }}</p>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const phone = field(canvasElement, 'Телефон контрагента');
    await expect(phone).toHaveAttribute('inputmode', 'tel');
    await userEvent.type(phone, '90x1234567');
    await expect(phone).toHaveValue('+998 90 123-45-67');
    await expect(within(canvasElement).getByRole('status')).toHaveTextContent('Значение формы: +998901234567');
    phone.blur();
  },
};

/** Every preset, each with a value the program wrote, shown grouped. */
export const Presets: Story = {
  render: frame('presets'),
  parameters: {
    docs: {
      source: {
        code: `<input aveInput aveMask="phone" type="tel" />     <!-- +998 90 123-45-67 → +998901234567 -->
<input aveInput aveMask="stir" />                <!-- 302345678 -->
<input aveInput aveMask="pinfl" />               <!-- 31203865210024 -->
<input aveInput aveMask="passport" />            <!-- AD1234567 -->
<input aveInput aveMask="card" />                <!-- 8600 1234 5678 9012 → 8600123456789012 -->
<input aveInput aveMask="account" />             <!-- 2340 2000 3001 0000 1010 → 20 digits -->
<input aveInput aveMask="mfo" />                 <!-- 00450 -->
<input aveInput aveMask="postcode" />            <!-- 100084 -->`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expect(field(canvasElement, 'Телефон')).toHaveValue('+998 90 123-45-67');
    await expect(field(canvasElement, 'Номер карты')).toHaveValue('8600 1234 5678 9012');
    await expect(field(canvasElement, 'Расчётный счёт')).toHaveValue('2340 2000 3001 0000 1010');
    await expect(field(canvasElement, 'Паспорт или ID-карта')).toHaveAttribute('autocapitalize', 'characters');
  },
};

/** A pattern of the application's, its letters written for the person, and a RegExp that filters what is typed. */
export const Patterns: Story = {
  render: frame('patterns'),
  parameters: {
    docs: {
      source: {
        code: `import { Component, signal } from '@angular/core';
import { AveInput } from '@avelune/ui/input';
import { AveMask, type AveMaskPattern } from '@avelune/ui/mask';

@Component({
  selector: 'app-contract-codes',
  imports: [AveInput, AveMask],
  template: \`
    <label for="number">Номер договора</label>
    <input id="number" aveInput [aveMask]="contractNumber" [(value)]="number" aria-describedby="number-hint" />
    <span id="number-hint">Например, ДК-2026/114</span>
    <label for="code">Код склада</label>
    <input id="code" aveInput [aveMask]="warehouseCode" [(value)]="code" aria-describedby="code-hint" />
    <span id="code-hint">Заглавные латинские буквы, цифры и дефис, до 12 знаков</span>
    <p role="status">Номер: {{ number() || '—' }}, код: {{ code() || '—' }}</p>
  \`,
})
export class ContractCodes {
  protected readonly contractNumber: AveMaskPattern = { pattern: 'ДК-0000/000', value: 'shown' };
  protected readonly warehouseCode = /^[A-Z0-9-]{0,12}$/;
  protected readonly number = signal('');
  protected readonly code = signal('');
}`,
        language: 'typescript',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const number = field(canvasElement, 'Номер договора');
    await userEvent.type(number, '2026114');
    await expect(number).toHaveValue('ДК-2026/114');
    const code = field(canvasElement, 'Код склада');
    await userEvent.type(code, 'TAS-01a');
    await expect(code).toHaveValue('TAS-01');
    await expect(within(canvasElement).getByRole('status')).toHaveTextContent('Номер: ДК-2026/114, код: TAS-01');
    code.blur();
  },
};

/** The Input's sizes and states: a mask changes none of them. */
export const States: Story = {
  tags: ['forced-colors'],
  render: frame('states'),
  parameters: {
    docs: {
      source: {
        code: `<input aveInput aveMask="phone" size="sm" type="tel" value="+998901234567" />
<input aveInput aveMask="phone" size="lg" type="tel" value="+998901234567" />
<!-- A number typed in part: the application marks it invalid. -->
<input aveInput aveMask="phone" type="tel" value="+99890123" aria-invalid="true" />
<input aveInput aveMask="stir" value="302345678" readonly />
<input aveInput aveMask="card" value="8600123456789012" disabled />`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expect(field(canvasElement, 'Не полностью')).toHaveValue('+998 90 123');
    await expect(field(canvasElement, 'Недоступно')).toBeDisabled();
  },
};

/** Signal Forms: the clean value, and `aveMaskPattern` for a number typed only in part. */
export const SignalForms: Story = {
  name: 'Signal Forms',
  render: frame('forms'),
  parameters: {
    docs: {
      source: {
        code: `import { Component, signal } from '@angular/core';
import { FormField, form, pattern, required } from '@angular/forms/signals';
import { AveInput } from '@avelune/ui/input';
import { AveMask, aveMaskPattern } from '@avelune/ui/mask';

@Component({
  selector: 'app-contact-phone',
  imports: [AveInput, AveMask, FormField],
  template: \`
    <label for="phone">Телефон контрагента</label>
    <input id="phone" aveInput aveMask="phone" type="tel" autocomplete="tel" [formField]="contact.phone" aria-describedby="phone-hint" />
    <span id="phone-hint">Например, +998 90 123-45-67</span>
    <p role="status">Значение формы: {{ contact.phone().value() || '—' }}</p>
  \`,
})
export class ContactPhone {
  protected readonly contact = form(signal({ phone: '' }), (path) => {
    required(path.phone);
    pattern(path.phone, aveMaskPattern('phone'));
  });
}`,
        language: 'typescript',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const phone = field(canvasElement, 'Телефон контрагента');
    await expect(phone).toBeRequired();
    await userEvent.type(phone, '90123');
    await userEvent.tab();
    await waitFor(() => expect(phone).toHaveAttribute('aria-invalid', 'true'));
    await expect(within(canvasElement).getByRole('status')).toHaveTextContent('Значение формы: +99890123');
    // Back at the end of what was typed, as a click there puts the caret.
    phone.focus();
    phone.setSelectionRange(phone.value.length, phone.value.length);
    await userEvent.keyboard('4567');
    await expect(phone).toHaveValue('+998 90 123-45-67');
    await userEvent.tab();
    await waitFor(() => expect(phone).not.toHaveAttribute('aria-invalid'));
  },
};

/** Long Uzbek labels and hints wrap; the grouped value keeps its field. */
export const LongText: Story = {
  name: 'Long text',
  render: frame('long'),
  parameters: {
    docs: {
      source: {
        code: `<label for="phone">Kontragentning telefon raqami (ish vaqtida bogʻlanish uchun)</label>
<input id="phone" aveInput aveMask="phone" type="tel" value="+998901234567" aria-describedby="phone-hint" />
<span id="phone-hint">Masalan, +998 90 123-45-67: mamlakat kodi avtomatik qoʻshiladi</span>

<label for="pinfl">Jismoniy shaxsning shaxsiy identifikatsiya raqami (JShShIR)</label>
<input id="pinfl" aveInput aveMask="pinfl" value="31203865210024" aria-describedby="pinfl-hint" />
<span id="pinfl-hint">14 ta raqam, pasport yoki ID-kartaning orqa tomonida</span>`,
        language: 'html',
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.scrollWidth).toBe(canvasElement.clientWidth);
    await expect(field(canvasElement, 'Kontragentning telefon raqami (ish vaqtida bogʻlanish uchun)')).toHaveValue(
      '+998 90 123-45-67',
    );
  },
};
