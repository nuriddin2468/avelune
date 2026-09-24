// Fixture stories for the visual suite (tools/visual). Each breaks exactly one of its checks; Clean breaks none.
// baselines/ holds light-1280 images for Clean, Changed and Axe violation, a forced-colors image for Clean (the one
// tagged story), and two orphans: one for a story that does not exist, one forced-colors image of an untagged story.
import { Component, input } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular-vite';

@Component({
  selector: 'ave-fixture-note',
  template: `<main>
    <h1>{{ heading() }}</h1>
    <p>Hujjat saqlandi. Документ сохранён.</p>
    @if (unnamedButton()) {
      <button type="button"></button>
    }
  </main>`,
})
class Note {
  readonly heading = input('Draft');
  readonly unnamedButton = input(false);
}

const meta: Meta<Note> = { title: 'Fixtures/Visual', component: Note };
export default meta;

/** Matches its baselines, the forced-colors one too, and passes axe; its docs page lists a boolean control. */
export const Clean: StoryObj<Note> = { args: { heading: 'Clean', unnamedButton: false }, tags: ['forced-colors'] };

/** Its baseline shows "Draft 1": the screenshot differs. */
export const Changed: StoryObj<Note> = { args: { heading: 'Draft 2' } };

/** Has no baseline. */
export const Unbaselined: StoryObj<Note> = { args: { heading: 'New story' } };

/** A button without an accessible name: axe's button-name rule. */
export const AxeViolation: StoryObj<Note> = { args: { heading: 'Axe violation', unnamedButton: true } };

/** Loses the Avelune Sans faces of fonts.css before it renders, so its text falls back to the local fallback face. */
export const FontFallback: StoryObj<Note> = {
  args: { heading: 'Font fallback' },
  loaders: [
    () => {
      for (const sheet of document.styleSheets) {
        for (let index = sheet.cssRules.length - 1; index >= 0; index--) {
          const rule = sheet.cssRules[index];
          const family = rule instanceof CSSFontFaceRule ? rule.style.getPropertyValue('font-family') : '';
          if (family.replace(/["']/g, '') === 'Avelune Sans') sheet.deleteRule(index);
        }
      }
      return {};
    },
  ],
};

/** Its play function throws, which Storybook only logs (throwPlayFunctionExceptions is false by default). */
export const PlayFailure: StoryObj<Note> = {
  args: { heading: 'Play failure' },
  play: () => {
    throw new Error('Fixture: the play function fails');
  },
};
