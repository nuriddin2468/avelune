// A play function whose assertion is false: the story must fail.
import { Component } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { expect } from 'storybook/test';

@Component({ selector: 'ave-fixture-label', template: '<p>Saved</p>' })
class Label {}

const meta: Meta<Label> = { title: 'Fixtures/Play failure', component: Label };
export default meta;

export const WrongText: StoryObj<Label> = {
  play: async ({ canvasElement }) => {
    await expect(canvasElement.textContent).toContain('Deleted');
  },
};
