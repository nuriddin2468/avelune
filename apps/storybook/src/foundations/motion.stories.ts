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
  styles: `
    .grid {
      border-collapse: collapse;
      inline-size: 100%;
    }
    th,
    td {
      padding: var(--ave-space-2) var(--ave-space-3);
      text-align: start;
      vertical-align: middle;
      border-block-end: var(--ave-border-width-default) solid var(--ave-color-border-subtle);
    }
    th {
      font: var(--ave-font-label-md);
    }
    .value {
      display: block;
      font: var(--ave-font-code);
      color: var(--ave-color-fg-muted);
    }
    .description {
      display: block;
      max-inline-size: var(--ave-container-xs);
      font: var(--ave-font-caption);
      color: var(--ave-color-fg-muted);
    }
    .track {
      position: relative;
      display: block;
      inline-size: calc(var(--ave-space-16) * 2);
      block-size: var(--ave-control-height-sm);
      padding: 0;
      border: var(--ave-border-width-default) solid var(--ave-color-border-default);
      border-radius: var(--ave-radius-full);
      background: var(--ave-color-bg-surface-sunken);
      cursor: pointer;
    }
    .track:focus-visible,
    .action:focus-visible,
    .entry-button:focus-visible {
      outline: var(--ave-focus-ring-width) solid var(--ave-color-border-focus);
      outline-offset: var(--ave-focus-ring-offset);
    }
    .dot {
      position: absolute;
      inset-block-start: calc((100% - var(--ave-space-5)) / 2);
      inset-inline-start: var(--ave-space-1);
      inline-size: var(--ave-space-5);
      block-size: var(--ave-space-5);
      border-radius: var(--ave-radius-full);
      background: var(--ave-color-accent-bg);
      transition-property: translate;
    }
    /* The track is 2 × space.16 wide; the dot travels it minus its own size and both insets. */
    .moved {
      translate: calc(var(--ave-space-16) * 2 - var(--ave-space-5) - var(--ave-space-2)) 0;
    }
    .actions {
      display: flex;
      gap: var(--ave-space-2);
    }
    .action {
      block-size: var(--ave-control-height-md);
      padding-inline: var(--ave-control-padding-inline-md);
      border: none;
      border-radius: var(--ave-radius-md);
      background: var(--ave-color-accent-bg);
      color: var(--ave-color-fg-on-accent);
      font: var(--ave-font-label-md);
      cursor: pointer;
    }
    .entries {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, var(--ave-container-xs)), 1fr));
      gap: var(--ave-space-4);
    }
    .entry-button {
      display: grid;
      gap: var(--ave-space-3);
      justify-items: start;
      padding: var(--ave-space-4);
      border: var(--ave-border-width-default) solid var(--ave-color-border-default);
      border-radius: var(--ave-radius-lg);
      background: var(--ave-color-bg-surface);
      color: var(--ave-color-fg-default);
      font: var(--ave-font-body-md);
      text-align: start;
      cursor: pointer;
    }
    .entry-label {
      font: var(--ave-font-label-md);
    }
    .card {
      padding: var(--ave-space-3) var(--ave-space-4);
      border-radius: var(--ave-radius-md);
      border: var(--ave-border-width-default) solid var(--ave-color-border-subtle);
      background: var(--ave-color-bg-surface-raised);
      box-shadow: var(--ave-elevation-popover);
      transition-property: opacity, translate, scale;
      transition-duration: var(--ave-duration-normal);
      transition-timing-function: var(--ave-easing-enter);
    }
    .hidden {
      opacity: 0;
      translate: 0 var(--offset);
      scale: var(--scale);
      transition-duration: var(--ave-duration-fast);
      transition-timing-function: var(--ave-easing-exit);
    }
    .timings {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, var(--ave-container-xs)), 1fr));
      gap: var(--ave-space-4);
      margin: 0;
    }
    dt {
      font: var(--ave-font-label-md);
    }
    dd {
      margin: 0;
      color: var(--ave-color-fg-muted);
    }
  `,
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
