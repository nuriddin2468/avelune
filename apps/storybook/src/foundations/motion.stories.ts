import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { tokens, type TokenName } from '@avelune/tokens';
import { DocsPage, DocsScroll, DocsSection } from './docs-page';
import { cssVar, description, namesUnder } from './token-data';

@Component({
  selector: 'ave-docs-motion',
  imports: [DocsPage, DocsScroll, DocsSection],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ave-docs-page heading="Motion">
      <span lead
        >Five durations and four easings (brief §6.2). Press a row to play it; each run is a CSS transition of
        translate, timed by the tokens. Set Motion to reduced in the toolbar: slow and slower shorten to 150ms,
        distances become 0 and nothing scales.</span
      >
      <ave-docs-section heading="Duration × easing">
        <ave-docs-scroll label="Duration and easing playground">
          <table class="grid">
            <thead>
              <tr>
                <th scope="col">Easing</th>
                @for (duration of durations; track duration) {
                  <th scope="col">
                    {{ short(duration) }} <span class="value">{{ css(duration) }}</span>
                  </th>
                }
              </tr>
            </thead>
            <tbody>
              @for (easing of easings; track easing) {
                <tr>
                  <th scope="row">
                    {{ short(easing) }}
                    <span class="description">{{ describe(easing) }}</span>
                  </th>
                  @for (duration of durations; track duration) {
                    <td>
                      <button
                        type="button"
                        class="track"
                        [attr.aria-label]="'Play ' + short(duration) + ' with ' + short(easing)"
                        [attr.aria-pressed]="played().has(easing + duration)"
                        (click)="toggle(easing + duration)"
                      >
                        <span
                          class="dot"
                          [class.moved]="played().has(easing + duration)"
                          [style.transition-duration]="variable(duration)"
                          [style.transition-timing-function]="variable(easing)"
                        ></span>
                      </button>
                    </td>
                  }
                </tr>
              }
            </tbody>
          </table>
        </ave-docs-scroll>
        <div class="actions">
          <button type="button" class="action" (click)="playAll()">Play all</button>
        </div>
      </ave-docs-section>
      <ave-docs-section
        heading="Entry distance and scale"
        note="Popping elements enter from 97% scale; tooltips, menus and toasts enter from these offsets."
      >
        <div class="entries">
          @for (entry of entries; track entry.label) {
            <button
              type="button"
              class="entry-button"
              [attr.aria-pressed]="shown().has(entry.label)"
              (click)="toggleEntry(entry.label)"
            >
              <span class="entry-label">{{ entry.label }}</span>
              <span
                class="card"
                [class.hidden]="!shown().has(entry.label)"
                [style.--offset]="entry.offset ? variable(entry.offset) : '0px'"
                [style.--scale]="entry.scale ? variable(entry.scale) : '1'"
              >
                Hujjat saqlandi · Документ сохранён
              </span>
            </button>
          }
        </div>
      </ave-docs-section>
      <ave-docs-section heading="Timings" note="Delays, holds and loop periods of the motion catalog (brief §6.3).">
        <dl class="timings">
          @for (name of timings; track name) {
            <div>
              <dt>
                {{ name }} <span class="value">{{ css(name) }}</span>
              </dt>
              <dd>{{ describe(name) }}</dd>
            </div>
          }
        </dl>
      </ave-docs-section>
    </ave-docs-page>
  `,
  styleUrl: './docs-motion.css',
})
class Motion {
  protected readonly durations = namesUnder('duration.');
  protected readonly easings = namesUnder('easing.');
  protected readonly timings = namesUnder('timing.');
  protected readonly entries: readonly { label: string; offset?: TokenName; scale?: TokenName }[] = [
    { label: 'Tooltip: distance sm', offset: 'motion.distance.sm' },
    { label: 'Menu, popover: scale enter', scale: 'motion.scale.enter' },
    { label: 'Toast: distance lg', offset: 'motion.distance.lg' },
  ];
  protected readonly played = signal<ReadonlySet<string>>(new Set());
  protected readonly shown = signal<ReadonlySet<string>>(new Set());

  protected toggle(key: string): void {
    this.played.update((played) => {
      const next = new Set(played);
      if (!next.delete(key)) next.add(key);
      return next;
    });
  }

  protected playAll(): void {
    const all = this.easings.flatMap((easing) => this.durations.map((duration) => easing + duration));
    this.played.update((played) => (played.size === all.length ? new Set() : new Set(all)));
  }

  protected toggleEntry(label: string): void {
    this.shown.update((shown) => {
      const next = new Set(shown);
      if (!next.delete(label)) next.add(label);
      return next;
    });
  }

  protected variable(name: TokenName): string {
    return `var(${cssVar(name)})`;
  }
  protected css(name: TokenName): string {
    return tokens[name].css.startsWith('linear(') ? 'linear() spring' : tokens[name].css;
  }
  protected short(name: TokenName): string {
    return name.split('.').at(-1) ?? name;
  }
  protected describe(name: TokenName): string {
    return description(name);
  }
}

const meta: Meta = { title: 'Foundations/Motion' };
export default meta;

export const Playground: StoryObj = {
  render: () => ({ template: `<ave-docs-motion />`, moduleMetadata: { imports: [Motion] } }),
};
