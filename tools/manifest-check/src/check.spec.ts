// Proves every rule of the manifest check on a small built Storybook in `fixtures/storybook` (ADR 0090, 0101, 0102):
// the clean fixture passes, and each change an agent would miss fails with its own message.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { parseApiReport, parseExports } from './api-report.ts';
import {
  looseEllipsis,
  manifestProblems,
  names,
  namesField,
  selectorName,
  snippetKind,
  type CheckInput,
} from './check.ts';
import { framesOf } from './frames.ts';
import { readManifest, type Docgen, type ManifestEntry, type StoryDoc } from './manifest.ts';

const fixtures = join(import.meta.dirname, '..', 'fixtures');
const report = readFileSync(join(fixtures, 'api', 'avelune-ui-thing.api.md'), 'utf8');
const components = parseApiReport('thing', report);
const entries = readManifest(join(fixtures, 'storybook'));
const frames = framesOf(readFileSync(join(fixtures, 'thing.stories.ts'), 'utf8'));
const clean: CheckInput = {
  components,
  exports: parseExports('thing', report),
  entries,
  frames,
  css: { variables: ['--ave-color-bg-surface'], classes: ['ave-tabular-nums'] },
  exempt: new Map(),
  exemptExports: new Map([['aveThingPlumbing', 'the thing gives it to another entry point']]),
};

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
    assert.deepEqual(thing().docgen?.inputs, ['label', 'open', 'size']);
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

  it('fails a snippet Storybook derived from the args', () => {
    const derived = [
      '@Component({',
      "  selector: 'app-demo',",
      '  template: `<ave-thing label="Условия" [size]="size" />`,',
      '})',
      'export class DemoComponent {',
      "  size = 'md';",
      '}',
    ].join('\n');
    assert.deepEqual(manifestProblems(withStory((story) => ({ ...story, snippet: derived }))), [
      'components-thing: story "Default": Storybook derived the snippet from the story\'s args, whose fields are ' +
        "strings where inputs take unions ('md'): set parameters.docs.source.code (ADR 0101)",
    ]);
  });

  it('fails a snippet that leaves something out with an ellipsis, and accepts one that ends a word', () => {
    assert.deepEqual(
      manifestProblems(withStory((story) => ({ ...story, snippet: '<ave-thing label="Условия">…</ave-thing>' }))),
      [
        'components-thing: story "Default": the snippet leaves something out with "…" ' +
          '(<ave-thing label="Условия">…</ave-thing>): write it, or name it in a comment (ADR 0101)',
      ],
    );
    assert.equal(looseEllipsis('<ave-thing [open]="…" label="a" />'), '<ave-thing [open]="…" label="a" />');
    assert.equal(looseEllipsis("items = [{ label: 'a' }, …];"), "items = [{ label: 'a' }, …];");
    assert.equal(looseEllipsis('<ave-thing label="Загрузка…" />'), undefined);
    assert.equal(looseEllipsis('<span>Kapitalbank, …1098</span>'), undefined);
    assert.equal(looseEllipsis('<span>{{ bank }}, …{{ number.slice(-4) }}</span>'), undefined);
    assert.equal(looseEllipsis('<p>2. Сроки. …</p>'), '<p>2. Сроки. …</p>');
    assert.equal(looseEllipsis('<ave-thing label="a">\n  <!-- the items… -->\n</ave-thing>'), undefined);
    assert.equal(looseEllipsis('// the other commands …\nconst a = 1;'), undefined);
  });

  it('fails a snippet that mixes markup and TypeScript outside a component', () => {
    const mixed = '<ave-thing label="Условия" [(open)]="open" />\n\nreadonly open = signal(false);';
    assert.deepEqual(manifestProblems(withStory((story) => ({ ...story, snippet: mixed }))), [
      'components-thing: story "Default": the snippet mixes markup and TypeScript: write the markup alone, or a ' +
        'whole component (ADR 0101)',
    ]);
    assert.equal(snippetKind('readonly open = signal(false);\n\n// <ave-thing label="a" [(open)]="open" />'), 'mixed');
    assert.equal(snippetKind('{ value: \'a\', label: \'A\' }\n<ave-thing label="a" [items]="items" />'), 'mixed');
    assert.equal(snippetKind('<ave-thing\n  label="a"\n  [items]="[\n    { label: \'b\' }\n  ]"\n/>'), 'markup');
    assert.equal(
      snippetKind(
        '@Component({\n  template: `<ave-thing label="a" />`,\n})\nexport class Things {\n  readonly open = signal(false);\n}',
      ),
      'component',
    );
  });

  it('fails a snippet that is TypeScript outside a component', () => {
    const fragment = "private readonly things = inject(AveThings);\n\nthis.things.show({ label: 'a' });";
    assert.equal(snippetKind("this.things.show({ label: 'a' });"), 'fragment');
    assert.deepEqual(manifestProblems(withStory((story) => ({ ...story, snippet: fragment }))), [
      'components-thing: story "Default": the snippet is TypeScript outside a component: write the whole component, ' +
        'its imports, @Component and the fields it uses (ADR 0101)',
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

  it('fails a component whose JSDoc has a tag other than a release tag', () => {
    assert.deepEqual(
      manifestProblems(withThing((entry) => ({ ...entry, docgen: { ...docgen(), tags: ['alpha', 'for'] } }))),
      [
        'components-thing: the JSDoc of AveThing has a @for tag, which cuts its description there: TypeScript reads ' +
          '"@for" after white space as a tag, in a code fence too; keep control flow out of JSDoc examples (ADR 0101)',
      ],
    );
  });

  it('fails an input typed by an alias whose members its JSDoc does not name', () => {
    const members = (change: (description: string) => string, type = 'AveThingSize') =>
      withThing((entry) => ({
        ...entry,
        docgen: {
          ...docgen(),
          members: docgen().members.map((member) =>
            member.name === 'size' ? { ...member, type, description: change(member.description) } : member,
          ),
        },
      }));
    assert.deepEqual(manifestProblems(members((description) => description.replace(' or `md`', ''))), [
      'components-thing: the input "size" is typed AveThingSize, and its JSDoc does not name `md` (ADR 0101)',
    ]);
    // A union docgen shows as written names its members itself.
    assert.deepEqual(manifestProblems(members(() => 'The size.', "'sm' | 'md'")), []);
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

  it('fails an export that no docs page, JSDoc or input type names, and skips internal and exempt ones', () => {
    const exports = clean.exports.map((item) => item.name);
    assert.ok(!exports.includes('aveThingOrder'));
    assert.ok(exports.includes('AveThingBrand'));
    const standalone = { ...clean, entries: entries.filter((entry) => entry.id !== 'guides-things--docs') };
    assert.deepEqual(manifestProblems(standalone), [
      'AveThingBrand (@avelune/ui/thing) is named on no docs page, JSDoc or input type of its entry point (ADR 0101)',
      'provideAveThings (@avelune/ui/thing) is named on no docs page, JSDoc or input type of its entry point (ADR 0101)',
    ]);
    assert.deepEqual(manifestProblems({ ...clean, exemptExports: new Map() }), [
      'aveThingPlumbing (@avelune/ui/thing) is named on no docs page, JSDoc or input type of its entry point (ADR 0101)',
    ]);
  });

  it('fails an interface’s field that no docs page or JSDoc names', () => {
    assert.deepEqual(clean.exports.find((item) => item.name === 'AveThingOption')?.fields, ['hint', 'title', 'select']);
    assert.deepEqual(
      manifestProblems(withThing((entry) => ({ ...entry, docs: entry.docs.replace('`hint`', 'a hint') }))),
      ['AveThingOption.hint (@avelune/ui/thing) is named on no docs page or JSDoc of its entry point (ADR 0101)'],
    );
  });

  it('fails an entry point with exports and no page at all', () => {
    const lonely = { entry: 'lonely', name: 'provideLonely', fields: [] };
    assert.deepEqual(manifestProblems({ ...clean, exports: [...clean.exports, lonely] }), [
      '@avelune/ui/lonely has no story file or docs page in the manifest (ADR 0101)',
    ]);
  });

  it('skips an exempt entry point', () => {
    const problems = manifestProblems({
      ...withThing((entry) => ({ ...withoutDocgen(entry), docs: '' })),
      exempt: new Map([['thing', 'plumbing']]),
    });
    assert.deepEqual(problems, []);
  });
});

describe('foundations', () => {
  it('fails a public token or a global class that no Foundations docs page names', () => {
    const problems = manifestProblems({
      ...clean,
      css: { variables: ['--ave-color-bg-surface', '--ave-space-4'], classes: ['ave-tabular-nums', 'ave-motion-spin'] },
    });
    assert.deepEqual(problems, [
      'the token --ave-space-4 is on no Foundations docs page (ADR 0102)',
      'the class ave-motion-spin of the global stylesheet is on no Foundations docs page (ADR 0102)',
    ]);
  });

  it('reads a token only from a Foundations page, not from a component’s', () => {
    const elsewhere = entries.map((entry) =>
      entry.id === 'foundations-colour'
        ? { ...entry, docs: '' }
        : { ...entry, docs: `${entry.docs} --ave-color-bg-surface ave-tabular-nums` },
    );
    assert.equal(manifestProblems({ ...clean, entries: elsewhere }).length, 2);
  });
});

describe('names and selectors', () => {
  it('names a field in code quotes, as a key or as a read', () => {
    assert.ok(namesField('the `direction` of a sort', 'direction'));
    assert.ok(namesField('call `dismiss()`', 'dismiss'));
    assert.ok(namesField("{ column: 'amount', direction: 'ascending' }", 'direction'));
    assert.ok(namesField('`sort.direction`', 'direction'));
    assert.ok(namesField('if (ref.closed)', 'closed'));
    assert.ok(!namesField('the direction of a sort', 'direction'));
    assert.ok(!namesField('<ave-thing label="a">', 'label'));
  });

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
