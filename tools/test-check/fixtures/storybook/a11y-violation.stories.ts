// A button with no accessible name: axe's button-name rule must fail this story.
import { Component } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular-vite';

@Component({ selector: 'ave-fixture-unnamed', template: '<button type="button"></button>' })
class Unnamed {}

const meta: Meta<Unnamed> = { title: 'Fixtures/A11y violation', component: Unnamed };
export default meta;

export const UnnamedButton: StoryObj<Unnamed> = {};
