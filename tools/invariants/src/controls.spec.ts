import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { sameSizeViolations, type ControlBox } from './controls.ts';

const box = (overrides: Partial<ControlBox>): ControlBox => ({
  control: 'button[aveButton] "Save"',
  size: 'md',
  square: false,
  height: 36,
  radius: '8px',
  border: '1px',
  fontSize: '14px',
  padding: '16px',
  ...overrides,
});

describe('sameSizeViolations', () => {
  it('accepts controls of one size that share their box, and squares with no padding', () => {
    assert.deepEqual(
      sameSizeViolations([
        box({}),
        box({ control: 'input[aveInput]' }),
        box({ control: 'button[aveIconButton] "Close"', square: true, padding: '0px' }),
        box({ control: 'button[aveButton] "Filters"', size: 'sm', height: 32, padding: '12px' }),
        box({ control: 'input[aveInput]', height: 36.004 }),
      ]),
      [],
    );
  });

  it('names each difference, against the first control of the size', () => {
    assert.deepEqual(
      sameSizeViolations([
        box({}),
        box({
          control: 'input[aveInput]',
          height: 40,
          radius: '4px',
          border: '2px',
          fontSize: '16px',
          padding: '12px',
        }),
      ]),
      [
        'input[aveInput] (md): height 40, but button[aveButton] "Save" has 36',
        'input[aveInput] (md): radius 4px, but button[aveButton] "Save" has 8px',
        'input[aveInput] (md): border width 2px, but button[aveButton] "Save" has 1px',
        'input[aveInput] (md): font size 16px, but button[aveButton] "Save" has 14px',
        'input[aveInput] (md): inline padding 12px, but button[aveButton] "Save" has 16px',
      ],
    );
  });

  it('compares padding among labelled controls only, even when a square comes first', () => {
    assert.deepEqual(
      sameSizeViolations([
        box({ control: 'button[aveIconButton] "Close"', square: true, padding: '0px' }),
        box({}),
        box({ control: 'input[aveInput]', padding: '20px' }),
      ]),
      ['input[aveInput] (md): inline padding 20px, but button[aveButton] "Save" has 16px'],
    );
  });
});
