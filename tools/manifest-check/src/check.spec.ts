// Proves every rule of the manifest check on a small built Storybook in `fixtures/storybook` (ADR 0090): the clean
// fixture passes, and each change an agent would miss fails with its own message.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { parseApiReport } from './api-report.ts';
import { manifestProblems, names, selectorName, type CheckInput } from './check.ts';
import { framesOf } from './frames.ts';
import { readManifest, type Docgen, type ManifestEntry, type StoryDoc } from './manifest.ts';

const fixtures = join(import.meta.dirname, '..', 'fixtures');
const components = parseApiReport('thing', readFileSync(join(fixtures, 'api', 'avelune-ui-thing.api.md'), 'utf8'));
const entries = readManifest(join(fixtures, 'storybook'));
const frames = framesOf(readFileSync(join(fixtures, 'thing.stories.ts'), 'utf8'));
const clean: CheckInput = { components, entries, frames, exempt: new Map() };

const thing = (): ManifestEntry => {
  const entry = entries.find((candidate) => candidate.id === 'components-thing');
  assert.ok(entry);
  return entry;
};

const docgen = (): Docgen => {
  const found = thing().docgen;
  assert.ok(found);
  return found;
};

/** The clean input with the thing's entry changed. */
function withThing(change: (entry: ManifestEntry) => ManifestEntry): CheckInput {
  return { ...clean, entries: entries.map((entry) => (entry.id === 'components-thing' ? change(entry) : entry)) };
}

/** An entry without its docgen, as a story file without `meta.component` gives. */
function withoutDocgen(entry: ManifestEntry): ManifestEntry {
  const { docgen: removed, ...rest } = entry;
  assert.ok(removed);
  return rest;
}

function withStory(change: (story: StoryDoc) => StoryDoc): CheckInput {
  return withThing((entry) => ({ ...entry, stories: entry.stories.map((s, i) => (i === 0 ? change(s) : s)) }));
}

describe('the clean fixture', () => {
  it('reads the manifest through its references', () => {
    assert.equal(thing().storiesPath, 'packages/ui/thing/thing.stories.ts');
    assert.deepEqual(thing().docgen?.inputs, ['label', 'open']);
    assert.equal(thing().stories.length, 2);
    assert.match(thing().docs, /<ave-thing-item/);
  });

  it('has no problems', () => {
    assert.deepEqual(manifestProblems(clean), []);
  });
});

describe('stories', () => {
  it('fails a story without a snippet', () => {
    assert.deepEqual(
      manifestProblems(
        withStory((story) => {
          const { snippet, ...rest } = story;
          assert.ok(snippet);
          return rest;
        }),
      ),
      [
        'components-thing: story "Default" has no snippet: set parameters.docs.source.code to the markup an application writes',
      ],
    );
  });

  it('fails an incomplete snippet', () => {
    assert.deepEqual(
      manifestProblems(
        withStory((story) => ({ ...story, warning: "Incomplete snippet: `render: frame('long')`\nmore" })),
      ),
      ['components-thing: story "Default" has an incomplete snippet: Incomplete snippet: `render: frame(\'long\')`'],
    );
  });

  it('fails a snippet that failed', () => {
    assert.deepEqual(manifestProblems(withStory((story) => ({ ...story, error: 'Unexpected token' }))), [
      'components-thing: story "Default": the snippet failed: Unexpected token',
    ]);
  });

  it('fails a snippet that shows a frame, by its selector or its class', () => {
    assert.deepEqual(manifestProblems(withStory((story) => ({ ...story, snippet: '<ave-thing-stories />' }))), [
      'components-thing: story "Default": the snippet shows the story frame ave-thing-stories',
    ]);
    assert.deepEqual(manifestProblems(withStory((story) => ({ ...story, snippet: 'imports: [ThingStories]' }))), [
      'components-thing: story "Default": the snippet shows the story frame ThingStories',
    ]);
  });

  it('leaves stories outside the kit alone', () => {
    const foundations = entries.find((entry) => entry.id === 'foundations-colour');
    assert.equal(foundations?.stories[0]?.snippet, undefined);
  });
});

