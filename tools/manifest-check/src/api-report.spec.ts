// Proves that the API reports are read as the kit declares its components and its other exports (ADR 0090, 0101).
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { parseApiReport, parseExports, reportEntry } from './api-report.ts';

const fixtures = join(import.meta.dirname, '..', 'fixtures', 'api');

describe('parseApiReport', () => {
  it('reads each component and directive with its selector, bindings and host directive', () => {
    const report = readFileSync(join(fixtures, 'avelune-ui-thing.api.md'), 'utf8');
    assert.deepEqual(parseApiReport('thing', report), [
      {
        entry: 'thing',
        className: 'AveThing',
        selector: 'ave-thing',
        inputs: ['label', 'open', 'size', 'multiple'],
        outputs: ['openChange', 'closed'],
        hostInputs: ['multiple'],
        hostOutputs: [],
      },
      {
        entry: 'thing',
        className: 'AveThingItem',
        selector: 'ave-thing-item',
        inputs: ['heading'],
        outputs: [],
        hostInputs: [],
        hostOutputs: [],
      },
      {
        entry: 'thing',
        className: 'AveThingEnd',
        selector: '[aveThingEnd]',
        inputs: [],
        outputs: [],
        hostInputs: [],
        hostOutputs: [],
      },
    ]);
  });

  it('reads every committed report of the kit', () => {
    const root = join(import.meta.dirname, '..', '..', '..', 'packages', 'ui', 'api');
    const found = readdirSync(root).flatMap((file) => {
      const entry = reportEntry(file);
      return entry === undefined ? [] : parseApiReport(entry, readFileSync(join(root, file), 'utf8'));
    });
    assert.ok(found.length > 50);
    for (const component of found) {
      assert.match(component.className, /^Ave[A-Z]\w+$/);
      assert.match(component.selector, /ave/);
    }
  });
});

describe('parseExports', () => {
  it('reads every export that is not internal, with the fields of its interfaces', () => {
    const report = readFileSync(join(fixtures, 'avelune-ui-thing.api.md'), 'utf8');
    assert.deepEqual(
      parseExports('thing', report).map((item) => [item.name, ...item.fields]),
      [
        ['AveThing'],
        ['AveThingItem'],
        ['AveThingEnd'],
        ['AveThingBrand'],
        ['AveThingOption', 'hint', 'title', 'select'],
        ['AveThingSize'],
        ['aveThingPlumbing'],
        ['provideAveThings'],
      ],
    );
  });
});

describe('reportEntry', () => {
  it('names the entry point of a report and skips the testing ones', () => {
    assert.equal(reportEntry('avelune-ui-date-picker.api.md'), 'date-picker');
    assert.equal(reportEntry('avelune-ui-date-picker-testing.api.md'), undefined);
    assert.equal(reportEntry('avelune-ui.api.md'), undefined);
  });
});
