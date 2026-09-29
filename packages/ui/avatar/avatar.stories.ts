import { Component, LOCALE_ID, input } from '@angular/core';
import { applicationConfig, type Meta, type StoryObj } from '@storybook/angular-vite';
import { expect, waitFor, within } from 'storybook/test';
import { AveAvatar } from '@avelune/ui/avatar';

type View = 'default' | 'photos' | 'places';

/** A portrait drawn as SVG in a data URL, so nothing is fetched: a head and shoulders on a plain ground. */
function portrait(ground: string, skin: string, clothes: string): string {
  const markup =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" fill="${ground}"/>` +
    `<circle cx="20" cy="16" r="7" fill="${skin}"/><path d="M6 40c1-9 7-13 14-13s13 4 14 13z" fill="${clothes}"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(markup)}`;
}

const photos = {
  aziza: portrait('#d9d4d2', '#c9956f', '#3e5c76'),
  bakhtiyor: portrait('#cfd8d3', '#a8754f', '#5a4a3c'),
};

/** The frame the stories draw avatars in. Styled with tokens only. */
@Component({
  selector: 'ave-avatar-stories',
  imports: [AveAvatar],
  template: `
    @switch (view()) {
      @case ('photos') {
        <div class="row" lang="ru">
          <ave-avatar name="Азиза Каримова" size="lg" [image]="photos.aziza" />
          <ave-avatar name="Бахтиёр Рахимов" [image]="photos.bakhtiyor" />
          <ave-avatar name="Дилноза Султанова" size="sm" image="data:image/png;base64,broken" />
        </div>
      }
      @case ('places') {
        <ul class="people" aria-label="Согласующие" lang="ru">
          <li class="person">
            <ave-avatar name="Азиза Каримова" [image]="photos.aziza" decorative />
            <span class="who"><span>Азиза Каримова</span><span class="muted">Юридический отдел</span></span>
          </li>
          <li class="person">
            <ave-avatar name="Oʻktam Aliyev" decorative />
            <span class="who" lang="uz-Latn"><span>Oʻktam Aliyev</span><span class="muted">Moliya boʻlimi</span></span>
          </li>
          <li class="person">
            <ave-avatar name="ООО «Мебель Сервис»" kind="organization" decorative />
            <span class="who"><span>ООО «Мебель Сервис»</span><span class="muted">ИНН 305 118 427</span></span>
          </li>
        </ul>
      }
      @default {
        <div class="grid" lang="ru">
          @for (size of sizes; track size) {
            <div class="row">
              <ave-avatar name="Азиза Каримова" [size]="size" />
              <ave-avatar name="Бахтиёр Рахимов" [size]="size" />
              <ave-avatar name="ООО «Мебель Сервис»" kind="organization" [size]="size" />
              <ave-avatar name="АО «Узтелеком»" kind="organization" [size]="size" />
            </div>
          }
        </div>
      }
    }
  `,
  styleUrl: './avatar.stories.css',
})
class AvatarStories {
  readonly view = input<View>('default');
  protected readonly sizes = ['sm', 'md', 'lg'] as const;
  protected readonly photos = photos;
}

type Story = StoryObj<AvatarStories>;

function frame(view: View): NonNullable<Story['render']> {
  return () => ({
    props: { view },
    template: `<ave-avatar-stories [view]="view" />`,
    moduleMetadata: { imports: [AvatarStories] },
  });
}

function source(...lines: readonly string[]): NonNullable<Story['parameters']> {
  return { docs: { source: { code: lines.join('\n'), language: 'html' } } };
}

const meta: Meta<AvatarStories> = {
  title: 'Components/Avatar',
  component: AvatarStories,
  decorators: [applicationConfig({ providers: [{ provide: LOCALE_ID, useValue: 'ru' }] })],
};
export default meta;

/** People as circles and organisations as rounded squares, in the three sizes, by their initials. */
export const Default: Story = {
  tags: ['forced-colors'],
  render: frame('default'),
  parameters: source(
    '<ave-avatar name="Азиза Каримова" size="sm" />',
    '<ave-avatar name="Азиза Каримова" />',
    '<ave-avatar name="ООО «Мебель Сервис»" kind="organization" size="lg" />',
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const [small, medium, large] = canvas.getAllByRole('img', { name: 'Азиза Каримова' });
    await expect(small?.getBoundingClientRect().width).toBe(24);
    await expect(medium?.getBoundingClientRect().width).toBe(32);
    await expect(large?.getBoundingClientRect().width).toBe(40);
    await expect(medium).toHaveTextContent('АК');
    await expect(canvas.getAllByRole('img', { name: 'ООО «Мебель Сервис»' })[0]).toHaveTextContent('МС');
  },
};

/** Photos over the initials, cropped to fill the circle; a photo that fails leaves the initials. */
export const Photos: Story = {
  render: frame('photos'),
  parameters: source('<ave-avatar name="Азиза Каримова" [image]="person.photo" />'),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(() => expect(canvas.getByRole('img', { name: 'Азиза Каримова' })).toHaveAttribute('data-photo', ''));
    // The broken photo never shows: the initials stay.
    const broken = canvas.getByRole('img', { name: 'Дилноза Султанова' });
    await expect(broken).not.toHaveAttribute('data-photo');
    await expect(broken).toHaveTextContent('ДС');
  },
};

/** Beside the name it shows, an avatar is decorative: a list of approvers and a counterparty. */
export const Places: Story = {
  render: frame('places'),
  parameters: source(
    '<li><ave-avatar name="Азиза Каримова" decorative /> Азиза Каримова</li>',
    '<ave-avatar name="ООО «Мебель Сервис»" kind="organization" decorative />',
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryAllByRole('img')).toHaveLength(0);
    await expect(canvas.getByRole('list', { name: 'Согласующие' })).toBeVisible();
    for (const person of canvasElement.querySelectorAll('.person')) {
      const avatar = person.querySelector('ave-avatar')?.getBoundingClientRect();
      const who = person.querySelector('.who')?.getBoundingClientRect();
      await expect((who?.left ?? 0) - (avatar?.right ?? 0)).toBe(12);
    }
  },
};