describe('components', () => {
  it('fails a story file without the kit’s component', () => {
    // Without docgen, the inputs and outputs the docs page does not name are lost too.
    assert.deepEqual(manifestProblems(withThing(withoutDocgen)), [
      'components-thing has no component: set its meta.component to AveThing or AveThingItem or AveThingEnd',
      'AveThing (@avelune/ui/thing): the input "open" is neither in docgen nor named on its docs page',
      'AveThing (@avelune/ui/thing): the output "closed" is neither in docgen nor named on its docs page',
    ]);
  });

  it('fails a story file whose component is its frame', () => {
    assert.deepEqual(
      manifestProblems(withThing((entry) => ({ ...entry, docgen: { ...docgen(), className: 'ThingStories' } }))),
      [
        "components-thing: its component is ThingStories, not the kit's (AveThing, AveThingItem, AveThingEnd)",
        'AveThing (@avelune/ui/thing): the input "open" is neither in docgen nor named on its docs page',
        'AveThing (@avelune/ui/thing): the output "closed" is neither in docgen nor named on its docs page',
      ],
    );
  });

  it('fails when docgen failed', () => {
    assert.deepEqual(manifestProblems(withThing((entry) => ({ ...entry, docgenError: 'no class' }))), [
      'components-thing: docgen failed: no class',
    ]);
  });

  it('fails a component with no story file', () => {
    const [first] = components;
    assert.ok(first);
    const lonely = { ...first, entry: 'lonely', className: 'AveLonely' };
    assert.deepEqual(manifestProblems({ ...clean, components: [...components, lonely] }), [
      'AveLonely (@avelune/ui/lonely) has no story file or docs page in the manifest',
    ]);
  });

  it('fails an input neither in docgen nor on the docs page', () => {
    const problems = manifestProblems(
      withThing((entry) => ({
        ...entry,
        docgen: { ...docgen(), inputs: ['open'] },
        docs: entry.docs.replace(' label="Условия"', ''),
      })),
    );
    assert.deepEqual(problems, [
      'AveThing (@avelune/ui/thing): the input "label" is neither in docgen nor named on its docs page',
    ]);
  });

  it('accepts a host directive’s input named on the docs page, and fails it once the page drops it', () => {
    assert.deepEqual(components[0]?.hostInputs, ['multiple']);
    const problems = manifestProblems(
      withThing((entry) => ({ ...entry, docs: entry.docs.replace('`multiple`', 'Several') })),
    );
    assert.deepEqual(problems, [
      'AveThing (@avelune/ui/thing): the input "multiple" is neither in docgen nor named on its docs page',
    ]);
  });

  it('fails a plain output neither in docgen nor on the docs page; a model’s change event comes with its input', () => {
    const problems = manifestProblems(withThing((entry) => ({ ...entry, docgen: { ...docgen(), outputs: [] } })));
    assert.deepEqual(problems, [
      'AveThing (@avelune/ui/thing): the output "closed" is neither in docgen nor named on its docs page',
    ]);
  });

  it('fails an input without a description', () => {
    const problems = manifestProblems(
      withThing((entry) => ({ ...entry, docgen: { ...docgen(), undescribed: ['open'] } })),
    );
    assert.deepEqual(problems, ['AveThing (@avelune/ui/thing): the input "open" has no description in docgen']);
  });

  it('fails a part the docs page does not name, and a part’s input it does not name', () => {
    assert.deepEqual(
      manifestProblems(withThing((entry) => ({ ...entry, docs: entry.docs.replace(' aveThingEnd>', '>') }))),
      ["AveThingEnd (@avelune/ui/thing) is neither a story file's component nor named on its docs page"],
    );
    assert.deepEqual(
      manifestProblems(withThing((entry) => ({ ...entry, docs: entry.docs.replace(' heading="Штрафы"', '') }))),
      ['AveThingItem (@avelune/ui/thing): the input "heading" is neither in docgen nor named on its docs page'],
    );
  });

  it('skips an exempt entry point', () => {
    const problems = manifestProblems({
      ...withThing((entry) => ({ ...withoutDocgen(entry), docs: '' })),
      exempt: new Map([['thing', 'plumbing']]),
    });
    assert.deepEqual(problems, []);
  });
});

describe('names and selectors', () => {
  it('names a binding in code quotes or in markup, not as a plain word', () => {
    assert.ok(names('the `open` input', 'open'));
    assert.ok(names('<ave-x [open]="a">', 'open'));
    assert.ok(names('<ave-x [(open)]="a">', 'open'));
    assert.ok(names('<ave-x (closed)="a()">', 'closed'));
    assert.ok(names('<ave-x open>', 'open'));
    assert.ok(names('<ave-x-item heading="a">', 'ave-x-item'));
    assert.ok(!names('it opens when open', 'open'));
    assert.ok(!names('<ave-x openAll>', 'open'));
  });

  it('takes the kit’s attribute, or the element', () => {
    assert.equal(selectorName('button[aveButton], a[aveButton]'), 'aveButton');
    assert.equal(selectorName('input[type=checkbox][aveCheckbox]'), 'aveCheckbox');
    assert.equal(selectorName('ng-template[aveCell]'), 'aveCell');
    assert.equal(selectorName('ave-accordion-item'), 'ave-accordion-item');
  });
});
