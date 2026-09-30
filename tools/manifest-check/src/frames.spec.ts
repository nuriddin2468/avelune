// Proves that a story file's own components are found, so no snippet can show one (ADR 0090).
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { framesOf, kitFrames } from './frames.ts';

describe('framesOf', () => {
  it('finds the selector and class of a frame', () => {
    const source = readFileSync(join(import.meta.dirname, '..', 'fixtures', 'thing.stories.ts'), 'utf8');
    assert.deepEqual(framesOf(source), { selectors: ['ave-thing-stories'], classNames: ['ThingStories'] });
  });

  it('leaves out a component written inside a snippet', () => {
    const source = [
      "@Component({ selector: 'ave-thing-stories', template: '' })",
      'class ThingStories {}',
      'const code = `@Component({',
      "  selector: 'app-contract-terms',",
      '})',
      'export class ContractTerms {}`;',
    ].join('\n');
    assert.deepEqual(framesOf(source), { selectors: ['ave-thing-stories'], classNames: ['ThingStories'] });
  });

  it('finds the frames of the kit’s story files', () => {
    const frames = kitFrames(join(import.meta.dirname, '..', '..', '..', 'packages', 'ui'));
    assert.ok(frames.selectors.includes('ave-accordion-stories'));
    assert.ok(frames.classNames.includes('AccordionStories'));
  });
});
